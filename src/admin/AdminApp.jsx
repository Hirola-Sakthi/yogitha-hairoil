import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Truck,
  Users,
  Star,
  FileText,
  Folder,
  ShieldCheck,
  Settings,
  UserRoundCog,
  Package,
  ArrowUpRight,
  ArrowRight,
  Search,
  Plus,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Download,
  RefreshCw,
  Check,
  ExternalLink,
  ScrollText,
  Webhook,
  Trash2,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  CalendarDays,
  BadgeCheck,
  MapPin,
  Clock3,
  Store,
  Info,
} from "lucide-react";
import { imageUrl } from "../shared/imageUrl";
import toast from "react-hot-toast";
import { api, preview, money, date } from "../shared/api";
import { uploadImage } from "./media";
import { modules, labels } from "./schema";
import "./admin.css";
import ContentForm from "./ContentForm";
const nav = [
  ["dashboard", "Overview", LayoutDashboard],
  ["leads", "Leads", MessageSquare],
  ["orders", "Orders", ShoppingBag],
  ["payments", "Payments", CreditCard],
  ["refunds", "Refunds", RotateCcw],
  ["shiprocket", "Shiprocket", Truck],
  ["webhooks", "Webhooks", Webhook],
  ["audit", "Audit log", ScrollText],
  ["products", "Products", Package],
  ["customers", "Customers", Users],
  ["reviews", "Reviews", Star],
  ["posts", "Blog posts", FileText],
  ["categories", "Blog categories", Folder],
  ["policies", "Policy pages", ShieldCheck],
  ["settings", "Settings", Settings],
  ["users", "Users & access", UserRoundCog],
];
const Badge = ({ value }) => (
  <span className={"badge status-" + value}>{String(value ?? "—")}</span>
);
const deletableModules = ["products", "leads", "posts", "categories"];
export default function AdminApp() {
  const location = useLocation(),
    navigate = useNavigate(),
    module = location.pathname.split("/")[2] || "dashboard",
    recordId = location.pathname.split("/")[3] || "";
  const [user, setUser] = useState(
      preview ? { name: "Store owner", role: "owner" } : undefined,
    ),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [pendingDelete, setPendingDelete] = useState(null);
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  useEffect(() => {
    window.scrollTo(0, 0);
    setError("");
  }, [location.pathname]);
  useEffect(() => {
    if (!preview)
      api("/auth/me")
        .then((r) => setUser(r.user))
        .catch((e) => {
          setUser(null);
          setError(e.message);
        });
  }, []);
  useEffect(() => {
    document.title = "Commerce Studio · " + (modules[module]?.title || module);
    let meta = document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.append(meta);
    }
    meta.content = "noindex, nofollow";
    setData(null);
    setQuery("");
    setFilter("all");
    setPage(1);
    setMobile(false);
    setError("");
    if (!user || module === "login") return;
    if (user.role === "editor" && module === "dashboard") {
      navigate("/admin/posts");
      return;
    }
    let live = true;
    api("/admin/" + module)
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [module, user, version]);
  async function mutate(path, method, body) {
    setError("");
    setBusy(true);
    try {
      await api(path, { method, body });
      navigate("/admin/" + module);
      toast.success(preview ? "Preview changes saved in this browser." : "Changes saved.");
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  }
  function deleteRecord(record) {
    if (busy) return;
    const name = record.name || record.title || record.id;
    setPendingDelete({ id: record.id, name });
  }
  if (user === undefined)
    return <div className="cms-loading">Opening your workspace…</div>;
  if (!user || !["owner", "manager", "editor"].includes(user.role))
    return (
      <AdminLogin
        onLogin={(u) => {
          setUser(u);
          navigate(u.role === "editor" ? "/admin/posts" : "/admin/dashboard");
        }}
      />
    );
  const allowed = nav.filter(
    ([k]) =>
      user.role === "owner" ||
      (user.role === "manager" &&
        !["settings", "users", "audit", "webhooks"].includes(k)) ||
      (user.role === "editor" &&
        ["posts", "categories", "policies", "reviews"].includes(k)),
  );
  const def = modules[module],
    rows = Array.isArray(data) ? data : [],
    selected = recordId === "new" ? (def?.create ? {} : null) : rows.find(r => r.id === recordId),
    filtered = rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
    );
  const value = (r, k) =>
    k === "image" && module === "posts" ? (
      r.image ? (
        <img
          className="blog-table-image"
          src={imageUrl(r.image)}
          alt={r.title || "Blog featured image"}
          loading="lazy"
        />
      ) : <span className="blog-table-image blog-table-image-empty">No image</span>
    ) : ["status", "paymentStatus", "role"].includes(k) ? (
      <Badge value={r[k]} />
    ) : k.endsWith("Paise") ? (
      money(r[k])
    ) : k.endsWith("At") ? (
      date(r[k])
    ) : k === "active" ? (
      <Badge value={r[k] ? "active" : "disabled"} />
    ) : (
      String(r[k] ?? "—")
    );
  function exportCsv() {
    const quote = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""') +
      '"';
    const csv = [
      def.columns.map(quote).join(","),
      ...filtered.map((r) => def.columns.map((k) => quote(r[k])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = module + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="cms">
      <aside className={"cms-sidebar " + (mobile ? "is-open" : "")}>
        <Link className="cms-logo" to="/admin">
          <img src={imageUrl("/admin-logo.webp")} alt="Dr. Yogitha's" />
          <span>
            <Leaf size={21} />
          </span>
          <div>
            Dr. Yogitha’s<small>COMMERCE STUDIO</small>
          </div>
        </Link>
        <div className="workspace-label">
          YOUR WORKSPACE <span>PRIVATE</span>
        </div>
        <nav>
          {allowed.map(([k, label, I]) => (
            <div key={k}>
              {["products", "posts", "settings"].includes(k) && (
                <div className="nav-group">
                  {k === "products"
                    ? "CATALOGUE & COMMUNITY"
                    : k === "posts"
                      ? "CONTENT"
                      : "WORKSPACE"}
                </div>
              )}
              <Link
                className={"cms-nav " + (module === k ? "active" : "")}
                to={"/admin/" + k}
              >
                <I size={18} />
                <span>{label}</span>
                {module === k && <i className="active-dot" />}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" target="_blank">
            <ExternalLink size={15} />
            View storefront
            <ArrowUpRight size={15} />
          </Link>
          <div className="profile">
            <span className="avatar">S</span>
            <div>
              {user.name}
              <small>
                {user.role === "owner" ? "Workspace owner" : user.role}
              </small>
            </div>
            <button
              aria-label="Sign out"
              onClick={async () => {
                if (preview) {
                  navigate("/");
                  return;
                }
                await api("/auth/logout", { method: "POST" });
                setUser(null);
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="cms-main">
        <header className="cms-top">
          <div className="flex items-center gap-3">
            <button
              className="mobile-toggle"
              aria-label="Open menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {def?.title || (module === "settings" ? "Settings" : "Overview")}
            </strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="private-indicator">
              <ShieldCheck size={14} />
              Private workspace
            </span>
            <span className="avatar small">DY</span>
          </div>
        </header>
        <main className="cms-content">
          {preview && (
            <div className="demo-banner">
              <span>
                <i className="active-dot" />
                Interactive preview · Sample data. No live payments, emails or
                shipments.
              </span>
              <Link to="/">View website ?</Link>
            </div>
          )}
          {recordId ? (selected && def ? (
          <section
            className="cms-record-page"
            aria-labelledby="record-title"
          >
            <div className={`record-heading${module === "policies" ? " policy-record-heading" : ""}`}>
              <div>
                {!(["products", "posts", "policies", "payments", "orders", "leads", "reviews", "refunds", "shiprocket", "webhooks", "audit", "customers", "categories", "users"].includes(module)) && (
                  <p className="overline">{def.title}</p>
                )}
                <h1 id="record-title">
                  {module === "posts" ? (selected.id ? "Edit post" : "New post") : module === "policies" ? "Edit policy" : module === "products" ? (selected.id ? "Edit product" : "New product") : selected.id ? "Record details" : "Create new"}
                </h1>
              </div>
              <button
                className="btn secondary"
                autoFocus
                aria-label="Back to list"
                onClick={() => navigate("/admin/" + module)}
              >
                <ChevronLeft size={16} /> Back to list
              </button>
            </div>
            {def.fields ? (
              <RecordForm
                key={module + ":" + recordId}
                module={module}
                fields={def.fields}
                item={selected}
                busy={busy}
                onSave={(b) =>
                  mutate(
                    "/admin/" + module + (selected.id ? "/" + selected.id : ""),
                    selected.id ? "PATCH" : "POST",
                    b,
                  )
                }
                onDelete={
                  selected.id &&
                  module !== "leads" &&
                  deletableModules.includes(module)
                    ? () => deleteRecord(selected)
                    : null
                }
              />
            ) : (
              <Details
                module={module}
                item={selected}
                busy={busy}
                onAction={(body, path) =>
                  mutate(
                    path || "/admin/" + module + "/" + selected.id,
                    path ? "POST" : "PATCH",
                    body,
                  )
                }
              />
            )}
          </section>
) : <div className="cms-record-page"><Link className="btn secondary" to={"/admin/" + module}>Back to list</Link><p role="status">{data === null ? "Loading record..." : "Record not found."}</p></div>) : module === "dashboard" ? (
            <Dashboard data={data} />
          ) : module === "settings" ? (
            <SettingsForm
              data={data}
              busy={busy}
              onSave={(b) => mutate("/admin/settings", "PATCH", b)}
            />
          ) : def ? (
            <>
              <div className="page-heading">
                <div>
                  <h1>{def.title}</h1>
                  <p>{def.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn secondary" onClick={exportCsv}>
                    <Download size={16} />
                    Export
                  </button>
                  {def.create && (
                    <button className="btn" onClick={() => navigate("/admin/" + module + "/new")}>
                      <Plus size={16} />
                      Add{" "}
                      {module === "products"
                        ? "product"
                        : module === "posts"
                          ? "post"
                          : module === "categories"
                            ? "category"
                            : module === "reviews"
                              ? "review"
                              : "user"}
                    </button>
                  )}
                </div>
              </div>
              {module === "shiprocket" && (
                <div className="integration-banner">
                  <Truck size={23} />
                  <div>
                    <strong>Fulfilment, connected.</strong>
                    <p>
                      Create shipments, labels and pickup requests from an
                      order’s details.
                    </p>
                  </div>
                  <Link className="btn secondary" to="/admin/orders">
                    View orders <ArrowRight size={15} />
                  </Link>
                </div>
              )}
              <div className="table-card">
                <div className="table-toolbar">
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      aria-label="Search records"
                      placeholder={"Search " + def.title.toLowerCase()}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Filter status"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">All statuses</option>
                      {[
                        ...new Set(rows.map((r) => r.status).filter(Boolean)),
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="icon-button"
                      aria-label="Refresh records"
                      onClick={() => setVersion((v) => v + 1)}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {def.columns.map((k) => (
                          <th key={k}>{labels[k] || k}</th>
                        ))}
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data === null ? (
                        <tr>
                          <td
                            className="empty-state"
                            colSpan={def.columns.length + 1}
                          >
                            {error
                              ? "Unable to load records."
                              : "Loading records…"}
                          </td>
                        </tr>
                      ) : filtered.length ? (
                        filtered
                          .slice((page - 1) * size, page * size)
                          .map((r) => (
                            <tr
                              key={r.id}
                              tabIndex={0}
                              onClick={() => navigate("/admin/" + module + "/" + encodeURIComponent(r.id))}
                              onKeyDown={(e) => {
                                if (e.target === e.currentTarget && e.key === "Enter") navigate("/admin/" + module + "/" + encodeURIComponent(r.id));
                              }}
                            >
                              {def.columns.map((k, i) => (
                                <td
                                  className={k === "image" ? "blog-image-cell" : (module === "posts" ? k === "title" : i === 0) ? "primary-cell" : ""}
                                  key={k}
                                >
                                    <span className="cell-text">
                                      {value(r, k)}
                                    </span>
                                </td>
                              ))}
                              <td>
                                <div className="record-table-actions">
                                <ArrowUpRight size={16} />
                                {deletableModules.includes(module) && (
                                  <button
                                    type="button"
                                    className="icon-button delete-record-icon"
                                    title="Delete record"
                                    aria-label={`Delete ${r.name || r.title || r.id}`}
                                    disabled={busy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteRecord(r);
                                    }}
                                  >
                                    <Trash2 size={15} aria-hidden="true" />
                                  </button>
                                )}
                                  </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={def.columns.length + 1}>
                            <div className="empty-state">
                              <Package size={28} />
                              <strong>
                                {query
                                  ? "No matching records"
                                  : "A fresh start"}
                              </strong>
                              <p>
                                {query
                                  ? "Try another search."
                                  : "New " +
                                    def.title.toLowerCase() +
                                    " will appear here."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <span>
                    {filtered.length
                      ? `${(page - 1) * size + 1}–${Math.min(page * size, filtered.length)}`
                      : 0}{" "}
                    of {filtered.length} records
                  </span>
                  <div className="flex items-center gap-3">
                    <select
                      aria-label="Rows per page"
                      value={size}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n} / page
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={page === 1}
                      aria-label="Previous page"
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={page * size >= filtered.length}
                      aria-label="Next page"
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <h1>Page not found</h1>
          )}
          <div className="cms-bottom-line">
            <span>Dr. Yogitha’s · Commerce Studio</span>
            <span>Thoughtfully made. Simply managed.</span>
          </div>
        </main>
        {pendingDelete && (
          <div className="admin-confirm-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setPendingDelete(null);
          }}>
            <section className="admin-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description">
              <span className="admin-confirm-icon"><Trash2 size={20} /></span>
              <h2 id="delete-confirm-title">Delete this record?</h2>
              <p id="delete-confirm-description">“{pendingDelete.name}” will be permanently deleted. This action cannot be undone.</p>
              <div className="admin-confirm-actions">
                <button type="button" className="btn secondary" disabled={busy} onClick={() => setPendingDelete(null)}>Cancel</button>
                <button type="button" className="btn danger" disabled={busy} onClick={() => {
                  const record = pendingDelete;
                  setPendingDelete(null);
                  mutate("/admin/" + module + "/" + encodeURIComponent(record.id), "DELETE");
                }}>{busy ? "Deleting…" : "Delete record"}</button>
              </div>
            </section>
          </div>
        )}
      </div>

    </div>
  );
}
function Dashboard({ data }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your store, at a glance.</h1>
          <p>Welcome back. Here's what's happening with your store.</p>
        </div>
        <Link className="btn secondary" to="/" target="_blank">
          View storefront <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="welcome-card">
        <div>
          <span className="welcome-tag">
            <i className="active-dot" />
            YOUR COMMERCE STUDIO
          </span>
          <h2>
            Rooted in care.
            <br />
            Ready to grow.
          </h2>
          <p>
            Good things take intention. Manage your orders,
            <br />
            nurture your community and tell your story.
          </p>
          <Link to="/admin/orders">
            Manage orders <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-art">
          <img
            src={imageUrl("/product-showcase.webp")}
            alt="Dr. Yogitha's botanical hair oil"
          />
          <span>THE EVERYDAY RITUAL</span>
        </div>
      </div>
      <div className="stats-grid">
        {[
          [
            "Total collections",
            data ? money(data.revenuePaise) : "—",
            CreditCard,
            "Recorded payments, less refunds",
          ],
          ["Orders", data?.orders ?? "—", ShoppingBag, "Across your store"],
          [
            "Customers",
            data?.customers ?? "—",
            Users,
            "Registered community members",
          ],
          [
            "New enquiries",
            data?.leads ?? "—",
            MessageSquare,
            "Waiting for your response",
          ],
        ].map(([t, v, I, p]) => (
          <article className="stat-card" key={t}>
            <div>
              {t}
              <I size={18} />
            </div>
            <strong>{v}</strong>
            <p>{p}</p>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="table-card">
          <div className="card-heading">
            <div>
              <h2>Recent orders</h2>
              <p>A little progress, with every order.</p>
            </div>
            <Link to="/admin/orders">View all ?</Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.length ? (
                  data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link className="primary-cell" to="/admin/orders">
                          {o.id}
                        </Link>
                        <small>{date(o.createdAt)}</small>
                      </td>
                      <td>{o.customer}</td>
                      <td>{money(o.totalPaise)}</td>
                      <td>
                        <Badge value={o.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      {data
                        ? "Your first order will appear here."
                        : "Loading your store…"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="quick-card">
          <span className="small-leaf">
            <Leaf size={21} />
          </span>
          <h2>A space for your story.</h2>
          <p>
            Share the inspiration behind your collection. A new journal entry is
            a lovely place to start.
          </p>
          <Link className="btn secondary" to="/admin/posts">
            Open the journal <ArrowUpRight size={16} />
          </Link>
          <hr />
          <h3>Quick actions</h3>
          {[
            ["products", "Manage your collection", Package],
            ["reviews", "Review customer feedback", Star],
            ["leads", "Follow up on enquiries", MessageSquare],
          ].map(([p, t, I]) => (
            <Link className="quick-link" to={"/admin/" + p} key={p}>
              <I size={16} />
              {t}
              <ChevronRight size={15} />
            </Link>
          ))}
        </section>
      </div>
      <div className="integration-grid">
        {[
          [
            "SMTP email",
            data?.integrations?.smtp,
            "Order and account notifications",
          ],
          [
            "Shiprocket",
            data?.integrations?.shiprocket,
            "Shipping and tracking",
          ],
          [
            `Razorpay (${data?.integrations?.razorpay?.mode || "test"} mode)`,
            data?.integrations?.onlinePayments,
            "Online payment checkout",
          ],
          [
            "Razorpay webhook",
            data?.integrations?.razorpay?.webhook,
            "Payment event notifications",
          ],
          [
            "Shiprocket webhook",
            data?.integrations?.shiprocketWebhook,
            "Shipment tracking notifications",
          ],
          ["Cash on delivery", data?.integrations?.cod, "Customer checkout"],
        ].map(([n, on, d]) => (
          <div key={n}>
            <i className={"connection-dot " + (on ? "on" : "")} />
            <div>
              <strong>{n}</strong>
              <p>{d}</p>
            </div>
            <Badge value={on ? "enabled" : "setup required"} />
          </div>
        ))}
      </div>
    </>
  );
}
function RecordForm(props) {
  if (props.module === "products") return <ProductRecordForm {...props} />;
  return ["posts", "policies"].includes(props.module) ? <ContentForm {...props} /> : <GenericRecordForm {...props} />;
}
function ProductRecordForm({ item, busy, onSave }) {
  const [values, setValues] = useState({
    name: "", slug: "", sku: "", description: "", pricePaise: 0, stock: 0,
    compareAtPricePaise: 0, price100Paise: 0, compareAt100Paise: 0, stock100: 0,
    image: "", image100: "", status: "draft", weight: 0, length: 0, breadth: 0,
    height: 0, seoTitle: "", seoDescription: "", ...item,
    ...Object.fromEntries(["pricePaise", "compareAtPricePaise", "price100Paise", "compareAt100Paise"].map((key) => [key, (item[key] || 0) / 100])),
  });
  const [faq, setFaq] = useState(item.faq || []);
  const [uploading, setUploading] = useState({});
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const upload = async (key, file, input) => {
    if (!file) return;
    setUploading((current) => ({ ...current, [key]: true }));
    try { set(key, await uploadImage(file)); }
    catch (error) { toast.error(error.message); }
    finally { setUploading((current) => ({ ...current, [key]: false })); input.value = ""; }
  };
  const textField = (key, label, placeholder, type = "text") => (
    <label key={key} className={`product-input-field product-field-${key}`}>
      {label}
      {type === "textarea" ? <textarea value={values[key] ?? ""} placeholder={placeholder} rows={2} onChange={(event) => set(key, event.target.value)} />
        : <input type={type} min={type === "number" ? "0" : undefined} step={type === "number" && ["weight", "length", "breadth", "height"].includes(key) ? ".01" : "1"} value={values[key] ?? ""} placeholder={placeholder} onChange={(event) => set(key, type === "number" ? Number(event.target.value) : event.target.value)} />}
    </label>
  );
  const imageField = (key, label) => (
    <label key={key} className={`product-input-field product-upload-field product-field-${key}`}>
      {key !== "image" && <span>{label}</span>}
      {key === "image" ? <span className="product-upload-control product-main-upload">
        {values[key] ? <img src={imageUrl(values[key])} alt={`${label} preview`} /> : <span className="product-image-empty"><Package size={25} /></span>}
        <span className="product-main-upload-copy">
          <strong>{label}</strong>
          <small>{uploading[key] ? "Uploading…" : "Upload JPG, PNG or WebP up to 5 MB."}</small>
          <span className="product-choose-file">Choose file</span>
          <input className="product-hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading[key] || busy} onChange={(event) => upload(key, event.currentTarget.files?.[0], event.currentTarget)} />
        </span>
      </span> : <span className="product-upload-control product-optional-upload">
        {values[key] && <img src={imageUrl(values[key])} alt={`${label} preview`} />}
        <span><input className="product-native-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading[key] || busy} onChange={(event) => upload(key, event.currentTarget.files?.[0], event.currentTarget)} /><small>{uploading[key] ? "Uploading…" : "JPG, PNG or WebP; up to 5 MB."}</small></span>
      </span>}
    </label>
  );
  const groups = [
    { title: "Basic information", fields: [textField("name", "Product name *", "e.g. Ayurvedic Hair Oil"), textField("slug", "URL slug *", "e.g. ayurvedic-hair-oil"), textField("sku", "SKU", "e.g. AYU-001"), textField("description", "Description *", "Describe the product and how to use it", "textarea")] },
    { title: "Pricing & inventory", fields: [textField("pricePaise", "50 ml price (₹)", "e.g. 599", "number"), textField("stock", "50 ml stock", "e.g. 25", "number"), textField("compareAtPricePaise", "50 ml original price (₹)", "0 for no discount", "number"), textField("price100Paise", "100 ml price (₹)", "e.g. 999", "number"), textField("compareAt100Paise", "100 ml original price (₹)", "0 for no discount", "number"), textField("stock100", "100 ml stock", "e.g. 25", "number"), imageField("image100", "100 ml image (optional)"), <label key="status" className="product-input-field">Status<select value={values.status} onChange={(event) => set("status", event.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>] },
    { title: "Product image", fields: [imageField("image", "50 ml product image")] },
    { title: "Dimensions & weight", fields: [textField("length", "Length (cm)", "e.g. 10", "number"), textField("breadth", "Breadth (cm)", "e.g. 6", "number"), textField("height", "Height (cm)", "e.g. 6", "number"), textField("weight", "Weight (kg)", "e.g. 0.25", "number"), textField("seoDescription", "SEO description", "Write a short search result description"), textField("seoTitle", "SEO title", "Enter the search result title")] },
  ];
  return (
    <form className="product-record-form" onSubmit={(event) => {
      event.preventDefault();
      if (Object.values(uploading).some(Boolean)) return;
      if (!values.name.trim() || !values.slug.trim()) { toast.error("Product name and URL slug are required."); return; }
      onSave({ ...values, ...Object.fromEntries(["pricePaise", "compareAtPricePaise", "price100Paise", "compareAt100Paise"].map((key) => [key, Math.round(Number(values[key] || 0) * 100)])), faq });
    }}>
      {groups.map((group) => <section className={`product-form-section product-${group.title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`} key={group.title}><h2><Leaf size={15} />{group.title}</h2><div className="product-form-grid">{group.fields}</div></section>)}
      <section className="product-form-section product-faq-section"><h2><Leaf size={15} />Product questions & answers</h2>
        <div className="product-faq-list">{faq.map((entry, index) => <div className="product-faq-item" key={index}>
          <label>Question<input value={entry.question} placeholder="e.g. How often should I use the hair oil?" onChange={(event) => setFaq(faq.map((current, row) => row === index ? { ...current, question: event.target.value } : current))} /></label>
          <label>Answer<textarea value={entry.answer} placeholder="Write a helpful answer for customers" rows={2} onChange={(event) => setFaq(faq.map((current, row) => row === index ? { ...current, answer: event.target.value } : current))} /></label>
          <button type="button" className="text-button danger" onClick={() => setFaq(faq.filter((_, row) => row !== index))}>Remove question</button>
        </div>)}</div>
        <button type="button" className="btn secondary product-add-question" onClick={() => setFaq([...faq, { question: "", answer: "" }])}><Plus size={15} />Add question</button>
      </section>
      <div className="product-form-actions"><Link className="btn secondary" to="/admin/products">Cancel</Link><button className="btn" disabled={busy || Object.values(uploading).some(Boolean)}>{Object.values(uploading).some(Boolean) ? "Uploading…" : busy ? "Saving…" : item.id ? "Save changes" : "Create product"}<Check size={16} /></button></div>
    </form>
  );
}
function GenericRecordForm({ module, fields, item, busy, onSave, onDelete }) {
  const examples = {
    "products.name": "e.g. Ayurvedic Hair Oil",
    "products.slug": "e.g. ayurvedic-hair-oil",
    "products.sku": "e.g. DY-HO-50",
    "products.description": "Describe the product, its ingredients and how to use it",
    "products.pricePaise": "e.g. 599",
    "products.stock": "e.g. 25",
    "products.compareAtPricePaise": "e.g. 699, or 0 for no discount",
    "products.price100Paise": "e.g. 999",
    "products.compareAt100Paise": "e.g. 1199, or 0 for no discount",
    "products.stock100": "e.g. 25",
    "products.weight": "e.g. 0.25",
    "products.length": "e.g. 10",
    "products.breadth": "e.g. 6",
    "products.height": "e.g. 6",
    "products.seoTitle": "Enter the search result title",
    "products.seoDescription": "Enter a short search result description",
    "leads.name": "e.g. Priya Sharma",
    "leads.email": "e.g. priya@example.com",
    "leads.phone": "e.g. +91 98765 43210",
    "leads.subject": "What is the enquiry about?",
    "leads.message": "Enter the customer’s message",
    "reviews.name": "e.g. Priya Sharma",
    "reviews.location": "e.g. Bengaluru, Karnataka",
    "reviews.rating": "Choose a rating from 1 to 5",
    "reviews.content": "Write the customer review",
    "posts.title": "Enter the blog post title",
    "posts.slug": "e.g. mindful-hair-care-ritual",
    "posts.excerpt": "Write a short summary for the blog listing",
    "posts.content": "Write the article content",
    "posts.author": "e.g. Dr. Yogitha",
    "posts.image": "Paste an image URL",
    "posts.seoTitle": "Enter the search result title",
    "posts.seoDescription": "Enter a short search result description",
    "categories.name": "e.g. Hair Care",
    "categories.slug": "e.g. hair-care",
    "categories.description": "Describe this blog category",
    "policies.title": "e.g. Shipping Policy",
    "policies.slug": "e.g. shipping-policy",
    "policies.content": "Enter the policy information for customers",
    "policies.seoTitle": "Enter the search result title",
    "policies.seoDescription": "Enter a short search result description",
    "users.name": "e.g. Priya Sharma",
    "users.email": "e.g. priya@example.com",
    "users.password": "Enter an initial password (at least 10 characters)",
  };
  const [values, setValues] = useState({
      ...Object.fromEntries(
        Object.entries(fields).map(([k, s]) => [
          k,
          s.endsWith("|number")
            ? 0
            : s.endsWith("|boolean")
              ? true
              : s.split("|")[1]?.includes(",")
                ? s.split("|")[1].split(",")[0]
                : "",
        ]),
      ),
      ...item,
      ...(module === "products"
        ? Object.fromEntries(["pricePaise", "compareAtPricePaise", "price100Paise", "compareAt100Paise"].map(k => [k, (item[k] || 0) / 100]))
        : {}),
    }),
    [faq, setFaq] = useState(item.faq || []),
    [categories, setCategories] = useState([]),
    [uploadingImages, setUploadingImages] = useState({});
  const uploadProductImage = async (field, file, input) => {
    if (!file) return;
    setUploadingImages(current => ({ ...current, [field]: true }));
    try {
      const url = await uploadImage(file);
      setValues(current => ({ ...current, [field]: url }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingImages(current => ({ ...current, [field]: false }));
      input.value = "";
    }
  };
  useEffect(() => {
    if (module === "posts")
      api("/admin/categories")
        .then(setCategories)
        .catch(() => {});
  }, [module]);
  return (
    <form
      className="cms-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (Object.values(uploadingImages).some(Boolean)) return;
        onSave({
          ...values,
          ...(module === "products"
            ? { ...Object.fromEntries(["pricePaise", "compareAtPricePaise", "price100Paise", "compareAt100Paise"].map(k => [k, Math.round(values[k] * 100)])), faq }
            : {}),
        });
      }}
    >
      {Object.entries(fields)
        .filter(
          ([k]) =>
            !(
              module === "users" &&
              item.id &&
              ["name", "email", "password"].includes(k)
            ),
        )
        .map(([k, s]) => {
          const [label, type] = s.split("|");
          const props = {
            id: "field-" + k,
            value: values[k] ?? "",
            placeholder:
              examples[`${module}.${k}`] ||
              (type === "textarea" ? `Enter ${label.toLowerCase()}` : undefined),
            onChange: (e) =>
              setValues({
                ...values,
                [k]:
                  type === "number" ? Number(e.target.value) : e.target.value,
              }),
          };
          return (
            <label key={k} htmlFor={props.id}>
              {label}
              {type === "textarea" ? (
                <textarea {...props} rows={k === "content" ? (module === "reviews" ? 4 : 12) : 3} />
              ) : type === "image-upload" ? (
                <>
                  {values[k] && (
                    <img
                      className="product-image-preview"
                      src={imageUrl(values[k])}
                      alt={`${label} preview`}
                    />
                  )}
                  <input
                    id={props.id}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingImages[k] || busy}
                    onChange={e => uploadProductImage(k, e.currentTarget.files?.[0], e.currentTarget)}
                  />
                  <small>
                    {uploadingImages[k] ? "Uploading image…" : "JPG, PNG or WebP; up to 5 MB."}
                  </small>
                </>
              ) : type === "category" ? (
                <select {...props}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : type === "boolean" ? (
                <select
                  id={props.id}
                  value={String(values[k])}
                  onChange={(e) =>
                    setValues({ ...values, [k]: e.target.value === "true" })
                  }
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : type?.includes(",") ? (
                <select {...props}>
                  {type.split(",").map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  {...props}
                  type={type || "text"}
                  min="0"
                  step={
                    [
                      "pricePaise",
                      "compareAtPricePaise",
                      "price100Paise",
                      "compareAt100Paise",
                      "weight",
                      "length",
                      "breadth",
                      "height",
                    ].includes(k)
                      ? ".01"
                      : "1"
                  }
                  minLength={type === "password" ? 10 : undefined}
                  autoComplete={
                    type === "password" ? "new-password" : undefined
                  }
                />
              )}
            </label>
          );
        })}
      {module === "products" && (
        <div>
          <h3>Product questions & answers</h3>
          {faq.map((f, i) => (
            <div className="detail-box" key={i}>
              <label>
                Question
                <input
                  value={f.question}
                  placeholder="e.g. How often should I use the hair oil?"
                  onChange={(e) =>
                    setFaq(
                      faq.map((x, n) =>
                        n === i ? { ...x, question: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Answer
                <textarea
                  value={f.answer}
                  placeholder="Write a helpful answer for customers"
                  onChange={(e) =>
                    setFaq(
                      faq.map((x, n) =>
                        n === i ? { ...x, answer: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setFaq(faq.filter((_, n) => n !== i))}
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() => setFaq([...faq, { question: "", answer: "" }])}
          >
            <Plus size={15} />
            Add question
          </button>
        </div>
      )}
      <div className="form-actions">
        <button className="btn" disabled={busy || Object.values(uploadingImages).some(Boolean)}>
        {Object.values(uploadingImages).some(Boolean) ? "Uploading image…" : busy ? "Saving…" : "Save changes"}
          <Check size={16} />
        </button>
        {onDelete && module !== "categories" && (
          <button
            type="button"
            className="text-button danger"
            disabled={busy}
            onClick={onDelete}
          >
            Delete record
          </button>
        )}
      </div>
    </form>
  );
}
function Details({ module, item, busy, onAction }) {
  const [status, setStatus] = useState(""),
    [reference, setReference] = useState("");
  useEffect(() => {
    if (item.error) toast.error(item.error);
  }, [item.error]);
  const choices =
    module === "orders"
      ? {
          placed: ["confirmed", "cancelled"],
          confirmed: ["processing", "cancelled"],
          processing: ["shipped", "cancelled"],
          shipped: ["delivered"],
        }[item.status] || []
      : module === "refunds"
        ? {
            requested: ["approved", "rejected"],
            approved: ["processed", "rejected"],
          }[item.status] || []
        : module === "payments" && item.status === "pending"
          ? ["paid"]
          : [];
  const action = (a) => onAction({}, "/admin/shiprocket/" + item.id + "/" + a);
  if (module === "payments") {
    return <PaymentDetails item={item} choices={choices} status={status} setStatus={setStatus} reference={reference} setReference={setReference} busy={busy} onAction={onAction} />;
  }
  if (module === "refunds") {
    return <RefundDetails item={item} choices={choices} status={status} setStatus={setStatus} reference={reference} setReference={setReference} busy={busy} onAction={onAction} />;
  }
  if (module === "shiprocket") {
    return <ShiprocketDetails item={item} />;
  }
  if (module === "webhooks") {
    return <WebhookDetails item={item} />;
  }
  if (module === "audit") {
    return <AuditDetails item={item} />;
  }
  if (module === "orders") {
    return <OrderDetails item={item} choices={choices} status={status} setStatus={setStatus} busy={busy} onAction={onAction} action={action} />;
  }
  if (module === "customers") {
    const customerEntries = Object.entries(item).filter(
      ([key, value]) => !["userId", "idempotencyKey"].includes(key) && value !== undefined && value !== null && (typeof value !== "object" || key === "address"),
    );
    return (
      <div className="customer-details-view">
        <section className="customer-details-card">
          <h2><Users size={21} /> Customer details</h2>
          <dl className="detail-list">
            {customerEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{labels[key] || key}</dt>
                <dd>{key.endsWith("Paise") ? money(value) : key.endsWith("At") ? date(value) : key === "address" && typeof value === "object" ? Object.values(value).filter(Boolean).join(", ") : String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    );
  }
  return (
    <div className="cms-form">
      <dl className="detail-list">
        {Object.entries(item)
          .filter(
            ([k, v]) =>
              !["userId", "idempotencyKey"].includes(k) &&
              typeof v !== "object",
          )
          .map(([k, v]) => (
            <div key={k}>
              <dt>{labels[k] || k}</dt>
              <dd>
                {k.endsWith("Paise")
                  ? money(v)
                  : k.endsWith("At")
                    ? date(v)
                    : String(v)}
              </dd>
            </div>
          ))}
      </dl>
      {item.address && (
        <div className="detail-box">
          <h3>Delivery address</h3>
          <p>{Object.values(item.address).filter(Boolean).join(", ")}</p>
        </div>
      )}
      {item.timeline && (
        <div className="detail-box">
          <h3>Order timeline</h3>
          {item.timeline.map((t, i) => (
            <p key={i}>
              {t.status} · {date(t.at)}
            </p>
          ))}
        </div>
      )}
      {item.shipment && (
        <div className="detail-box">
          <h3>Shipment</h3>
          <pre>{JSON.stringify(item.shipment, null, 2)}</pre>
        </div>
      )}
      {module === "webhooks" && (
        <div className="detail-box">
          <h3>Webhook payload</h3>
          <pre>{JSON.stringify(item.payload, null, 2)}</pre>
        </div>
      )}
      {choices.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAction({ status: status || choices[0], reference });
          }}
        >
          <label>
            Next status
            <select
              value={status || choices[0]}
              onChange={(e) => setStatus(e.target.value)}
            >
              {choices.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {["refunds", "payments"].includes(module) && (
            <label>
              Actual transaction / collection reference
              <input
                value={reference}
                placeholder="e.g. payment or refund reference ID"
                onChange={(e) => setReference(e.target.value)}
                required={module === "payments" || status === "processed"}
              />
              <small>
                This records money already collected or refunded. It does not
                move money.
              </small>
            </label>
          )}
          <button className="btn" disabled={busy}>
            Update status <ArrowRight size={15} />
          </button>
        </form>
      )}
      {module === "orders" &&
        ["confirmed", "processing", "shipped"].includes(item.status) && (
          <div className="detail-box">
            <h3>Shiprocket fulfilment</h3>
            <p>Use your configured account to book and track this order.</p>
            <div className="flex flex-wrap gap-2">
              {!item.shipment ? (
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => action("create")}
                >
                  Create shipment
                </button>
              ) : !item.shipment.awb && item.shipment.shipment_id ? (
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => action("awb")}
                >
                  Assign courier & AWB
                </button>
              ) : item.shipment.awb ? (
                <>
                  {!item.shipment.pickup && (
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => action("pickup")}
                    >
                      Request pickup
                    </button>
                  )}
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => action("label")}
                  >
                    Generate label
                  </button>
                  {item.shipment.pickup && (
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => action("manifest")}
                    >
                      Generate manifest
                    </button>
                  )}
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => action("track")}
                  >
                    Refresh tracking
                  </button>
                  {[
                    ["label", "label_url"],
                    ["manifest", "manifest_url"],
                  ].map(
                    ([k, f]) =>
                      item.shipment[k]?.[f]?.startsWith("https://") && (
                        <a
                          key={k}
                          className="btn secondary"
                          href={item.shipment[k][f]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download {k}
                        </a>
                      ),
                  )}
                </>
              ) : (
                <>
                  <p>Reconcile this booking in Shiprocket before continuing.</p>
                  {item.shipment.status === "needs-reconciliation" && (
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Confirm you checked Shiprocket and this order has no shipment. This clears the pending marker so you can try booking again.")) action("retry");
                      }}
                    >
                      Confirm not found and allow retry
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
function AuditDetails({ item }) {
  const fields = [
    ["Action", item.action],
    ["User", item.userId],
    ["Date and time", item.createdAt ? date(item.createdAt) : ""],
  ].filter(([, value]) => value !== undefined && value !== "");
  const known = new Set(["id", "action", "userId", "createdAt"]);
  const extraFields = Object.entries(item).filter(([key, value]) => !known.has(key) && typeof value !== "object" && value !== "").map(([key, value]) => [key.replace(/([A-Z])/g, " $1").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()), key.endsWith("At") ? date(value) : String(value)]);
  return (
    <div className="shiprocket-details-view audit-details-view">
      <section className="shiprocket-info-card audit-info-card">
        <h2><ScrollText size={19} /> Activity details</h2>
        <dl>{[...fields, ...extraFields].map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>
      </section>
    </div>
  );
}
function WebhookDetails({ item }) {
  const fields = [
    ["Provider", item.provider],
    ["Event type", item.eventType],
    ["Status", item.status],
    ["Event reference", item.providerEventId],
    ["Received", item.createdAt ? date(item.createdAt) : ""],
    ["Processed", item.processedAt ? date(item.processedAt) : ""],
    ["Error", item.error],
  ].filter(([, value]) => value !== undefined && value !== "");
  return (
    <div className="shiprocket-details-view webhook-details-view">
      <section className="shiprocket-info-card webhook-info-card">
        <h2><Webhook size={19} /> Webhook event details</h2>
        <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={label === "Status" ? "webhook-status-value" : ""}>{label === "Status" ? <span>{String(value).replaceAll("_", " ")}</span> : String(value)}</dd></div>)}</dl>
      </section>
      {item.payload && <section className="shiprocket-info-card webhook-payload-card">
        <h2><FileText size={19} /> Event payload</h2>
        <pre>{JSON.stringify(item.payload, null, 2)}</pre>
      </section>}
    </div>
  );
}
function ShiprocketDetails({ item }) {
  const fields = [
    ["Order", item.orderId],
    ["Customer", item.customer],
    ["Order status", item.status],
    ["Shipment ID", item.shipment_id],
    ["AWB", item.awb],
    ["Courier", item.courier],
    ["Pickup status", item.pickup_status],
    ["Tracking URL", item.tracking_url],
    ["Created", item.created_at ? date(item.created_at) : ""],
    ["Updated", item.updated_at ? date(item.updated_at) : ""],
  ].filter(([, value]) => value !== undefined && value !== "");
  const known = new Set(["id", "orderId", "customer", "status", "shipment_id", "awb", "courier", "pickup_status", "tracking_url", "created_at", "updated_at"]);
  const extraFields = Object.entries(item).filter(([key, value]) => !known.has(key) && typeof value !== "object" && value !== "").map(([key, value]) => [key.replace(/([A-Z])/g, " $1").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()), key.endsWith("At") ? date(value) : String(value)]);
  return (
    <div className="shiprocket-details-view">
      <section className="shiprocket-info-card">
        <h2><Truck size={19} /> Shipment details</h2>
        <dl>{[...fields, ...extraFields].map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd className={label.toLowerCase().includes("status") ? "shiprocket-status-value" : ""}>{label.toLowerCase().includes("status") ? <span>{String(value).replaceAll("_", " ")}</span> : String(value)}</dd></div>)}</dl>
      </section>
    </div>
  );
}
function RefundDetails({ item, choices, status, setStatus, reference, setReference, busy, onAction }) {
  const details = [
    ["Order", item.orderId],
    ["Customer", item.customer],
    ["Amount", item.amountPaise != null ? money(item.amountPaise) : ""],
    ["Reason", item.reason],
    ["Status", item.status],
    ["Created", item.createdAt ? date(item.createdAt) : ""],
    ["Reference", item.reference],
    ["Updated", item.updatedAt ? date(item.updatedAt) : ""],
  ].filter(([, value]) => value !== undefined && value !== "");
  return (
    <div className="refund-details-view">
      <section className="refund-info-card">
        <h2><FileText size={19} /> Refund request details</h2>
        <dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={label === "Status" ? "refund-status-value" : ""}>{label === "Status" ? <span>{String(value).replaceAll("_", " ")}</span> : String(value)}</dd></div>)}</dl>
      </section>
      {choices.length > 0 && <form className="refund-update-card" onSubmit={(event) => { event.preventDefault(); onAction({ status: status || choices[0], reference }); }}>
        <h2><RotateCcw size={19} /> Update refund status</h2>
        <label>Next status<select value={status || choices[0]} onChange={(event) => setStatus(event.target.value)}>{choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
        <label>Actual transaction / collection reference<input value={reference} placeholder="e.g. payment or refund reference ID" onChange={(event) => setReference(event.target.value)} required={status === "processed" || (!status && choices[0] === "processed")} /></label>
        <p className="refund-update-note"><Info size={16} /> This records money already collected or refunded. It does not move money.</p>
        <button className="btn" disabled={busy}>{busy ? "Updating…" : "Update status"}<ArrowRight size={15} /></button>
      </form>}
    </div>
  );
}
function PaymentDetails({ item, choices, status, setStatus, reference, setReference, busy, onAction }) {
  const details = [
    ["Amount", money(item.amountPaise)],
    ["Method", item.method],
    ["Status", item.status],
    ["Created", item.createdAt ? date(item.createdAt) : ""],
    ["Updated", item.updatedAt ? date(item.updatedAt) : ""],
    ["Provider order ID", item.providerOrderId],
    ["Provider payment ID", item.providerPaymentId],
    ["Reference", item.reference],
  ].filter(([, value]) => value !== undefined && value !== "");
  return (
    <div className="payment-details-view">
      <section className="payment-overview-strip" aria-label="Payment overview">
        <div><Store size={20} /><p><strong>{item.customer || "Customer"}</strong><span>Customer</span></p></div>
        <div><CreditCard size={20} /><p><strong className="payment-method-chip">{item.method || "—"}</strong><span>Method</span></p></div>
        <div><BadgeCheck size={21} /><p><strong className="payment-status-chip">{String(item.status || "pending").replaceAll("_", " ")}</strong><span>Status</span></p></div>
        <div className="payment-overview-amount"><p><strong>{money(item.amountPaise || 0)}</strong><span>Amount</span></p></div>
      </section>

      <section className="payment-record-card">
        <h2><CreditCard size={19} /> Payment record</h2>
        <div className="payment-record-identity">
          <div><span>Reference</span><strong>{item.id || "—"}</strong></div>
          <div><span>Order</span><strong>{item.orderId || "—"}</strong></div>
          <div className="payment-customer-summary"><span className="payment-customer-icon"><Store size={18} /></span><p><strong>{item.customer || "Customer"}</strong><small>Customer</small></p></div>
        </div>
        <dl className="payment-record-grid">
          {details.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd className={label === "Status" ? "payment-status-value" : ""}>{label === "Status" ? <span>{String(value).replaceAll("_", " ")}</span> : String(value)}</dd></div>
          ))}
        </dl>
      </section>

      {choices.length > 0 && <form className="payment-update-card" onSubmit={(event) => { event.preventDefault(); onAction({ status: status || choices[0], reference }); }}>
        <div className="payment-update-copy"><h2>Update payment status</h2><p>Record the actual payment confirmation and its reference.</p></div>
        <label>Next status<select value={status || choices[0]} onChange={(event) => setStatus(event.target.value)}>{choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
        <label>Transaction reference<input value={reference} placeholder="e.g. Razorpay payment ID" onChange={(event) => setReference(event.target.value)} required /></label>
        <button className="btn" disabled={busy}>{busy ? "Updating…" : "Update status"}<ArrowRight size={15} /></button>
      </form>}
    </div>
  );
}
function OrderDetails({ item, choices, status, setStatus, busy, onAction, action }) {
  const items = item.items?.length ? item.items : [{
    productName: item.productName || "Order item",
    quantity: item.quantity || 1,
    unitPricePaise: item.unitPricePaise || 0,
    subtotalPaise: item.subtotalPaise || item.totalPaise || 0,
    image: item.image || "",
    sizeLabel: item.sizeLabel,
  }];
  const subtotal = item.subtotalPaise ?? items.reduce((sum, line) => sum + (line.subtotalPaise || 0), 0);
  const shipping = item.shippingPaise || 0;
  const address = item.address || {};
  const hasShiprocket = ["confirmed", "processing", "shipped"].includes(item.status);
  return (
    <div className="order-details-view">
      <section className="order-overview-strip" aria-label="Order overview">
        <div><Package size={22} /><p><span>Order number</span><strong>#{item.id}</strong></p></div>
        <div><CalendarDays size={21} /><p><span>Order date</span><strong>{date(item.createdAt)}</strong></p></div>
        <div><BadgeCheck size={23} /><p><span>Status</span><strong className="order-status-chip">{String(item.status || "pending").replaceAll("_", " ")}</strong></p></div>
      </section>

      <div className="order-primary-grid">
        <section className="order-card order-info-card">
          <h2><FileText size={18} /> Order information</h2>
          <dl>
            {[["Customer", item.customer], ["Email", item.email], ["Product", item.productName], ["Quantity", item.quantity], ["Payment method", item.paymentMethod], ["Payment status", item.paymentStatus]].filter(([, value]) => value !== undefined && value !== "").map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{String(value).replaceAll("_", " ")}</dd></div>
            ))}
          </dl>
        </section>

        <section className="order-card order-summary-card">
          <h2><ShoppingBag size={18} /> Order summary</h2>
          <div className="order-line-items">
            {items.map((line, index) => (
              <div className="order-line-item" key={line.id || line.variantId || index}>
                {line.image ? <img src={imageUrl(line.image)} alt="" /> : <span className="order-item-placeholder"><Package size={19} /></span>}
                <p><strong>{line.productName || line.name || "Product"}</strong><span>{line.sizeLabel || line.variantLabel || ""}{line.quantity ? ` · Qty ${line.quantity}` : ""}</span></p>
                <strong>{money(line.subtotalPaise ?? line.unitPricePaise ?? 0)}</strong>
              </div>
            ))}
          </div>
          <div className="order-total-lines">
            <p><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
            <p><span>Shipping</span><strong>{shipping ? money(shipping) : "Free"}</strong></p>
            <p className="order-total"><span>Total</span><strong>{money(item.totalPaise || 0)}</strong></p>
          </div>
        </section>
      </div>

      <div className="order-secondary-grid">
        {Object.keys(address).length > 0 && <section className="order-card order-address-card">
          <h2><MapPin size={18} /> Delivery address</h2>
          <p>{[address.name, address.phone, address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(", ")}</p>
        </section>}
        {item.timeline?.length > 0 && <section className="order-card order-timeline-card">
          <h2><Clock3 size={18} /> Order timeline</h2>
          <ol>{item.timeline.map((event, index) => <li key={`${event.status}-${event.at}-${index}`}><span className="order-timeline-marker" /><div><strong>{String(event.status).replaceAll("_", " ")}</strong><time>{date(event.at)}</time></div></li>)}</ol>
        </section>}
        {item.shipment && <section className="order-card order-shipment-card">
          <h2><Truck size={18} /> Shipment details</h2>
          <pre>{JSON.stringify(item.shipment, null, 2)}</pre>
        </section>}
      </div>

      {choices.length > 0 && <form className="order-action-card" onSubmit={(event) => { event.preventDefault(); onAction({ status: status || choices[0] }); }}>
        <label>Update status<select value={status || choices[0]} onChange={(event) => setStatus(event.target.value)}>{choices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
        <button className="btn" disabled={busy}>{busy ? "Updating…" : "Update status"}<ArrowRight size={15} /></button>
      </form>}

      {hasShiprocket && <section className="order-card order-fulfilment-card">
        <h2><Truck size={18} /> Shipping & fulfilment</h2>
        <p>Manage the shipment and shipping documents for this order.</p>
        <div className="order-fulfilment-actions">
          {!item.shipment ? <button className="btn secondary" disabled={busy} onClick={() => action("create")}>Create shipment</button>
            : !item.shipment.awb && item.shipment.shipment_id ? <button className="btn secondary" disabled={busy} onClick={() => action("awb")}>Assign courier & AWB</button>
              : item.shipment.awb ? <>
                {!item.shipment.pickup && <button className="btn secondary" disabled={busy} onClick={() => action("pickup")}>Request pickup</button>}
                <button className="btn secondary" disabled={busy} onClick={() => action("label")}>Generate label</button>
                {item.shipment.pickup && <button className="btn secondary" disabled={busy} onClick={() => action("manifest")}>Generate manifest</button>}
                <button className="btn secondary" disabled={busy} onClick={() => action("track")}>Refresh tracking</button>
                {[ ["label", "label_url"], ["manifest", "manifest_url"] ].map(([key, field]) => item.shipment[key]?.[field]?.startsWith("https://") && <a className="btn secondary" key={key} href={item.shipment[key][field]} target="_blank" rel="noreferrer">Download {key}</a>)}
              </> : <><span className="order-reconcile-note">Reconcile this booking in Shiprocket before continuing.</span>{item.shipment.status === "needs-reconciliation" && <button className="btn secondary" disabled={busy} onClick={() => { if (confirm("Confirm you checked Shiprocket and this order has no shipment. This clears the pending marker so you can try booking again.")) action("retry"); }}>Confirm not found and allow retry</button>}</>}
        </div>
      </section>}
    </div>
  );
}
function SettingsForm({ data, busy, onSave }) {
  const [form, setForm] = useState(null),
    [uploadingSocialImage, setUploadingSocialImage] = useState(false),
    [socialImageFileName, setSocialImageFileName] = useState("");
  useEffect(() => {
    if (data) setForm({ ...data, shippingPaise: data.shippingPaise / 100 });
  }, [data]);
  if (!form) return <p>Loading settings…</p>;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Store settings</h1>
          <p>Your identity, contact details and search appearance.</p>
        </div>
      </div>
      <form
        className="settings-grid cms-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            shippingPaise: Math.round(Number(form.shippingPaise) * 100),
          });
        }}
      >
        {[
          [
            "Brand & contact",
            [
              ["brand", "Brand name"],
              ["description", "Brand description"],
              ["email", "Support email"],
              ["phone", "Phone"],
              ["whatsapp", "WhatsApp number with country code (optional)"],
              ["instagramUrl", "Instagram profile URL"],
              ["facebookUrl", "Facebook page URL"],
              ["youtubeUrl", "YouTube channel URL"],
              ["linkedinUrl", "LinkedIn profile URL"],
              ["address", "Business address"],
              ["shippingPaise", "Flat shipping fee (?)"],
            ],
          ],
          [
            "Search & sharing",
            [
              ["seoTitle", "SEO title"],
              ["seoDescription", "SEO description"],
              ["socialImage", "Social sharing image URL"],
            ],
          ],
        ].map(([title, fields]) => (
          <section className="settings-card" key={title}>
            <h2>{title}</h2>
            <p>Publish only confirmed business information.</p>
            {fields.map(([k, l]) => (
              k === "socialImage" ? null :
              <label key={k}>
                {l}
                <input
                  type={
                    k === "shippingPaise"
                      ? "number"
                      : k === "email"
                        ? "email"
                        : "text"
                  }
                  min="0"
                  step=".01"
                  value={form[k] ?? ""}
                  placeholder={
                    k === "brand" ? "e.g. Dr. Yogitha’s" :
                    k === "description" ? "Describe your brand and products" :
                    k === "email" ? "e.g. support@example.com" :
                    k === "phone" || k === "whatsapp" ? "e.g. +91 98765 43210" :
                    k.endsWith("Url") ? "https://example.com/your-profile" :
                    k === "address" ? "Enter your business address" :
                    k === "shippingPaise" ? "e.g. 50, or 0 for free shipping" :
                    k === "seoTitle" ? "Enter the search result title" :
                    k === "seoDescription" ? "Enter a short search result description" : undefined
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [k]:
                        k === "shippingPaise"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              </label>
            ))}
            {title === "Search & sharing" && (
              <>
                <div className="settings-social-image">
                  <label htmlFor="settings-social-image">Social sharing image</label>
                  {form.socialImage && (
                    <img
                      className="product-image-preview"
                      src={imageUrl(form.socialImage)}
                      alt="Social sharing image preview"
                    />
                  )}
                  <input
                    id="settings-social-image"
                    type="file"
                    className="social-image-file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingSocialImage || busy}
                    onChange={async (e) => {
                      const input = e.currentTarget;
                      const file = input.files?.[0];
                      if (!file) return;
                      setSocialImageFileName(file.name);
                      setUploadingSocialImage(true);
                      try {
                        const url = await uploadImage(file);
                        setForm((current) => ({ ...current, socialImage: url }));
                      } catch (error) {
                        toast.error(error.message);
                      } finally {
                        setUploadingSocialImage(false);
                        input.value = "";
                      }
                    }}
                  />
                  <label className="social-image-picker" htmlFor="settings-social-image">
                    <span>{uploadingSocialImage ? "Uploading image…" : "Choose image"}</span>
                    {socialImageFileName && <small>{socialImageFileName}</small>}
                  </label>
                  <label htmlFor="settings-social-image-url">Or enter an image URL</label>
                  <input
                    id="settings-social-image-url"
                    type="text"
                    placeholder="https://example.com/social-image.jpg"
                    value={form.socialImage ?? ""}
                    onChange={(e) => setForm({ ...form, socialImage: e.target.value })}
                  />
                </div>
                <div className="search-preview">
                  <small>SEARCH APPEARANCE</small>
                  <strong>{form.seoTitle}</strong>
                  <p>{form.seoDescription}</p>
                </div>
                <div className="detail-box">
                  <h3>Server configuration</h3>
                  <p>
                    SMTP, Shiprocket and COD enablement are configured in{" "}
                    <code>server/.env</code>. Secrets stay on the server.
                  </p>
                  <p>
                    Brand colors and Jost are centralised in{" "}
                    <code>src/shared/theme.css</code>.
                  </p>
                </div>
              </>
            )}
          </section>
        ))}
        <button className="btn" disabled={busy || uploadingSocialImage}>
          {busy ? "Saving…" : "Save settings"}
          <Check size={16} />
        </button>
      </form>
    </>
  );
}
function AdminLogin({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <div className="admin-login">
      <div className="login-art">
        <div className="login-brand">
          <Leaf size={34} aria-hidden="true" />
          <div><h1>Dr. Yogitha’s</h1><p>Ayurvedic herbal care.</p></div>
        </div>
        <img src={imageUrl("/admin-login-nature.png")} alt="Dr. Yogitha’s Ayurvedic hair oil surrounded by herbs and flowers" />
      </div>
      <form
        className="cms-form login-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await api("/auth/login", {
              method: "POST",
              body: Object.fromEntries(new FormData(e.currentTarget)),
            });
            if (!["owner", "manager", "editor"].includes(r.user.role))
              throw new Error("This account does not have CMS access.");
            onLogin(r.user);
          } catch (x) {
            toast.error(x.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="overline">DR. YOGITHA’S · PRIVATE STUDIO</p>
        <h2>Welcome back.</h2>
        <p>Sign in to care for your store.</p>
        <label>
          Email
          <span className="login-input">
            <Mail size={18} aria-hidden="true" />
            <input name="email" type="email" placeholder="you@example.com" autoComplete="username" required />
          </span>
        </label>
        <label>
          Password
          <span className="login-input">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            minLength="10"
          />
          <button type="button" className="login-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          </span>
        </label>
        <button className="btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} />
        </button>
        <div className="login-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/">? Back to storefront</Link>
        </div>
      </form>
    </div>
  );
}
