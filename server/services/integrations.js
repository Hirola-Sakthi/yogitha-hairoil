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

function shiprocketMessage(data, fallback) {
  const message =
    typeof data?.message === "string"
      ? data.message
      : typeof data?.error === "string"
        ? data.error
        : "";
  return message ? `${fallback}: ${message}` : fallback;
}

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
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.token)
      throw Object.assign(
        new Error(shiprocketMessage(d, "Shiprocket authentication failed")),
        { status: 502 },
      );
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
  const d = await r.json().catch(() => ({}));
  if (!r.ok)
    throw Object.assign(
      new Error(
        shiprocketMessage(
          d,
          "Shiprocket rejected the request. Verify the address and package details",
        ),
      ),
      { status: 502 },
    );
  return d;
}

export async function quoteShiprocketShipping({
  deliveryPostcode,
  items,
  paymentMethod,
  declaredValue,
  fallbackPaise = 0,
}) {
  if (!status().shiprocket)
    return {
      shippingPaise: fallbackPaise,
      courierName: "Store rate",
      estimatedDays: null,
    };
  const pin = String(deliveryPostcode || "");
  if (!/^\d{6}$/.test(pin))
    throw Object.assign(
      new Error("Enter a valid 6-digit PIN code to calculate shipping"),
      { status: 400 },
    );
  const pickupResponse = await ship(
    "settings/company/pickup?is_order_creation=1",
  );
  const pickupData =
    pickupResponse.data?.shipping_address ||
    pickupResponse.shipping_address ||
    [];
  const locations = Array.isArray(pickupData)
    ? pickupData
    : pickupData
      ? [pickupData]
      : [];
  const configuredName = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
  const pickup =
    locations.find((location) => location.pickup_location === configuredName) ||
    locations.find(
      (location) =>
        location.is_primary === 1 ||
        location.is_primary === "1" ||
        location.is_primary === true,
    ) ||
    locations[0];
  const pickupPostcode = String(
    pickup?.pin_code || pickup?.pickup_pincode || pickup?.pincode || "",
  );
  if (!/^\d{6}$/.test(pickupPostcode)) {
    throw Object.assign(
      new Error("Shiprocket pickup address is missing a valid PIN code"),
      { status: 503 },
    );
  }
  const weight = Math.max(
    0.1,
    items.reduce((sum, item) => sum + (item.weight || 0.25) * item.quantity, 0),
  );
  const query = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: pin,
    cod: paymentMethod === "cod" ? "1" : "0",
    weight: weight.toFixed(2),
    declared_value: String(Math.round((declaredValue || 0) / 100)),
  });
  const response = await ship(`courier/serviceability/?${query}`);
  const couriers =
    response.data?.available_courier_companies ||
    response.available_courier_companies ||
    [];
  const rates = couriers
    .map((courier) => ({
      courierName: courier.courier_name || "Shiprocket courier",
      estimatedDays: Number(courier.estimated_delivery_days) || null,
      shippingPaise: Math.round(
        (Number(courier.freight_charge || courier.cost || 0) +
          (paymentMethod === "cod" ? Number(courier.cod_charges || 0) : 0) +
          Number(courier.other_charges || 0) +
          Number(courier.coverage_charges || 0) +
          Number(courier.entry_tax || 0)) *
          100,
      ),
    }))
    .filter(
      (rate) =>
        Number.isSafeInteger(rate.shippingPaise) && rate.shippingPaise >= 0,
    );
  if (!rates.length)
    throw Object.assign(
      new Error("Shiprocket has no courier service for this PIN code"),
      { status: 422 },
    );
  rates.sort((a, b) => a.shippingPaise - b.shippingPaise);
  return rates[0];
}

export function payload(o, p) {
  const a = o.address;
  const items = o.items?.length
    ? o.items
    : [
        {
          productName: o.productName,
          sku: o.sku,
          quantity: o.quantity,
          unitPricePaise: o.unitPricePaise,
          weight: p.weight,
          length: p.length,
          breadth: p.breadth,
          height: p.height,
        },
      ];
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
    order_items: items.map((item) => ({
      name: item.productName,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.unitPricePaise / 100,
    })),
    payment_method: o.paymentMethod === "razorpay" ? "Prepaid" : "COD",
    sub_total: o.subtotalPaise / 100,
    shipping_charges: o.shippingPaise / 100,
    length: Math.max(...items.map((item) => item.length || p.length)),
    breadth: Math.max(...items.map((item) => item.breadth || p.breadth)),
    height: Math.max(...items.map((item) => item.height || p.height)),
    weight: items.reduce(
      (sum, item) => sum + (item.weight || p.weight) * item.quantity,
      0,
    ),
  };
}
