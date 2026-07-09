"use client";

import { getHomeGreeting } from "@/lib/trip-home-utils";
import { Text } from "@/components/ui";

/** 홈 상단 인사말 */
export default function HomeGreeting() {
  const greeting = getHomeGreeting();

  return (
    <header className="animate-fade-in-up">
      <Text variant="caption" className="font-medium uppercase tracking-wide text-primary">
        TripFlow J
      </Text>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {greeting}
      </h1>
    </header>
  );
}
