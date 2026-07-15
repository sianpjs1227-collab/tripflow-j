import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const inputClassName =
  // text-sm(14px) — iOS 자동 확대는 globals.css @supports(-webkit-touch-callout)에서 16px로 보정
  "h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

/** TripFlow J — 통일 높이 입력창 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputClassName, className)}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
