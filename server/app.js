import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { errorMiddleware, notFound } from "./middleware/errorMiddleware.js";
import { apiRouter } from "./routes/index.js";
import { discovery, render } from "./services/seo.js";

const dist = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
export const app = express();
const clientOrigin = new URL(
  process.env.CLIENT_URL || process.env.SITE_URL || "http://localhost:5173",
).origin;

app.disable("x-powered-by");
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || origin === clientOrigin),
    credentials: true,
  }),
);
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});
app.use("/api", apiRouter);

for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt"])
  app.get(
    path,
    asyncRoute(async (req, res) => {
      res
        .type(req.path.endsWith(".xml") ? "application/xml" : "text/plain")
        .send(await discovery(req.path));
    }),
  );

app.use(
  express.static(dist, {
    setHeaders(res, file) {
      res.setHeader(
        "Cache-Control",
        /[\\/]assets[\\/].*\.(?:js|css)$/.test(file)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=86400",
      );
    },
  }),
);
app.use((req, res, next) =>
  extname(req.path) && extname(req.path) !== ".html"
    ? next(Object.assign(new Error("Not found"), { status: 404 }))
    : next(),
);
app.get(
  "/{*path}",
  asyncRoute(async (req, res) => {
    const result = await render(
      await readFile(resolve(dist, "index.html"), "utf8"),
      req.path,
    );
    res
      .status(result.status)
      .set("Cache-Control", "no-cache")
      .send(result.html);
  }),
);
app.use(notFound);
function asyncRoute(handler) {
  return (req, res, next) => void handler(req, res, next).catch(next);
}
app.use(errorMiddleware);
