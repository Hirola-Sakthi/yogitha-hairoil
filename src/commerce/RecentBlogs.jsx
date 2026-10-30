import { Link } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import { useStore } from "./StoreContext";
import { date } from "../shared/api";
import { imageUrl } from "../shared/imageUrl";
import "./journal.css";

export default function RecentBlogs() {
  const { data } = useStore();
  const posts = [...(data?.posts || [])]
    .sort((a, b) => (Date.parse(b.publishedAt || b.createdAt) || 0) - (Date.parse(a.publishedAt || a.createdAt) || 0))
    .slice(0, 3);
  if (!posts.length) return null;

  return (
    <section className="home-recent-blogs" aria-labelledby="recent-blogs-title">
      <div className="home-blog-heading">
        <div><p className="eyebrow">FROM THE JOURNAL</p><h2 id="recent-blogs-title">Recent blogs</h2></div>
        <Link className="journal-read" to="/blog">View all stories <ArrowRight size={18} /></Link>
      </div>
      <div className="journal-story-grid">
        {posts.map(post => {
          const category = data.categories?.find(c => c.id === post.categoryId || post.categoryIds?.includes(c.id));
          const published = post.publishedAt || post.createdAt;
          return (
            <article className="journal-story" key={post.id}>
              <Link to={"/blog/" + post.slug}>
                <div className="journal-image">
                  {post.image ? <img src={imageUrl(post.image)} alt={post.title} loading="lazy" /> :
                    <div className="journal-image-placeholder"><Leaf size={48} strokeWidth={1} /><span>Dr. Yogitha’s Journal</span></div>}
                </div>
                <div className="journal-meta"><span>{category?.name || "The journal"}</span>{published && <time dateTime={published}>{date(published)}</time>}</div>
                <h3>{post.title}</h3>
                <p className="journal-excerpt">{post.excerpt}</p>
                <span className="journal-read">Read the story <ArrowRight size={16} /></span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
