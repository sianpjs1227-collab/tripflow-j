import { Text } from "@/components/ui";

/** 홈 화면 최상단 브랜드 영역 */
export default function BrandHeader() {
  return (
    <header className="animate-fade-in-up">
      <h1 className="text-[3.25rem] font-bold leading-none tracking-tight sm:text-6xl">
        <span className="text-foreground">TripFlow </span>
        <span className="text-primary">J</span>
      </h1>

      <Text variant="body-medium" className="mt-6 text-lg leading-relaxed sm:text-xl">
        당신의 여행을 계획하세요
      </Text>
    </header>
  );
}
