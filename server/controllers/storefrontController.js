import { isPublished } from "../../src/shared/publication.js";
import { all, get } from "../models/db.js";
import { status } from "../services/integrations.js";

export async function storefrontController(req, res, next) {
  try {
    if (req.method !== "GET")
      return next(
        Object.assign(new Error("Method not allowed"), { status: 405 }),
      );
    const reviews = (await all("reviews"))
      .filter(
        (review) => String(review.status || "").toLowerCase() === "approved",
      )
      .sort(
        (a, b) =>
          (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
      )
      .map(({ email, userId, status: reviewStatus, ...review }) => ({
        ...review,
        status: String(reviewStatus).toLowerCase(),
      }));
    res.json({
      settings: await get("settings", "store"),
      products: (await all("products")).filter(
        (product) => product.status === "active",
      ),
      posts: (await all("posts")).filter(isPublished),
      categories: await all("categories"),
      policies: (await all("policies")).filter(isPublished),
      reviews,
      homeReviews: reviews.slice(0, 5),
      checkout: {
        cod: status().cod,
        onlinePayments: status().onlinePayments,
        razorpayKeyId: status().razorpay.keyId,
        razorpayMode: status().razorpay.mode,
      },
    });
  } catch (error) {
    next(error);
  }
}
