"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const TRAILING_PUNCTUATION = /[),.!?;:]+$/;

function splitUrlToken(token: string): { href: string; trailing: string } {
  const punct = token.match(TRAILING_PUNCTUATION);
  if (!punct) return { href: token, trailing: "" };
  return {
    href: token.slice(0, -punct[0].length),
    trailing: punct[0],
  };
}

/**
 * http(s) URL을 클릭 가능한 링크로 렌더링 (저장 데이터는 변경하지 않음)
 */
export default function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);

  while ((match = pattern.exec(text)) != null) {
    const start = match.index;
    const raw = match[0];
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const { href, trailing } = splitUrlToken(raw);
    if (href) {
      nodes.push(
        <a
          key={`url-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary underline underline-offset-2"
          onClick={(event) => event.stopPropagation()}
        >
          {href}
        </a>,
      );
    }
    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {nodes.map((node, index) => (
        <Fragment key={index}>{node}</Fragment>
      ))}
    </span>
  );
}
