export const preview = import.meta.env.VITE_DEMO === "true";
export const requestId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    (n || 0) / 100,
  );
export const date = (s) =>
  s
    ? new Date(s).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
export async function api(path, options = {}) {
  if (preview) return (await import("./demo.js")).demo(path, options);
  const r = await fetch("/api" + path, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let d;
  try {
    d = await r.json();
  } catch {
    throw new Error("The API is unavailable. Start the Node backend.");
  }
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
