import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work by Khaled Ashraf.",
};

export default function ProjectsPage() {
  return (
    <div className="flex min-h-[calc(100vh-15rem)] flex-col items-center justify-center gap-6">
      <p className="text-muted-foreground">No projects for now. Just chilling.</p>
    </div>
  );
}
