"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

interface MemoImagesPickerProps {
  values: string[];
  onChange: (images: string[]) => void;
  onError?: (message: string) => void;
}

/** 일반 메모 다중 사진 첨부 */
export default function MemoImagesPicker({
  values,
  onChange,
  onError,
}: MemoImagesPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const next = [...values];

    const readNext = (index: number) => {
      if (index >= files.length) {
        onChange(next);
        return;
      }

      const file = files[index];
      if (!file.type.startsWith("image/")) {
        onError?.("이미지 파일만 선택할 수 있습니다.");
        readNext(index + 1);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        onError?.("이미지는 2MB 이하만 사용할 수 있습니다.");
        readNext(index + 1);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          next.push(reader.result);
        }
        readNext(index + 1);
      };
      reader.readAsDataURL(file);
    };

    readNext(0);
  };

  return (
    <div className="space-y-2">
      <Text variant="label" as="span">
        사진{" "}
        <Text variant="muted" as="span">
          (선택, 여러 장)
        </Text>
      </Text>

      <div className="flex flex-wrap gap-2">
        {values.map((url, index) => (
          <div
            key={`${index}-${url.slice(0, 24)}`}
            className="relative h-20 w-20 overflow-hidden rounded-xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 h-6 w-6 p-0"
              aria-label="사진 제거"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-background text-[11px] text-muted transition-colors hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          추가
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
