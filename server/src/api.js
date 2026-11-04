import { isPublished } from "../../src/shared/publication.js";
import { randomUUID, randomBytes } from "node:crypto";
import { all, get, put, remove, tx, audit, now, findOne, findMany, count, insert, update, deleteMany } from "./db.js";
import { user, login, logout, hash, verify, digest, limit, safe } from "./auth.js";
import { check, text, email, validate, address } from "./validate.js";
import { status, mail, ship, payload, quoteShiprocketShipping } from "./integrations.js";
import { hostImageKitHtml, hostImageKitUrl, imageKitConfigured } from "./imagekit.js";
import { cart, consumeCart } from "./cart.js";
import { adjustCheckoutStock, legacyOrderFields, resolveCheckoutItems } from "./checkoutItems.js";
import {
  secureEqual,
  verifyRazorpayWebhook,
} from "./razorpay.js";
import {
  createOnlinePayment,
  expireRazorpayReservations,
  verifyOnlinePayment,
  receiveWebhook,
  shiprocketEventId,
} from "./paymentFlows.js";
export async function api(req, res, url, b) {
  const path = url.pathname.replace(/^\/api/, "");
  const m = req.method;
  const u = await user(req);
  const auth = () => check(u, "Please sign in to continue", 401),
    admin = () => check(u && ["owner", "manager", "editor"].includes(u.role), "Admin access required", 403),
    owner = () => check(u?.role === "owner", "Owner access required", 403);
  if (path === "/health") return {
    ok: true
  };
  if (path === "/webhooks/razorpay" && m === "POST") {
    check(status().razorpay.webhook, "Configure the Razorpay webhook secret first", 503);
    check(
      verifyRazorpayWebhook(
        req.rawBody || Buffer.alloc(0),
        req.headers["x-razorpay-signature"],
      ),
      "Invalid Razorpay webhook signature",
      401,
    );
    const eventId = req.headers["x-razorpay-event-id"];
    check(
      typeof eventId === "string" &&
        eventId.length > 0 &&
        eventId.length <= 200,
      "Razorpay event ID required",
    );
    return receiveWebhook("razorpay", eventId, b);
  }
  if (path === "/webhooks/shiprocket" && m === "POST") {
    const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN || "";
    check(expected, "Configure the Shiprocket webhook token first", 503);
    const authorization = req.headers.authorization || "";
    const token = req.headers["x-shiprocket-token"] ||
      (authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
    check(secureEqual(expected, token), "Invalid Shiprocket webhook token", 401);
    return receiveWebhook("shiprocket", shiprocketEventId(req.rawBody || Buffer.alloc(0)), b);
  }
  if (path === "/payments/razorpay/order" && m === "POST") {
    auth();
    return createOnlinePayment(u, b, req);
  }
  if (path === "/payments/razorpay/verify" && m === "POST") {
    auth();
    return verifyOnlinePayment(u, b);
  }
  if (path === "/cart") return cart(req, res, b);
  if (path === "/shipping/quote" && m === "POST") {
    auth();
    const items = await resolveCheckoutItems(b);
    const fallbackPaise = (await get("settings", "store")).shippingPaise || 0;
    const quote = await quoteShiprocketShipping({
      deliveryPostcode: b.address?.pincode,
      items,
      paymentMethod: b.paymentMethod,
      declaredValue: items.reduce((sum, item) => sum + item.subtotalPaise, 0),
      fallbackPaise,
    });
    return quote;
  }
  if (path === "/auth/me") return {
    user: u
  };
  if (path === "/auth/logout" && m === "POST") {
    await logout(req, res);
    return {
      ok: true
    };
  }
  if (["/auth/login", "/auth/register", "/auth/forgot", "/auth/reset"].includes(path) && m === "POST") {
    check(await limit("auth:" + req.socket.remoteAddress), "Too many attempts. Try again later.", 429);
    if (path === "/auth/reset") {
      check(typeof b.password === "string" && b.password.length >= 10 && b.password.length <= 128, "Use 10–128 password characters");
      await tx(async () => {
        const t = await findOne("resets", {
          token: digest(text(b.token)),
          expires: { $gt: new Date() }
        });
        check(t, "Invalid or expired reset link");
        await update("users", {
          id: t.userId
        }, {
          password: hash(b.password)
        });
        await deleteMany("resets", {
          userId: t.userId
        });
        await deleteMany("sessions", {
          userId: t.userId
        });
      });
      return {
        message: "Password updated. Sign in to continue."
      };
    }
    const e = text(b.email).toLowerCase();
    check(email(e), "Enter a valid email");
    const existing = await findOne("users", {
      email: e
    });
    if (path === "/auth/forgot") {
      if (existing?.active) {
        const t = randomBytes(32).toString("hex");
        await deleteMany("resets", {
          userId: existing.id
        });
        await insert("resets", {
          token: digest(t),
          userId: existing.id,
          expires: new Date(Date.now() + 1800000)
        });
        try {
          await mail(e, "Reset your password", `${process.env.SITE_URL}/reset-password?token=${t}\nExpires in 30 minutes.`);
        } catch {
          console.error("Reset email failed");
        }
      }
      return {
        message: "If this account exists and email is configured, a reset link will be sent."
      };
    }
    check(typeof b.password === "string" && b.password.length >= 10 && b.password.length <= 128, "Use 10–128 password characters");
    if (path === "/auth/login") {
      const valid = verify(b.password, existing?.password);
      check(valid && existing?.active, "Incorrect email or password", 401);
      await login(res, existing);
      return {
        user: safe(existing)
      };
    }
    check(!existing, "This email cannot be registered", 409);
    check(text(b.name), "Name is required");
    const n = {
      id: randomUUID(),
      name: text(b.name, 100),
      email: e,
      role: "customer",
      active: 1,
      createdAt: now()
    };
    await insert("users", {
      id: n.id,
      name: n.name,
      email: e,
      password: hash(b.password),
      role: n.role,
      active: 1,
      createdAt: n.createdAt
    });
    await login(res, n);
    return {
      user: safe(n)
    };
  }
  if (path === "/public" && m === "GET") return {
    settings: await get("settings", "store"),
    products: (await all("products")).filter(p => p.status === "active"),
    posts: (await all("posts")).filter(isPublished),
    categories: await all("categories"),
    policies: (await all("policies")).filter(isPublished),
    reviews: (await all("reviews")).filter(r => r.status === "approved").map(({
      email,
      userId,
      ...r
    }) => r),
    checkout: {
      cod: status().cod,
      onlinePayments: status().onlinePayments,
      razorpayKeyId: status().razorpay.keyId,
      razorpayMode: status().razorpay.mode,
    }
  };
  if (path === "/leads" && m === "POST") {
    check(await limit("lead:" + req.socket.remoteAddress, 8), "Try again later", 429);
    check(!b.website, "Invalid request");
    check(text(b.phone), "Phone is required");
    check(text(b.subject), "Subject is required");
    return await put("leads", {
      ...validate("leads", {
        ...b,
        status: "new"
      }),
      createdAt: now()
    });
  }
  if (path === "/orders" && m === "GET") {
    auth();
    return (await all("orders")).filter(o => o.userId === u.id);
  }
  if (path === "/orders" && m === "POST") {
    auth();
    await expireRazorpayReservations();
    check(status().cod, "Checkout is not enabled yet", 503);
    check(b.paymentMethod === "cod", "Only cash on delivery is available");
    const a = address(b.address),
      key = text(b.idempotencyKey, 100);
    check(key.length >= 16, "Checkout request key required");
    const items = await resolveCheckoutItems(b);
      const fallbackPaise = (await get("settings", "store")).shippingPaise || 0;
    const shippingQuote = await quoteShiprocketShipping({
      deliveryPostcode: a.pincode,
      items,
      paymentMethod: "cod",
      declaredValue: items.reduce((sum, item) => sum + item.subtotalPaise, 0),
        fallbackPaise,
    });
    let created = false;
    const o = await tx(async () => {
      created = false;
      const dup = (await all("orders")).find(o => o.userId === u.id && o.idempotencyKey === key);
      if (dup) return dup;
      await adjustCheckoutStock(items, -1);
      const shipping = shippingQuote.shippingPaise;
      const o = await put("orders", {
        id: "DY-" + randomBytes(6).toString("hex").toUpperCase(),
        userId: u.id,
        email: u.email,
        customer: u.name,
        address: a,
        ...legacyOrderFields(items),
        shippingPaise: shipping,
        shippingQuote,
        totalPaise: items.reduce((sum, item) => sum + item.subtotalPaise, 0) + shipping,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "placed",
        idempotencyKey: key,
        createdAt: now(),
        timeline: [{
          status: "placed",
          at: now()
        }]
      });
      await put("payments", {
        id: "PAY-" + o.id,
        orderId: o.id,
        customer: u.name,
        amountPaise: o.totalPaise,
        status: "pending",
        method: "cod",
        createdAt: now()
      });
      await consumeCart(req, items);
      created = true;
      return o;
    });
    if (created) try {
      const summary = o.items.map(item => `${item.quantity} × ${item.productName}`).join(", ");
      await mail(u.email, `Order ${o.id} received`, `Your order for ${summary} is placed. Total INR ${(o.totalPaise / 100).toFixed(2)}, payable on delivery.`);
    } catch {
      console.error("Order email failed; order saved");
    }
    return o;
  }
  if (path === "/account/refunds") {
    auth();
    return (await all("refunds")).filter(r => r.userId === u.id);
  }
  if (path === "/refunds" && m === "POST") {
    auth();
    const o = await get("orders", text(b.orderId));
    check(o?.userId === u.id, "Order not found", 404);
    check(o.paymentStatus === "paid", "A recorded payment is required");
    check(text(b.reason), "Reason required");
    check(!(await all("refunds")).some(r => r.orderId === o.id && r.status !== "rejected"), "A refund request already exists", 409);
    return await put("refunds", {
      userId: u.id,
      orderId: o.id,
      customer: u.name,
      amountPaise: o.totalPaise,
      reason: text(b.reason, 2000),
      status: "requested",
      createdAt: now()
    });
  }
  if (path === "/reviews" && m === "POST") {
    auth();
    check(Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5 && text(b.content), "Rating and review required");
    check((await all("orders")).some(o => o.userId === u.id && (o.productId === b.productId || o.items?.some(item => item.productId === b.productId)) && o.status === "delivered"), "Reviews are available after delivery", 403);
    check(!(await all("reviews")).some(r => r.userId === u.id && r.productId === b.productId), "Already reviewed", 409);
    return await put("reviews", {
      userId: u.id,
      name: u.name,
      email: u.email,
      productId: b.productId,
      rating: b.rating,
      content: text(b.content, 3000),
      status: "pending",
      createdAt: now()
    });
  }
  if (path.startsWith("/admin/")) {
    admin();
    const [, c, id, action] = path.slice(1).split("/");
    if (u.role === "editor") check(["posts", "categories", "policies", "reviews"].includes(c), "Content editor permission required", 403);
    if (c === "dashboard") return {
      orders: (await all("orders")).length,
      customers: await count("users", {
        role: "customer"
      }),
      leads: (await all("leads")).filter(l => l.status === "new").length,
      revenuePaise: (await all("payments")).filter(p => ["paid", "refunded"].includes(p.status)).reduce((s, p) => s + p.amountPaise, 0) - (await all("refunds")).filter(r => r.status === "processed").reduce((s, r) => s + r.amountPaise, 0),
      recentOrders: (await all("orders")).slice(0, 6),
      integrations: status()
    };
    if (c === "integrations") {
      owner();
      return status();
    }
    if (c === "audit" || c === "webhooks") {
      owner();
      check(m === "GET", "Method not allowed", 405);
      if (id) {
        const record = await get(c, id);
        check(record, "Not found", 404);
        return record;
      }
      return await all(c);
    }
    if (c === "settings") {
      owner();
      if (m === "GET") return await get("settings", "store");
      if (m === "PATCH") {
        const settings = validate("settings", b, await get("settings", "store"));
        if (imageKitConfigured()) settings.socialImage = await hostImageKitUrl(settings.socialImage);
        const saved = await put("settings", settings);
        await audit(u, "Updated settings");
        return saved;
      }
    }
    if (c === "users" || c === "customers") {
      if (c === "users") owner();
      if (m === "GET") return (await findMany("users", c === "customers" ? {
        role: "customer"
      } : {
        role: {
          $ne: "customer"
        }
      })).map(safe);
      owner();
      if (m === "POST") {
        check(email(b.email) && text(b.name), "Name and valid email required");
        check(["manager", "editor"].includes(b.role), "Invalid role");
        check(typeof b.password === "string" && b.password.length >= 10 && b.password.length <= 128, "Use 10–128 password characters");
        check(!(await findOne("users", {
          email: b.email.toLowerCase()
        })), "Email already exists", 409);
        const id = randomUUID();
        await insert("users", {
          id: id,
          name: text(b.name),
          email: b.email.toLowerCase(),
          password: hash(b.password),
          role: b.role,
          active: 1,
          createdAt: now()
        });
        await audit(u, "Created staff account");
        return safe(await findOne("users", {
          id: id
        }));
      }
      if (m === "PATCH") {
        const n = await findOne("users", {
          id: id
        });
        check(n && n.role !== "owner", "Owner cannot be modified here");
        check(["manager", "editor"].includes(b.role), "Invalid role");
        await update("users", {
          id: id
        }, {
          role: b.role,
          active: b.active ? 1 : 0
        });
        await deleteMany("sessions", {
          userId: id
        });
        await audit(u, "Updated staff access");
        return {
          ok: true
        };
      }
    }
    if (c === "orders" && m === "PATCH") {
      return await tx(async () => {
        const o = await get(c, id);
        check(o, "Order not found", 404);
        check(({
          placed: ["confirmed", "cancelled"],
          confirmed: ["processing", "cancelled"],
          processing: ["shipped", "cancelled"],
          shipped: ["delivered"]
        }[o.status] || []).includes(b.status), "Invalid order transition");
        if (b.status === "shipped") check(o.shipment?.awb, "Assign a tracking AWB first");
        if (b.status === "cancelled") {
          check(!o.shipment, "Reconcile booked shipments in Shiprocket before cancellation");
          await adjustCheckoutStock(o.items || [{ productId: o.productId, variantId: o.variantId, quantity: o.quantity, name: o.productName, sizeLabel: o.sizeLabel }], 1);
        }
        await audit(u, `Order ${id}: ${b.status}`);
        return await put(c, {
          ...o,
          status: b.status,
          timeline: [...o.timeline, {
            status: b.status,
            at: now()
          }]
        });
      });
    }
    if (c === "payments" && m === "PATCH") return await tx(async () => {
      const p = await get(c, id);
      check(p?.status === "pending" && b.status === "paid" && text(b.reference), "Pending payment and collection reference required");
      const o = await get("orders", p.orderId);
      check(p.method === "cod", "Online payments are verified by Razorpay");
      check(o?.status === "delivered", "Record COD collection after delivery");
      await put("orders", {
        ...o,
        paymentStatus: "paid"
      });
      await audit(u, `Recorded collection ${id}`);
      return await put(c, {
        ...p,
        status: "paid",
        reference: text(b.reference)
      });
    });
    if (c === "refunds" && m === "PATCH") return await tx(async () => {
      const r = await get(c, id);
      check(r, "Refund not found", 404);
      check(({
        requested: ["approved", "rejected"],
        approved: ["processed", "rejected"]
      }[r.status] || []).includes(b.status), "Invalid refund transition");
      if (b.status === "processed") {
        check(text(b.reference), "Enter the reference of the refund actually sent");
        const o = await get("orders", r.orderId);
        check(o.paymentStatus === "paid", "Order is not paid");
        await put("orders", {
          ...o,
          paymentStatus: "refunded"
        });
        await put("payments", {
          ...(await get("payments", "PAY-" + o.id)),
          status: "refunded"
        });
      }
      await audit(u, `Refund ${id}: ${b.status}`);
      return await put(c, {
        ...r,
        status: b.status,
        reference: text(b.reference)
      });
    });
    if (c === "shiprocket") {
      if (m === "GET") return (await all("orders")).filter(o => o.shipment).map(o => ({
        ...o.shipment,
        id: o.id,
        orderId: o.id,
        customer: o.customer,
        status: o.status
      }));
      check(m === "POST", "Method not allowed", 405);
      check(status().shiprocket, "Configure Shiprocket credentials first", 503);
      const o = await get("orders", id);
      check(o && ["confirmed", "processing", "shipped"].includes(o.status), "Confirm the order before shipping");
      if (action === "create") {
        check(!o.shipment, "Shipment already exists", 409);
        const p = await get("products", o.productId);
        const packageItems = o.items || [{ weight: p?.weight, length: p?.length, breadth: p?.breadth, height: p?.height }];
        check(p && packageItems.every(item => [item.weight, item.length, item.breadth, item.height].every(n => n > 0)), "Set confirmed package dimensions first");
        await tx(async () => {
          const current = await get("orders", id);
          check(current && ["confirmed", "processing", "shipped"].includes(current.status), "Confirm the order before shipping");
          check(!current.shipment, "Shipment already exists", 409);
          await put("orders", { ...current, shipment: { status: "creating" } });
        });
        try {
          const s = await ship("orders/create/adhoc", payload(o, p));
          check(s.shipment_id, "No shipment ID returned", 502);
          return await put("orders", {
            ...(await get("orders", id)),
            shipment: s
          });
        } catch (e) {
          await put("orders", {
            ...(await get("orders", id)),
            shipment: {
              status: "needs-reconciliation",
              message: "Check this order ID in Shiprocket before retrying; the provider may have received it."
            }
          });
          throw e;
        }
      }
      if (action === "retry") {
        check(o.shipment?.status === "needs-reconciliation", "Only an unreconciled shipment can be cleared", 409);
        return await tx(async () => {
          const current = await get("orders", id);
          check(current?.shipment?.status === "needs-reconciliation", "Shipment state changed; refresh the order", 409);
          const updated = { ...current };
          delete updated.shipment;
          const saved = await put("orders", updated);
          await audit(u, `Cleared unreconciled Shiprocket booking for ${id}`);
          return saved;
        });
      }
      check(o.shipment?.shipment_id, "Create a shipment first");
      let data;
      if (action === "awb") {
        check(!o.shipment.awb, "AWB already assigned");
        data = await ship("courier/assign/awb", {
          shipment_id: o.shipment.shipment_id
        });
        check(data.response?.data?.awb_code, "No AWB returned", 502);
        return await put("orders", {
          ...(await get("orders", id)),
          shipment: {
            ...(await get("orders", id)).shipment,
            awb: data.response.data.awb_code,
            courier: data.response.data.courier_name
          }
        });
      }
      check(o.shipment.awb, "Assign an AWB first");
      if (action === "track") data = await ship("courier/track/awb/" + encodeURIComponent(o.shipment.awb));else {
        const endpoints = {
          pickup: "courier/generate/pickup",
          label: "courier/generate/label",
          manifest: "manifests/generate"
        };
        check(endpoints[action], "Unknown shipment action");
        if (action === "pickup") check(!o.shipment.pickup, "Pickup already requested");
        if (action === "manifest") check(o.shipment.pickup, "Request pickup first");
        data = await ship(endpoints[action], {
          shipment_id: [o.shipment.shipment_id]
        });
        check(action === "pickup" ? data.pickup_status === 1 : action === "label" ? data.label_url : data.manifest_url, "Provider did not confirm this action", 502);
      }
      await audit(u, `Shipment ${id}: ${action}`);
      return await put("orders", {
        ...(await get("orders", id)),
        shipment: {
          ...(await get("orders", id)).shipment,
          [action]: data
        }
      });
    }
    check(["products", "leads", "orders", "payments", "refunds", "reviews", "posts", "categories", "policies"].includes(c), "Unknown module", 404);
    if (m === "GET") {
      if (id) {
        const r = await get(c, id);
        check(r, "Not found", 404);
        return r;
      }
      return await all(c);
    }
    check(["products", "leads", "reviews", "posts", "categories", "policies"].includes(c), "Use workflow actions");
    if (m === "POST" || m === "PATCH") {
      if (m === "POST") check(c !== "leads", "Customer submissions only");
      const old = id ? await get(c, id) : {};
      check(old, "Not found", 404);
      const d = validate(c, b, old);
      if (imageKitConfigured()) {
        if (c !== "products") {
          for (const field of ["image", "socialImage"]) {
            if (typeof d[field] === "string") d[field] = await hostImageKitUrl(d[field]);
          }
        }
        if (d.contentFormat === "html" && typeof d.content === "string") {
          d.content = await hostImageKitHtml(d.content);
        }
      }
      if (d.slug) check(!(await all(c)).some(r => r.slug === d.slug && r.id !== id), "Slug already exists", 409);
      return await tx(async () => {
        const r = await put(c, {
          ...d,
          ...(c === "reviews" && m === "POST" ? { source: "manual" } : {}),
          id: id || undefined,
          createdAt: old.createdAt || now()
        });
        await audit(u, `Saved ${c}: ${r.id}`);
        return r;
      });
    }
    if (m === "DELETE") {
      check(["products", "leads", "reviews", "posts", "categories"].includes(c), "Archive instead");
      if (c === "products") check(!(await all("orders")).some(o => o.productId === id || o.items?.some(item => item.productId === id)), "Products with orders must be archived");
      if (c === "categories") check(!(await all("posts")).some(p => p.categoryId === id), "Category is in use");
      await remove(c, id);
      await audit(u, `Deleted ${c}: ${id}`);
      return {
        ok: true
      };
    }
  }
  check(false, "Not found", 404);
}
