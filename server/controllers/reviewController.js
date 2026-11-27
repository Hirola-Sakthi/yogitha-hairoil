import { all, now, put } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { check, text } from "../utils/validate.js";

export async function createReview(req, res, next) {
  try {
    const account = await user(req);
    check(account, "Please sign in to continue", 401);
    const body = req.body || {};
    check(
      Number.isInteger(body.rating) &&
        body.rating >= 1 &&
        body.rating <= 5 &&
        text(body.content),
      "Rating and review required",
    );
    check(
      (await all("orders")).some(
        (order) =>
          order.userId === account.id &&
          (order.productId === body.productId ||
            order.items?.some((item) => item.productId === body.productId)) &&
          order.status === "delivered",
      ),
      "Reviews are available after delivery",
      403,
    );
    check(
      !(await all("reviews")).some(
        (review) =>
          review.userId === account.id && review.productId === body.productId,
      ),
      "Already reviewed",
      409,
    );
    res.json(
      await put("reviews", {
        userId: account.id,
        name: account.name,
        email: account.email,
        productId: body.productId,
        rating: body.rating,
        content: text(body.content, 3000),
        status: "pending",
        createdAt: now(),
      }),
    );
  } catch (error) {
    next(error);
  }
}
