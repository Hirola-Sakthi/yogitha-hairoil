import { useState } from "react";
import toast from "react-hot-toast";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import DOMPurify from "dompurify";
import { uploadImage } from "./media";

export function editorHtml(content, format) {
  if (format === "html") return DOMPurify.sanitize(content || "");
  return (content || "").split(/\n\n+/).map(p => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("");
}

export default function RichTextEditor({ value, onChange, onBusyChange, placeholder }) {
  const [source, setSource] = useState(false), [panel, setPanel] = useState(""), [url, setUrl] = useState(""), [alt, setAlt] = useState("");
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image],
    content: value,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { "aria-label": "Body", role: "textbox", "aria-multiline": "true", "data-placeholder": placeholder || "Write your content here…" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  if (!editor) return <p>Opening editor…</p>;
  const control = (label, text, action, active, disabled = false) => <button type="button" title={label} aria-label={label} aria-pressed={!!active} disabled={disabled || source} onMouseDown={e => e.preventDefault()} onClick={action}>{text}</button>;
  return <div className="rich-editor">
    <div className="rich-toolbar" role="toolbar" aria-label="Body formatting">
      {control("Paragraph", "¶", () => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph"))}
      {[2, 3].map(level => <span key={level}>{control(`Heading ${level}`, `H${level}`, () => editor.chain().focus().toggleHeading({ level }).run(), editor.isActive("heading", { level }))}</span>)}
      {control("Bold", <b>B</b>, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {control("Italic", <i>I</i>, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {control("Underline", <u>U</u>, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      {control("Bullet list", "• ≡", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {control("Numbered list", "1. ≡", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {control("Quote", "❞", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {control("Divider", "—", () => editor.chain().focus().setHorizontalRule().run())}
      {control("Add link", "Link", () => { setPanel("link"); setUrl(editor.getAttributes("link").href || ""); }, editor.isActive("link"))}
      {control("Remove link", "Unlink", () => editor.chain().focus().unsetLink().run(), false, !editor.isActive("link"))}
      {control("Insert image", "Image", () => { setPanel("image"); setUrl(""); })}
      {control("Undo", "↶", () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
      {control("Redo", "↷", () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
      <button type="button" aria-label="Edit HTML source" aria-pressed={source} onClick={() => {
        if (source) { const html = DOMPurify.sanitize(value); editor.commands.setContent(html); onChange(editor.getHTML()); }
        setSource(!source); setPanel("");
      }}>&lt;/&gt;</button>
    </div>
    {panel && <div className="rich-insert" onKeyDown={e => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); e.currentTarget.querySelector("button")?.click(); } }}>
      <label>{panel === "link" ? "Link URL" : "Image URL"}<input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></label>
      {panel === "image" && <label>Image description<input value={alt} placeholder="Describe the image for accessibility" onChange={e => setAlt(e.target.value)} /></label>}
      <button type="button" className="btn secondary" onClick={() => {
        if (!/^(https?:\/\/|mailto:|\/(?!\/))/.test(url) || (panel === "image" && url.startsWith("mailto:"))) { toast.error("Use a website URL or a local /path."); return; }
        if (panel === "link") editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        else editor.chain().focus().setImage({ src: url, alt }).run();
        setPanel("");
      }}>Insert</button>
      {panel === "image" && <label className="rich-upload">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        onBusyChange(true);
        try { const src = await uploadImage(file); editor.chain().focus().setImage({ src, alt }).run(); setPanel(""); }
        catch (err) { toast.error(err.message); } finally { onBusyChange(false); }
      }} /></label>}
      <button type="button" className="text-button" onClick={() => setPanel("")}>Cancel</button>
    </div>}
    {source && <textarea className="rich-source" aria-label="Body HTML source" placeholder="Paste or edit the article HTML" value={value} onChange={e => onChange(e.target.value)} />}
    <div hidden={source}><EditorContent editor={editor} /></div>
  </div>;
}
