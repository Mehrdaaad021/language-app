import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}