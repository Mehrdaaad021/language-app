import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  hoverable?: boolean;
}

export default function Card({ children, className = "", strong = false, hoverable = false }: CardProps) {
  const baseClass = strong ? "glass-strong" : "glass";
  const hoverClass = hoverable ? "glass-hover" : "";
  
  return (
    <div 
      className={`rounded-[var(--radius-glass)] p-5 ${baseClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}