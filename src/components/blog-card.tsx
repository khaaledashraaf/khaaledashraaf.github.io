import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-1 py-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <time className="shrink-0 font-mono text-xs text-muted-foreground">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>
      {post.description && (
        <p className="text-sm text-muted-foreground">{post.description}</p>
      )}
    </Link>
  );
}
