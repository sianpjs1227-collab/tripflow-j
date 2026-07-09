import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** TripFlow J — 필터·상태 Chip */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          active
            ? "bg-primary text-white shadow-sm"
            : "border border-border bg-card text-foreground hover:border-border/80 hover:bg-background",
          className,
        )}
        {...props}
      />
    );
  },
);

Chip.displayName = "Chip";
