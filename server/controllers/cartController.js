import { cart } from "../services/cart.js";

export async function cartController(req, res, next) {
  try {
    res.json(await cart(req, res, req.body || {}));
  } catch (error) {
    next(error);
  }
}
