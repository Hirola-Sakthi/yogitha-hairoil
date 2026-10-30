export const isPublished = record => record.status === "published" && (!record.publishedAt || Date.parse(record.publishedAt) <= Date.now());
