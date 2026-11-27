import { all, audit, get, now, put, remove, tx } from "../models/db.js";
import { user } from "../middleware/auth.js";
import { payload, ship, status } from "../services/integrations.js";
import { adjustCheckoutStock } from "../services/checkoutItems.js";
import { check, text, validate } from "../utils/validate.js";

const adminRoles = ["owner", "manager", "editor"];
const editorResources = ["posts", "categories", "policies", "reviews"];

const routeParts = (req) => {
  const path = new URL(req.originalUrl, "http://localhost").pathname;
  return path
    .replace(/^\/api\/admin\/?/, "")
    .split("/")
    .filter(Boolean);
};

async function updateOrder(account, id, body) {
  return tx(async () => {
    const order = await get("orders", id);
    check(order, "Order not found", 404);
    check(
      (
        {
          placed: ["confirmed", "cancelled"],
          confirmed: ["processing", "cancelled"],
          processing: ["shipped", "cancelled"],
          shipped: ["delivered"],
        }[order.status] || []
      ).includes(body.status),
      "Invalid order transition",
    );
    if (body.status === "shipped")
      check(order.shipment?.awb, "Assign a tracking AWB first");
    if (body.status === "cancelled") {
      check(
        !order.shipment,
        "Reconcile booked shipments in Shiprocket before cancellation",
      );
      await adjustCheckoutStock(
        order.items || [
          {
            productId: order.productId,
            variantId: order.variantId,
            quantity: order.quantity,
            name: order.productName,
            sizeLabel: order.sizeLabel,
          },
        ],
        1,
      );
    }
    await audit(account, `Order ${id}: ${body.status}`);
    return put("orders", {
      ...order,
      status: body.status,
      timeline: [...(order.timeline || []), { status: body.status, at: now() }],
    });
  });
}

async function updatePayment(account, id, body) {
  return tx(async () => {
    const payment = await get("payments", id);
    check(
      payment?.status === "pending" &&
        body.status === "paid" &&
        text(body.reference),
      "Pending payment and collection reference required",
    );
    const order = await get("orders", payment.orderId);
    check(payment.method === "cod", "Online payments are verified by Razorpay");
    check(
      order?.status === "delivered",
      "Record COD collection after delivery",
    );
    await put("orders", { ...order, paymentStatus: "paid" });
    await audit(account, `Recorded collection ${id}`);
    return put("payments", {
      ...payment,
      status: "paid",
      reference: text(body.reference),
    });
  });
}

async function updateRefund(account, id, body) {
  return tx(async () => {
    const refund = await get("refunds", id);
    check(refund, "Refund not found", 404);
    check(
      (
        {
          requested: ["approved", "rejected"],
          approved: ["processed", "rejected"],
        }[refund.status] || []
      ).includes(body.status),
      "Invalid refund transition",
    );
    if (body.status === "processed") {
      check(
        text(body.reference),
        "Enter the reference of the refund actually sent",
      );
      const order = await get("orders", refund.orderId);
      check(order?.paymentStatus === "paid", "Order is not paid");
      await put("orders", { ...order, paymentStatus: "refunded" });
      await put("payments", {
        ...(await get("payments", "PAY-" + order.id)),
        status: "refunded",
      });
    }
    await audit(account, `Refund ${id}: ${body.status}`);
    return put("refunds", {
      ...refund,
      status: body.status,
      reference: text(body.reference),
    });
  });
}

