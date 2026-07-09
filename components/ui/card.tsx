import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardPadding = "none" | "sm" | "md" | "lg";

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-3.5",
  md: "p-4",
  lg: "p-5",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

/** TripFlow J — rounded-2xl, shadow-sm, border */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "none", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200",
          paddingStyles[padding],
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
