import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts on design, engineering, and the space in between.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">
          Thoughts on design, engineering, and the space in between.
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="flex flex-col">
          {posts.map((post, i) => (
            <div key={post.slug}>
              <BlogCard post={post} />
              {i < posts.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
