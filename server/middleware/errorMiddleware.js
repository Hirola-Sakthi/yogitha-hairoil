export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed")
    Object.assign(error, { status: 400, message: "Invalid JSON" });
  if (error.type === "entity.too.large")
    Object.assign(error, { status: 413, message: "Request too large" });
  if (error.code === 11000)
    Object.assign(error, {
      status: 409,
      message: "A record with these details already exists.",
    });
  if (!error.status) console.error(error.message);
  res.status(error.status || 500).json({
    error: error.status ? error.message : "Request failed. Please try again.",
  });
}
