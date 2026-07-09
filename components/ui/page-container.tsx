import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** max-width 1200px 가운데 정렬 */
  constrained?: boolean;
}

/** TripFlow J — 좌우 16~20px 여백, 최대폭 1200px */
export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, constrained = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-4 sm:px-5",
          constrained && "mx-auto w-full max-w-[1200px]",
          className,
        )}
        {...props}
      />
    );
  },
);

PageContainer.displayName = "PageContainer";
