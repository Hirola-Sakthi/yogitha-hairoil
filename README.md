# Dr. Yogitha’s — Storefront & Commerce Studio

React, Vite, JavaScript, Tailwind CSS and Lucide icons. Shared Node.js backend with MongoDB persistence. Jost font and the existing green/cream palette. Node 24+ required.

## Run locally

```bash
npm ci
npm --prefix server ci
```

Copy `server/.env.example` to `server/.env`. Set your MongoDB connection before starting:

```env
MONGODB_URI="mongodb+srv://YOUR_DB_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB=ambar_commerce
```

Use your actual Atlas connection string, database user credentials, and an allowed network address. URL-encode special characters in the URI password. The backend uses `MONGODB_DB` as the database name (default `ambar_commerce`). Keep the URI only in `server/.env`, never in a frontend `VITE_*` setting.

MongoDB Atlas or a MongoDB replica set is required for atomic stock/order/payment updates. For a local replica set named `rs0`, use `mongodb://127.0.0.1:27017/?replicaSet=rs0` after initializing the replica set. Standalone MongoDB servers are rejected at startup. The app creates collections, indexes, and initial draft content automatically. Existing SQLite files are not read or automatically imported; keep any old files if you need their data.

Use two terminals from the project root (use `npm.cmd` instead of `npm` if PowerShell blocks scripts):

```bash
npm run server
npm run dev
```

Storefront: http://localhost:5173 — private CMS: http://localhost:5173/admin

Create the initial owner once:

```bash
cd server
npm run admin -- your-email@example.com
```

Choose a password of 10–128 characters. The CLI password is visible, so use a private terminal. No default admin account or production password is included. Public registration always creates customers. Normal login uses email/password, no OTP. Managers/editors are created by the owner in Users & access.

## Production

```bash
npm run build
npm start
```

Set `NODE_ENV=production`, `SITE_URL=https://your-domain.com`, `MONGODB_URI` and `MONGODB_DB` in `server/.env`. Use an HTTPS reverse proxy. Node serves the website and API together on port 4000. `/admin` uses server-enforced staff permissions. Sessions and rate limits are persisted in MongoDB; expiration indexes clean up expired sessions and tokens. Use your MongoDB deployment's backup tools and verify restores. All instances must use the same MongoDB database.

## Public pages

| Page | Route |
| --- | --- |
| Preserved animated homepage | `/` |
| Preserved About | `/about` |
| Home product section | `/#shop` |
| Legacy shop and product URLs | Redirect to the homepage product section |
| Customer login / registration | `/login`, `/register` |
| Password reset | `/forgot-password`, `/reset-password` |
| Login-required checkout | `/checkout?product=ID&quantity=1` |
| Customer account, orders, tracking reference, reviews, refund requests | `/account` |
| Journal and articles | `/blog`, `/blog/:slug` |
| Contact / lead form | `/contact` |
| Published policies | `/policies/:slug` |

## CMS modules

Dashboard, Leads, Orders with details/timeline/address, Payments, Refunds, Shiprocket, Notifications & webhooks, Audit log, Products, Customers, Reviews, Blog posts, Blog categories, Policy pages, Settings, Users & access. Tables include search, status filters where relevant, pagination, CSV export, empty/error states and dedicated record pages. Add opens `/admin/:module/new`; existing records open `/admin/:module/:id`. Forms support direct links, page refresh and Back to list navigation. The storefront bag opens as a full page at `/cart`. Owners manage settings, staff, audit and webhook logs; managers manage commerce; editors manage posts/categories/policies/reviews.

Product management covers name, slug, SKU, description, confirmed price/stock, product image uploads, optional original price for discounts, parcel dimensions, FAQs and SEO. Upload JPG, PNG or WebP images up to 5 MB for each product size; uploads are hosted in ImageKit when configured. Set the original price to 0 to hide the discount, or higher than the selling price to show a crossed-out price and calculated percentage. Active products appear in the homepage collection below the hair-oil introduction. The Shop navigation scrolls to the home product section. Blog/policy content supports draft and publication. Only published records appear publicly. Reviews require a delivered purchase and moderator approval. Other homepage content remains source-controlled to preserve the supplied design.

Blog editing uses Content, Author & related, and SEO tabs with a publishing sidebar. The body editor supports headings, bold/italic/underline, lists, quotations, dividers, links, images, undo/redo, and HTML source. Privacy and other policy pages use the same body editor. Existing plain-text records are preserved when opened, then saved as sanitized HTML. Posts support multiple categories, tags, featured ordering, related stories, and a publication date entered in the editor's local time. Published posts and policies with future dates stay out of public APIs, pages, and sitemaps until that date; no background job is required. Featured images and body images can be uploaded as JPG, PNG or WebP (up to 5 MB) and are hosted in ImageKit when configured. Images entered by URL are imported into ImageKit when content is saved. Uploading requires a staff account.

