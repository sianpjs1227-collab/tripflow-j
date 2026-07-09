"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  filterCities,
  getCitiesByCountryCode,
} from "@/data/cities";
import { Input, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

interface CityAutocompleteProps {
  countryCode: string;
  value: string;
  onChange: (city: string) => void;
  /** 국가 선택 직후 검색창 포커스 */
  autoFocus?: boolean;
  onAutoFocusComplete?: () => void;
}

/** 검색 가능한 도시 선택 (Autocomplete) */
export default function CityAutocomplete({
  countryCode,
  value,
  onChange,
  autoFocus = false,
  onAutoFocusComplete,
}: CityAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const cities = useMemo(
    () => getCitiesByCountryCode(countryCode),
    [countryCode],
  );

  const filteredCities = useMemo(
    () => filterCities(cities, query),
    [cities, query],
  );

  const trimmedQuery = query.trim();
  const showCustomAdd =
    trimmedQuery.length > 0 && filteredCities.length === 0;

  const isDisabled = !countryCode;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!countryCode) {
      setQuery("");
      setIsOpen(false);
    }
  }, [countryCode]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery(value);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, value]);

  useEffect(() => {
    if (autoFocus && countryCode) {
      setIsOpen(true);
      inputRef.current?.focus();
      onAutoFocusComplete?.();
    }
  }, [autoFocus, countryCode, onAutoFocusComplete]);

  const handleSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    setIsOpen(true);
    if (!next.trim()) {
      onChange("");
    }
  };

  const handleFocus = () => {
    if (!isDisabled) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        disabled={isDisabled}
        placeholder={
          isDisabled ? "먼저 국가를 선택하세요" : "도시 검색..."
        }
        autoComplete="off"
        className="disabled:bg-background disabled:text-muted"
      />

      {isOpen && !isDisabled && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
          role="listbox"
        >
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <li key={city} role="option">
                <button
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-background",
                    value === city
                      ? "font-semibold text-primary"
                      : "text-foreground",
                  )}
                >
                  {city}
                </button>
              </li>
            ))
          ) : !showCustomAdd ? (
            <li className="px-4 py-3">
              <Text variant="muted">검색 결과가 없습니다.</Text>
            </li>
          ) : null}

          {showCustomAdd && (
            <li role="option" className="border-t border-border">
              <button
                type="button"
                onClick={() => handleSelect(trimmedQuery)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-primary hover:bg-primary/5"
              >
                + &quot;{trimmedQuery}&quot; 추가
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
