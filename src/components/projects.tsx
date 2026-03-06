const projects = [
  {
    id: 1,
    title: "Project Title",
    description: "Brief description of what this project is about.",
  },
  {
    id: 2,
    title: "Project Title",
    description: "Brief description of what this project is about.",
  },
  {
    id: 3,
    title: "Project Title",
    description: "Brief description of what this project is about.",
  },
  {
    id: 4,
    title: "Project Title",
    description: "Brief description of what this project is about.",
  },
];

export function Projects() {
  return (
    <section className="w-full py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-0">
        <div className="w-full mx-auto items-center justify-center flex">
          <h2 className="mb-10 font-mono text-md font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <a
              key={project.id}
              href="#"
              className="group flex flex-col border border-border bg-background transition-colors hover:bg-muted/50"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted">
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="font-mono text-xs">Image</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 p-5">
                <h3 className="font-mono text-base font-semibold text-foreground group-hover:underline">
                  {project.title}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
