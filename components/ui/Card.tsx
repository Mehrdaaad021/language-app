import type { ReactNode } from "react";

export default function Card({
  hoverable,
  className = "",
  children,
}: {
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl bg-[var(--c-surface)] p-5 shadow-[0_10px_30px_-18px_rgba(74,36,48,0.35)] transition ${
        hoverable
          ? "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-18px_rgba(74,36,48,0.45)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}