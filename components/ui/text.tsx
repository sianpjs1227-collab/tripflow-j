import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextVariant =
  | "title"
  | "title-sm"
  | "body"
  | "body-medium"
  | "muted"
  | "caption"
  | "label";

const variantStyles: Record<TextVariant, string> = {
  title: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
  "title-sm": "text-lg font-semibold text-foreground",
  body: "text-sm text-foreground",
  "body-medium": "text-sm font-medium text-foreground",
  muted: "text-sm text-muted",
  caption: "text-[11px] text-muted",
  label: "text-sm font-medium text-foreground",
};

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "label" | "dt" | "dd";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: TextElement;
}

/** TripFlow J — 제목 / 본문 / 보조텍스트 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ className, variant = "body", as: Component = "p", ...props }, ref) => {
    return (
      <Component
        ref={ref as never}
        className={cn(variantStyles[variant], className)}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
