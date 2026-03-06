import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-4xl px-6 pb-8">
      <Separator className="mb-6" />
      <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>Khaled Ashraf</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/khaaledashraaf"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/khaledaelmaleh/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
