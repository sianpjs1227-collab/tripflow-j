"use client";

import { getCountryByCode } from "@/data/countries";
import { Card, CountryFlag, Text } from "@/components/ui";

export interface PopularDestination {
  name: string;
  code: string;
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  { name: "일본", code: "JP" },
  { name: "대만", code: "TW" },
  { name: "태국", code: "TH" },
  { name: "베트남", code: "VN" },
];

interface HomePopularDestinationsProps {
  onSelectCountry: (countryCode: string) => void;
}

/** 인기 여행지 — 국가 선택 시 새 여행 만들기 */
export default function HomePopularDestinations({
  onSelectCountry,
}: HomePopularDestinationsProps) {
  return (
    <section
      className="animate-fade-in-up animation-delay-300"
      aria-labelledby="popular-destinations-heading"
    >
      <Text
        variant="body-medium"
        as="h2"
        id="popular-destinations-heading"
        className="mb-4 text-lg font-semibold"
      >
        인기 여행지
      </Text>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {POPULAR_DESTINATIONS.map((destination) => {
          const country = getCountryByCode(destination.code);

          return (
            <button
              key={destination.code}
              type="button"
              onClick={() => onSelectCountry(destination.code)}
              className="text-left"
            >
              <Card
                padding="sm"
                className="h-full transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CountryFlag
                  code={destination.code}
                  className="text-3xl"
                  label={destination.name}
                />
                <Text variant="body-medium" className="mt-2 font-semibold">
                  {destination.name}
                </Text>
                {country && (
                  <Text variant="caption" className="mt-0.5 text-muted">
                    {country.currencyCode}
                  </Text>
                )}
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
