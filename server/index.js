import { app } from "./app.js";

export { app };

if (process.env.NODE_ENV !== "test")
  app.listen(Number(process.env.PORT || 4000), "0.0.0.0", () =>
    console.log(
      "Storefront and shared API listening on " + (process.env.PORT || 4000),
    ),
  );
