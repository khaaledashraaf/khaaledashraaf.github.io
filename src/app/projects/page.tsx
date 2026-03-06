import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work by Khaled Ashraf.",
};

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
      <p className="text-muted-foreground">
        Coming soon — selected projects and case studies.
      </p>
    </div>
  );
}
