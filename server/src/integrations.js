import { razorpayStatus } from "./razorpay.js";

export const status = () => ({
  smtp: !!(process.env.SMTP_HOST && process.env.SMTP_FROM),
  shiprocket: !!(
    process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD
  ),
  cod: process.env.ALLOW_COD === "true",
  onlinePayments: razorpayStatus().enabled,
  razorpay: razorpayStatus(),
  shiprocketWebhook: Boolean(process.env.SHIPROCKET_WEBHOOK_TOKEN),
});
export async function mail(to, subject, text) {
  if (!status().smtp) return false;
  const { default: n } = await import("nodemailer");
  await n
    .createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      connectionTimeout: 10000,
      socketTimeout: 15000,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
    .sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  return true;
}
let token,
  expires = 0;
export async function ship(path, body) {
  if (!status().shiprocket)
    throw Object.assign(new Error("Configure Shiprocket credentials first"), {
      status: 503,
    });
  if (!token || Date.now() > expires) {
    const r = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const d = await r.json();
    if (!r.ok || !d.token)
      throw Object.assign(new Error("Shiprocket authentication failed"), {
        status: 502,
      });
    token = d.token;
    expires = Date.now() + 3600000;
  }
  const r = await fetch("https://apiv2.shiprocket.in/v1/external/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const d = await r.json();
  if (!r.ok)
    throw Object.assign(
      new Error(
        "Shiprocket rejected the request. Verify the address and package details.",
      ),
      { status: 502 },
    );
  return d;
}
export function payload(o, p) {
  const a = o.address;
  return {
    order_id: o.id,
    order_date: o.createdAt.slice(0, 19).replace("T", " "),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billing_customer_name: a.name,
    billing_last_name: "",
    billing_address: a.line1,
    billing_address_2: a.line2,
    billing_city: a.city,
    billing_pincode: a.pincode,
    billing_state: a.state,
    billing_country: "India",
    billing_email: o.email,
    billing_phone: a.phone,
    shipping_is_billing: true,
    order_items: [
      {
        name: o.productName,
        sku: o.sku,
        units: o.quantity,
        selling_price: o.unitPricePaise / 100,
      },
    ],
    payment_method: o.paymentMethod === "razorpay" ? "Prepaid" : "COD",
    sub_total: o.subtotalPaise / 100,
    shipping_charges: o.shippingPaise / 100,
    length: p.length,
    breadth: p.breadth,
    height: p.height,
    weight: p.weight * o.quantity,
  };
}
