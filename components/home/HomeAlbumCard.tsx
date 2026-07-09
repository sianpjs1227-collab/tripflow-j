"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Images } from "lucide-react";
import { Card, Text } from "@/components/ui";

interface HomeAlbumCardProps {
  completedCount: number;
}

/** Home 하단 — 여행 앨범 진입 카드 */
export default function HomeAlbumCard({ completedCount }: HomeAlbumCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/album")}
      className="group w-full text-left"
    >
      <Card
        padding="md"
        className="flex items-center justify-between gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Images className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <Text variant="body-medium" className="text-base font-semibold">
              여행 앨범
            </Text>
            <Text variant="muted" className="mt-1 line-clamp-2 text-sm">
              {completedCount > 0
                ? `완료한 여행 ${completedCount}개를 확인하세요`
                : "완료한 여행이 여기에 모입니다"}
            </Text>
          </div>
        </div>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Card>
    </button>
  );
}
