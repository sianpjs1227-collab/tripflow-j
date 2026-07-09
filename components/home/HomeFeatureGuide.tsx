"use client";

import { Card, Text } from "@/components/ui";

const FEATURES = [
  { icon: "🗓", label: "일정 관리" },
  { icon: "📍", label: "장소 저장" },
  { icon: "💰", label: "지출 관리" },
  { icon: "✅", label: "체크리스트" },
  { icon: "🗺", label: "Google My Maps 연동" },
] as const;

/** TripFlow J 기능 안내 */
export default function HomeFeatureGuide() {
  return (
    <section
      className="animate-fade-in-up animation-delay-200"
      aria-labelledby="home-feature-guide-heading"
    >
      <Text
        variant="body-medium"
        as="h2"
        id="home-feature-guide-heading"
        className="mb-4 text-lg font-semibold"
      >
        TripFlow J로 할 수 있는 것
      </Text>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.label}
            padding="sm"
            className="flex items-center gap-3 bg-card"
          >
            <span className="text-2xl" aria-hidden>
              {feature.icon}
            </span>
            <Text variant="body-medium" className="font-medium">
              {feature.label}
            </Text>
          </Card>
        ))}
      </div>
    </section>
  );
}