## ImageKit setup and migration

Create an ImageKit account and set `IMAGEKIT_PRIVATE_KEY` and `IMAGEKIT_URL_ENDPOINT` in `server/.env`. Keep the private key only in the backend environment. Product and CMS image uploads are hosted in ImageKit; storefront assets bundled under `public/` continue loading locally.

Back up MongoDB first. From the project root, run `npm --prefix server run migrate:imagekit` for a dry run, then `npm --prefix server run migrate:imagekit -- --apply` to upload only `public/` images referenced by non-product backend records, previously uploaded MongoDB media, and existing CMS image URLs/content to ImageKit and update database references. Existing product image URLs and unreferenced storefront assets, including the homepage and animation images, are left unchanged. Newly uploaded product images are hosted through the admin image upload flow. The migration is repeatable; keep the local public files and database backup until you have verified the site and ImageKit assets.

The homepage purchase section features one oil with compact 50 ml and 100 ml selectors, a large bottle image, quantity controls, Add to cart and Buy now. It prefers the active `hair-oil` product, otherwise the first active product. Shop and product-detail URLs redirect to this homepage product section. Existing product price, stock and original-price fields represent 50 ml. In Admin, enter the separate 100 ml price, original price (optional), stock and image (optional). No 100 ml price or inventory is inferred from the smaller bottle. Both sizes use the product's parcel settings; configure these for safe fulfillment of either size.

The shopping bag is saved in MongoDB through `/api/cart`, using a random HttpOnly cookie to identify each browser. Visitors can add products before signing in; the header displays the server-returned total quantity. Each size has a separate bag line, price and stock count. Quantity changes enforce active status, available stock and a maximum of 20 per size. Adding to the bag does not reserve stock. Bag totals use current server prices, and unavailable items are marked before checkout. Carts expire after 30 days and are browser-specific, not synchronized across devices. Checkout currently places one product size per order; each bag item has its own checkout link. Successful orders subtract the purchased size and quantity from the bag in the same transaction. Cancellation restores that size's stock. Legacy bag lines and orders without a size are treated as 50 ml.

## Enable ordering

The storefront footer uses the brand description, support email, phone, business address and optional WhatsApp number from Admin Settings. Enter WhatsApp with its country code. Only published policy pages appear in the footer. “Join the list” saves an explicitly requested newsletter signup in Leads; sending newsletter campaigns is a separate workflow. Payment text reflects whether cash on delivery and Razorpay are enabled.

1. Create your owner account.
2. Products starts with the supplied hair oil as Draft: price, stock and dimensions are unconfirmed. Set your confirmed values and activate it.
3. In Settings, enter shipping fee, support details and business information.
4. Write and review Privacy, Terms, Shipping and Returns policy drafts, then publish them. No business-specific legal terms were invented.
5. Set `ALLOW_COD=true` in the backend environment and restart.
6. Configure and test SMTP, Shiprocket and Razorpay with your own accounts.

Cash on delivery and Razorpay Standard Checkout are supported. Server-side totals, payment signatures and stock checks are authoritative. Online checkout reserves stock for 15 minutes; expired reservations are released on the next checkout attempt. Razorpay-confirmed payments move orders into the normal fulfilment workflow. Refund records still require an actual external refund reference and do not initiate a Razorpay refund. Itemised GST and tax invoices are not included; selling prices are final prices configured by you.

## Razorpay test mode and webhook events

Set `RAZORPAY_MODE=test`, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env` to your Razorpay **Test Mode** API keys. The backend defaults to test mode and refuses to enable checkout unless the key ID has the matching `rzp_test_` prefix. To accept live payments after testing, explicitly set `RAZORPAY_MODE=live` and use live keys with the `rzp_live_` prefix. Never put the secret in a `VITE_*` variable or commit it. The public key ID is sent to Checkout by the server only after the backend confirms online payments are configured.

In Razorpay Dashboard, register `https://your-domain.com/api/webhooks/razorpay`, select `payment.captured` and `payment.failed`, and copy that endpoint's webhook secret to `RAZORPAY_WEBHOOK_SECRET`. The backend verifies the HMAC against the exact raw request body, deduplicates event IDs, and makes captured payments idempotent. Checkout completion is also signature-verified server-side.

