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
    [mobile, setMobile] = useState(false);
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
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      mutate("/admin/" + module + "/" + encodeURIComponent(record.id), "DELETE");
    }
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
              <Link to="/">View website ↗</Link>
            </div>
          )}
          {recordId ? (selected && def ? (
          <section
            className="cms-record-page"
            aria-labelledby="record-title"
          >
            <div className={`record-heading${module === "policies" ? " policy-record-heading" : ""}`}>
              <div>
                {!(["products", "policies", "payments", "orders", "leads", "reviews"].includes(module)) && (
                  <p className="overline">{def.title}</p>
                )}
                <h1 id="record-title">
                  {module === "posts" ? (selected.id ? "Edit post" : "New post") : module === "policies" ? "Edit policy" : selected.id ? "Record details" : "Create new"}
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
                      placeholder={"Search " + def.title.toLowerCase() + "…"}
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
          <p>Welcome back. Here’s what’s happening with your store.</p>
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
            <Link to="/admin/orders">View all →</Link>
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
  return ["posts", "policies"].includes(props.module) ? <ContentForm {...props} /> : <GenericRecordForm {...props} />;
}
function GenericRecordForm({ module, fields, item, busy, onSave, onDelete }) {
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
      {module === "reviews" && (
        <div className="detail-box">
          <strong>
            {item.name} | {item.rating}/5
          </strong>
          <p>{item.content}</p>
        </div>
      )}
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
                <textarea {...props} rows={k === "content" ? 12 : 3} />
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
        {onDelete && (
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
              ["shippingPaise", "Flat shipping fee (₹)"],
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
          <Link to="/">← Back to storefront</Link>
        </div>
      </form>
    </div>
  );
}
