/**
 * BrandHeader
 * ─────────────────────────────────────────
 * 홈 화면 최상단에 브랜드명과 짧은 소개 문구를 보여주는 영역입니다.
 * TripFlow는 진한 검정, J는 iOS 블루로 브랜드 아이덴티티를 강조합니다.
 */
export default function BrandHeader() {
  return (
    <header className="animate-fade-in-up">
      {/* 브랜드 로고 — 크고 굵게, J만 파란색 강조 */}
      <h1 className="text-[3.25rem] font-bold leading-none tracking-tight sm:text-6xl">
        <span className="text-[#111111] dark:text-[#f5f5f7]">TripFlow </span>
        <span className="text-[#0A84FF]">J</span>
      </h1>

      {/* 서브 카피 — 로고 아래 여백을 넉넉히 */}
      <p className="mt-6 text-lg font-medium leading-relaxed text-muted sm:text-xl">
        당신의 여행을 계획하세요
      </p>
    </header>
  );
}
