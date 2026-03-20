import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work by Khaled Ashraf.",
};

export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Image
        className="grayscale contrast-150"
        src="/character-lying-on-grass.gif"
        alt="Coming soon"
        width={420}
        height={420}
        unoptimized
      />
      <p className="text-muted-foreground">No projects for now. Just chilling.</p>
    </div>
  );
}
