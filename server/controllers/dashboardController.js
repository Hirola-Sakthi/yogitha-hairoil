import { all, count } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { status } from "../services/integrations.js";
import { check } from "../utils/validate.js";

export async function dashboardController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && ["owner", "manager", "editor"].includes(account.role),
      "Admin access required",
      403,
    );
    check(account.role !== "editor", "Content editor permission required", 403);
    check(req.method === "GET", "Method not allowed", 405);
    const payments = await all("payments"),
      refunds = await all("refunds");
    res.json({
      orders: (await all("orders")).length,
      customers: await count("users", { role: "customer" }),
      leads: (await all("leads")).filter((lead) => lead.status === "new")
        .length,
      revenuePaise:
        payments
          .filter((payment) => ["paid", "refunded"].includes(payment.status))
          .reduce((sum, payment) => sum + payment.amountPaise, 0) -
        refunds
          .filter((refund) => refund.status === "processed")
          .reduce((sum, refund) => sum + refund.amountPaise, 0),
      recentOrders: (await all("orders")).slice(0, 6),
      integrations: status(),
    });
  } catch (error) {
    next(error);
  }
}