Webhook deliveries appear in the owner-only Notifications & webhooks admin module. Audit log shows admin actions and captured-payment events. To receive Shiprocket notifications, configure SHIPROCKET_WEBHOOK_TOKEN and send the configured token in the X-Shiprocket-Token request header to https://your-domain.com/api/webhooks/shiprocket. This endpoint records token-authenticated events and attaches tracking updates to matching shipments; confirm Shiprocket account webhook settings support sending a custom token header before enabling it.

## SMTP

Set SMTP_HOST, SMTP_PORT, SMTP_FROM and optional SMTP_USER/SMTP_PASS in `server/.env`. Port 465 uses TLS. Used for order acknowledgements and password reset links. Password reset tokens are hashed, expire in 30 minutes and are single use; password resets revoke sessions. Normal login does not depend on SMTP. Missing SMTP means no reset email is sent; the response remains neutral. Email errors do not undo a saved order. Live delivery requires your credentials and testing.

## Shiprocket

Set SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD and SHIPROCKET_PICKUP_LOCATION to an existing pickup name. Credentials remain on the server. Confirm parcel dimensions in Products.

Order details → Confirm → Processing → Create shipment → Assign courier/AWB → Request pickup → Generate label/manifest. Refresh tracking from the same record page. Provider response checks prevent fake success. A timed-out shipment creation is marked for reconciliation instead of blindly rebooking. Reconcile uncertain bookings and cancellations directly in Shiprocket. Return pickups, automatic cancellation and shipment webhooks are not included. Staff updates order status after checking delivery progress. Live credentials were not available for testing.

Official reference: https://apidocs.shiprocket.in/

## SEO, AEO and GEO

The Node server serves route-specific title/description, canonical URL, Open Graph fields, Twitter cards, escaped Product/Offer or BlogPosting structured data and visible initial HTML for published product/article/policy content. React replaces that initial HTML when it loads. Home/About have a lightweight semantic fallback, not full React SSR. Product FAQs are editable visible content. Only confirmed facts are used; no unverified medical claims or review ratings are added.

`robots.txt`, `sitemap.xml` and `llms.txt` are generated dynamically from published records. Set SITE_URL to the real origin. Admin/account/checkout pages are noindex; robots rules are not security, and access is enforced by the API. llms.txt is a discovery aid, not a ranking or AI-citation guarantee. Verify structured data and submit the real sitemap after deployment.

References:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

## Preview

```bash
npm run dev:demo
npm run build:demo
```

The hosted private preview uses fictional sample records and ₹699 sample pricing, stored only in that browser. It does not use the production Node API, send emails, book shipments, take payments or place real orders. Use “Try customer preview” to explore checkout without credentials. Sample workflows illustrate the UI; real enforcement is in the backend. Clear the `ambar-preview-v2` localStorage key to reset sample data. The normal production build excludes the demo adapter. Never deploy a demo build as the real store.

## Structure and preservation

- `src/pages`, `src/ProductSequence.jsx`, `src/sequence*`: original homepage/About/animation content.
- `src/components`: header/footer/bag wiring.
- `src/admin`: private CMS, schemas, forms and workflows.
- `src/commerce`: public customer pages and store context.
- `src/shared/theme.css`: central palette and Jost font; legacy tint tokens preserve original shades.
- `src/shared/api.js`: real API client; `demo.js` is preview-only.
- `server/`: Backend organized into config, controllers, cors, cron, middleware, models, routes, services and utils. See `server/README.md`.
- `server/tests`: integration tests against an isolated temporary MongoDB replica set.

All original public assets, animation frames and homepage sections are retained. Deliberate storefront changes: Jost, central colors, shop/account navigation, functioning Blog/Contact pages, links to published policies, and replacement of the original fake phone/address with Settings-driven contact details. Original CSS is retained with centralized values; new screens use scoped CSS and Tailwind utilities. Image colors do not change with CSS tokens.

## Checks

```bash
npm run build
npm test
```

Tests cover registration/session/role protection, validated product activation, stock and total enforcement, idempotency, customer isolation, order transitions, COD collection, refund accounting, review moderation, editor access, publication, sitemap/structured data/404, CSRF and logout. MongoDB-specific tests cover rollback, concurrent checkout without overselling, concurrent single-use password resets, unique accounts, and atomic rate limits. Tests start their own temporary MongoDB replica set and never use the database in `server/.env`; the first run may download a MongoDB binary. SMTP and Shiprocket are credential-dependent and not live-tested. Source ZIP excludes dependencies, runtime data, secrets and deployment identity.
#   y o g i t h a - h a i r o i l  
 