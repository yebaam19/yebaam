import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className = "", hover = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-brand-border bg-white shadow-card ${hover ? "transition duration-200 hover:shadow-hover hover:-translate-y-0.5 cursor-pointer" : ""} ${className}`}
      {...props}
    />
  );
}
