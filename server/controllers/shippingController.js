import { get } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { quoteShiprocketShipping } from "../services/integrations.js";
import { resolveCheckoutItems } from "../services/checkoutItems.js";
import { check } from "../utils/validate.js";

export async function quoteShipping(req, res, next) {
  try {
    const account = await user(req);
    check(account, "Please sign in to continue", 401);
    const items = await resolveCheckoutItems(req.body || {});
    const fallbackPaise = (await get("settings", "store")).shippingPaise || 0;
    res.json(
      await quoteShiprocketShipping({
        deliveryPostcode: req.body.address?.pincode,
        items,
        paymentMethod: req.body.paymentMethod,
        declaredValue: items.reduce((sum, item) => sum + item.subtotalPaise, 0),
        fallbackPaise,
      }),
    );
  } catch (error) {
    next(error);
  }
}
