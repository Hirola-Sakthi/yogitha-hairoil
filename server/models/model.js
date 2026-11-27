import { mongoose } from "../config/db.js";

export function defineModel(name, collection, fields) {
  return (
    mongoose.models[name] ||
    mongoose.model(
      name,
      new mongoose.Schema(fields, {
        collection,
        // Older documents can carry fields introduced before this model layer.
        // Keeping them during the cutover prevents a replacement write from
        // silently discarding data. Request validation remains the boundary
        // for API input; schemas provide casting and a documented data shape.
        strict: false,
        versionKey: false,
        minimize: false,
      }),
    )
  );
}
