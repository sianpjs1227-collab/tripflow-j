"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface PlaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** 장소 탭 실시간 검색창 */
export default function PlaceSearchBar({
  value,
  onChange,
}: PlaceSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.blur();
  };

  return (
    <label className="block">
      <span className="sr-only">장소 검색</span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="장소 검색..."
          enterKeyHint="search"
          className="pl-10 pr-10"
        />
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </label>
  );
}
