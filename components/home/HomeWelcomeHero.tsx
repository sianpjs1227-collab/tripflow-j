"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getHomeGreeting } from "@/lib/trip-home-utils";
import {
  DEFAULT_EMPTY_HERO_COVER,
  pickRandomEmptyHeroCover,
} from "@/lib/home-empty-hero";
import { Button, Text } from "@/components/ui";

interface HomeWelcomeHeroProps {
  onCreateTrip: () => void;
}

/** 여행이 없을 때 — 랜덤 커버 Hero 카드 */
export default function HomeWelcomeHero({ onCreateTrip }: HomeWelcomeHeroProps) {
  const [coverSrc, setCoverSrc] = useState(DEFAULT_EMPTY_HERO_COVER);
  const greeting = getHomeGreeting();

  useEffect(() => {
    setCoverSrc(pickRandomEmptyHeroCover());
  }, []);

  return (
    <section
      className="animate-fade-in-up animation-delay-100"
      aria-label="새 여행 시작 Hero"
    >
      <article className="relative w-full overflow-hidden rounded-[1.75rem] shadow-lg">
        <div className="relative aspect-[4/5] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25" />

          <div className="relative flex h-full flex-col justify-end px-5 pb-5 pt-8 text-white sm:px-6 sm:pb-6 sm:pt-10">
            <div className="space-y-5">
              <div>
                <Text variant="caption" className="text-sm font-medium text-white/85">
                  TripFlow J
                </Text>
                <Text
                  variant="body-medium"
                  as="p"
                  className="mt-3 text-lg font-medium text-white/95 sm:text-xl"
                >
                  {greeting}
                </Text>
                <Text
                  variant="title-sm"
                  as="h2"
                  className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]"
                >
                  다음 여행은 어디인가요?
                </Text>
                <Text
                  variant="body"
                  className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-base"
                >
                  {"새로운 여행을 계획하고\n소중한 추억을 만들어보세요."}
                </Text>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={onCreateTrip}
                className="h-14 w-full rounded-2xl bg-white text-base font-semibold text-foreground shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:shadow-lg"
              >
                <Plus className="h-5 w-5" aria-hidden />
                새 여행 만들기
              </Button>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