async function shiprocket(account, id, action, method) {
  if (method === "GET")
    return (await all("orders"))
      .filter((order) => order.shipment)
      .map((order) => ({
        ...order.shipment,
        id: order.id,
        orderId: order.id,
        customer: order.customer,
        status: order.status,
      }));

  check(method === "POST", "Method not allowed", 405);
  check(status().shiprocket, "Configure Shiprocket credentials first", 503);
  const order = await get("orders", id);
  check(
    order && ["confirmed", "processing", "shipped"].includes(order.status),
    "Confirm the order before shipping",
  );

  if (action === "create") {
    check(!order.shipment, "Shipment already exists", 409);
    const product = await get("products", order.productId);
    const packageItems = order.items || [
      {
        weight: product?.weight,
        length: product?.length,
        breadth: product?.breadth,
        height: product?.height,
      },
    ];
    check(
      product &&
        packageItems.every((item) =>
          [item.weight, item.length, item.breadth, item.height].every(
            (value) => value > 0,
          ),
        ),
      "Set confirmed package dimensions first",
    );
    await tx(async () => {
      const current = await get("orders", id);
      check(
        current &&
          ["confirmed", "processing", "shipped"].includes(current.status),
        "Confirm the order before shipping",
      );
      check(!current.shipment, "Shipment already exists", 409);
      await put("orders", { ...current, shipment: { status: "creating" } });
    });
    try {
      const shipment = await ship(
        "orders/create/adhoc",
        payload(order, product),
      );
      check(shipment.shipment_id, "No shipment ID returned", 502);
      return put("orders", {
        ...(await get("orders", id)),
        shipment,
      });
    } catch (error) {
      await put("orders", {
        ...(await get("orders", id)),
        shipment: {
          status: "needs-reconciliation",
          message:
            "Check this order ID in Shiprocket before retrying; the provider may have received it.",
        },
      });
      throw error;
    }
  }

  if (action === "retry") {
    check(
      order.shipment?.status === "needs-reconciliation",
      "Only an unreconciled shipment can be cleared",
      409,
    );
    return tx(async () => {
      const current = await get("orders", id);
      check(
        current?.shipment?.status === "needs-reconciliation",
        "Shipment state changed; refresh the order",
        409,
      );
      const updated = { ...current };
      delete updated.shipment;
      const saved = await put("orders", updated);
      await audit(account, `Cleared unreconciled Shiprocket booking for ${id}`);
      return saved;
    });
  }

  check(order.shipment?.shipment_id, "Create a shipment first");
  let response;
  if (action === "awb") {
    check(!order.shipment.awb, "AWB already assigned");
    response = await ship("courier/assign/awb", {
      shipment_id: order.shipment.shipment_id,
    });
    const awbData = response.response?.data || response.data || response;
    const awb = awbData.awb_code || awbData.awb;
    const providerMessage = [
      response.message,
      response.response?.message,
      response.data?.message,
      awbData.message,
    ].find((message) => typeof message === "string" && message.trim());
    check(
      awb,
      providerMessage || "Shiprocket could not assign an AWB to this shipment",
      422,
    );
    return put("orders", {
      ...(await get("orders", id)),
      shipment: {
        ...(await get("orders", id)).shipment,
        awb,
        courier: awbData.courier_name,
      },
    });
  }

  check(order.shipment.awb, "Assign an AWB first");
  if (action === "track")
    response = await ship(
      "courier/track/awb/" + encodeURIComponent(order.shipment.awb),
    );
  else {
    const endpoints = {
      pickup: "courier/generate/pickup",
      label: "courier/generate/label",
      manifest: "manifests/generate",
    };
    check(endpoints[action], "Unknown shipment action");
    if (action === "pickup")
      check(!order.shipment.pickup, "Pickup already requested");
    if (action === "manifest")
      check(order.shipment.pickup, "Request pickup first");
    response = await ship(endpoints[action], {
      shipment_id: [order.shipment.shipment_id],
    });
    check(
      action === "pickup"
        ? response.pickup_status === 1
        : action === "label"
          ? response.label_url
          : response.manifest_url,
      "Provider did not confirm this action",
      502,
    );
  }
  await audit(account, `Shipment ${id}: ${action}`);
  return put("orders", {
    ...(await get("orders", id)),
    shipment: {
      ...(await get("orders", id)).shipment,
      [action]: response,
    },
  });
}

export async function adminController(req, res, next) {
  try {
    const account = await user(req);
    check(
      account && adminRoles.includes(account.role),
      "Admin access required",
      403,
    );
    const [collection, id, action] = routeParts(req);
    if (account.role === "editor")
      check(
        editorResources.includes(collection),
        "Content editor permission required",
        403,
      );

    if (collection === "integrations") {
      check(account.role === "owner", "Owner access required", 403);
      check(req.method === "GET", "Method not allowed", 405);
      return res.json(status());
    }
    if (["audit", "webhooks"].includes(collection)) {
      check(account.role === "owner", "Owner access required", 403);
      check(req.method === "GET", "Method not allowed", 405);
      const result = id ? await get(collection, id) : await all(collection);
      check(result, "Not found", 404);
      return res.json(result);
    }
    if (collection === "shiprocket")
      return res.json(await shiprocket(account, id, action, req.method));

    check(
      ["leads", "reviews", "orders", "payments", "refunds"].includes(
        collection,
      ),
      "Not found",
      404,
    );
    if (req.method === "GET") {
      const result = id ? await get(collection, id) : await all(collection);
      check(result, "Not found", 404);
      return res.json(result);
    }
    const body = req.body || {};
    if (collection === "orders" && req.method === "PATCH")
      return res.json(await updateOrder(account, id, body));
    if (collection === "payments" && req.method === "PATCH")
      return res.json(await updatePayment(account, id, body));
    if (collection === "refunds" && req.method === "PATCH")
      return res.json(await updateRefund(account, id, body));

    check(["leads", "reviews"].includes(collection), "Use workflow actions");
    if (["POST", "PATCH"].includes(req.method)) {
      if (req.method === "POST")
        check(collection !== "leads", "Customer submissions only");
      const old = id ? await get(collection, id) : {};
      check(old, "Not found", 404);
      const data = validate(collection, body, old);
      const saved = await tx(async () => {
        const record = await put(collection, {
          ...data,
          ...(collection === "reviews" && req.method === "POST"
            ? { source: "manual" }
            : {}),
          id: id || undefined,
          createdAt: old.createdAt || now(),
        });
        await audit(account, `Saved ${collection}: ${record.id}`);
        return record;
      });
      return res.json(saved);
    }
    check(req.method === "DELETE", "Method not allowed", 405);
    await remove(collection, id);
    await audit(account, `Deleted ${collection}: ${id}`);
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
