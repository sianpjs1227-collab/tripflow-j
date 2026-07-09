"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;

interface TripCoverPickerProps {
  value?: string;
  onChange: (coverImage: string) => void;
  onError?: (message: string) => void;
}

/** 여행 커버 이미지 선택 (선택) */
export default function TripCoverPicker({
  value = "",
  onChange,
  onError,
}: TripCoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("이미지 파일만 선택할 수 있습니다.");
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      onError?.("이미지는 2MB 이하만 사용할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Text variant="label" as="span">
        커버 이미지{" "}
        <Text variant="muted" as="span">(선택)</Text>
      </Text>

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="커버 미리보기"
            className="aspect-[16/10] w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              변경
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange("")}
              aria-label="커버 이미지 제거"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-8 transition-colors hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <ImagePlus className="h-6 w-6 text-muted" aria-hidden />
          <Text variant="body-medium" className="font-medium text-foreground">
            사진 추가
          </Text>
          <Text variant="caption">없으면 국가 커버가 표시됩니다</Text>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
