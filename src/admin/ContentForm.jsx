import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../shared/api";
import RichTextEditor, { editorHtml } from "./RichTextEditor";
import { uploadImage } from "./media";
import { imageUrl } from "../shared/imageUrl";
import "./content-editor.css";

const localDate = value => {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function ContentForm({ module, item, busy, onSave, onDelete }) {
  const post = module === "posts";
  const [tab, setTab] = useState("content"), [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]), [posts, setPosts] = useState([]);
  const [tag, setTag] = useState("");
  const [slugEdited, setSlugEdited] = useState(!!item.id || !!item.slug);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", status: "draft", author: "", image: "", featured: false, tags: [], relatedPostIds: [], seoTitle: "", seoDescription: "", ...item,
    categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []),
    publishedAt: localDate(item.publishedAt), content: editorHtml(item.content, item.contentFormat), contentFormat: "html" });
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  useEffect(() => {
    if (!post) return;
    let live = true;
    Promise.all([api("/admin/categories"), api("/admin/posts")]).then(([c, p]) => { if (live) { setCategories(c); setPosts(p); } }).catch(e => { if (live) toast.error(e.message); });
    return () => { live = false; };
  }, [post]);
  const fieldPlaceholders = {
    author: "e.g. Dr. Yogitha",
    seoTitle: "Enter the search result title",
    publishedAt: "Choose a date and time",
    image: "https://example.com/image.jpg",
  };
  const field = (key, label, type = "text") => <label>{label}<input type={type} value={form[key] || ""} placeholder={fieldPlaceholders[key] || `Enter ${label.toLowerCase()}`} onChange={e => update(key, e.target.value)} /></label>;
  const addTag = () => {
    const next = tag.trim();
    if (next && !form.tags.includes(next) && form.tags.length < 20) update("tags", [...form.tags, next.slice(0, 100)]);
    setTag("");
  };
  return <form className="content-composer" onSubmit={e => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) { setTab("content"); toast.error("Title and slug are required."); return; }
    onSave({ ...form, tags: [...new Set([...form.tags, ...(tag.trim() ? [tag.trim().slice(0, 100)] : [])])].slice(0, 20), publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "" });
  }}>
    <div className="composer-actions"><p>{post ? "Shape your next story." : "Clear information for your customers."}</p><Link className="btn secondary" to={`/admin/${module}`}>Cancel</Link><button className="btn" disabled={busy || uploading}>{uploading ? "Uploading…" : busy ? "Saving…" : item.id ? "Save changes" : "Create post"}</button></div>
    <div className="composer-tabs" aria-label="Editor sections">{[["content", "Content"], ...(post ? [["author", "Author & related"]] : []), ["seo", "SEO"]].map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="composer-layout"><div className="composer-main">
      <div hidden={tab !== "content"}>
        <section className="composer-card composer-fields">
          <label>Title *<input value={form.title} placeholder={post ? "e.g. A mindful hair care ritual" : "Enter the policy title"} maxLength={500} onChange={e => { const title = e.target.value; setForm(f => ({ ...f, title, ...(!slugEdited ? { slug: title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}) })); }} /></label>
          <label>Slug *<div className="slug-input"><span>/{post ? "blog" : "policies"}/</span><input value={form.slug} placeholder="e.g. mindful-hair-care-ritual" onChange={e => { setSlugEdited(true); update("slug", e.target.value); }} /></div><small>Generated from the title until you edit it.</small></label>
          {post && <label>Excerpt<textarea rows={3} maxLength={600} value={form.excerpt} placeholder="Write a short summary for the blog listing" onChange={e => update("excerpt", e.target.value)} /><small>{form.excerpt.length} / 600</small></label>}
        </section>
      <section className="composer-card"><h2>Body</h2><RichTextEditor value={form.content} placeholder={post ? "Write your blog post here…" : "Write the policy information for customers…"} onChange={value => update("content", value)} onBusyChange={setUploading} /></section>
      </div>
      {post && <section className="composer-card composer-fields" hidden={tab !== "author"}><h2>Author & related stories</h2>{field("author", "Author name")}
        <fieldset><legend>Related posts</legend>{posts.filter(p => p.id !== item.id).map(p => <label className="composer-check" key={p.id}><input type="checkbox" checked={form.relatedPostIds.includes(p.id)} onChange={e => update("relatedPostIds", e.target.checked ? [...form.relatedPostIds, p.id] : form.relatedPostIds.filter(id => id !== p.id))} />{p.title}</label>)}{posts.filter(p => p.id !== item.id).length === 0 && <small>No other posts yet.</small>}</fieldset>
      </section>}
      <section className="composer-card composer-fields" hidden={tab !== "seo"}><h2>Search appearance</h2>{field("seoTitle", "SEO title")}<label>SEO description<textarea rows={4} maxLength={500} value={form.seoDescription} placeholder="Write a concise description for search results" onChange={e => update("seoDescription", e.target.value)} /></label><small>Leave blank to use the page title and excerpt.</small></section>
    </div><aside className="composer-sidebar">
      <section className="composer-card"><h2>Publishing</h2><div className="composer-fields"><label>Status<select value={form.status} onChange={e => update("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
        {field("publishedAt", "Publish date", "datetime-local")}<small>Local time. Leave empty to use the time of publishing. A future date keeps published content hidden until that time.</small>
        {post && <label className="composer-check"><input type="checkbox" checked={form.featured} onChange={e => update("featured", e.target.checked)} />Featured post</label>}
      </div></section>
      {post && <><section className="composer-card"><h2>Taxonomy</h2><div className="composer-fields"><fieldset><legend>Categories</legend>{categories.map(c => <label className="composer-check" key={c.id}><input type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={e => update("categoryIds", e.target.checked ? [...form.categoryIds, c.id] : form.categoryIds.filter(id => id !== c.id))} />{c.name}</label>)}{!categories.length && <small>Create categories in Blog categories.</small>}</fieldset>
        <label>Tags<input value={tag} placeholder="Type and press Enter" onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} onBlur={addTag} /></label>
        <div className="composer-tags">{form.tags.map(t => <button type="button" key={t} onClick={() => update("tags", form.tags.filter(x => x !== t))} aria-label={`Remove tag ${t}`}>{t} ×</button>)}</div>
      </div></section>
      <section className="composer-card"><h2>Featured image</h2><div className="composer-fields">{form.image ? <img className="composer-image" src={imageUrl(form.image)} alt="Featured image preview" /> : <div className="composer-image-empty">No image selected</div>}
        <label>Choose image<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { update("image", await uploadImage(file)); } catch (err) { toast.error(err.message); } finally { setUploading(false); e.target.value = ""; } }} /></label>
        {field("image", "Or image URL")}<small>JPG, PNG or WebP, up to 5 MB. Recommended 1600 × 900.</small>{form.image && <button type="button" className="text-button" onClick={() => update("image", "")}>Remove image</button>}
      </div></section></>}
    </aside></div>
    {onDelete && <div className="composer-delete"><button type="button" className="text-button danger" disabled={busy} onClick={onDelete}>Delete post</button></div>}
  </form>;
}
