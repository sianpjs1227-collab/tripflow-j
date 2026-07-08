"use client";

interface CreateTripButtonProps {
  onClick: () => void;
}

/**
 * CreateTripButton — 새 여행 만들기 버튼
 * 클릭 시 상위에서 전달받은 onClick으로 모달을 엽니다.
 */
export default function CreateTripButton({ onClick }: CreateTripButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group relative w-full overflow-hidden rounded-2xl
        bg-gradient-to-b from-[#3d9fff] to-[#0A84FF]
        px-6 py-[18px] text-lg font-semibold text-white
        shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_16px_rgba(10,132,255,0.35),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-300 ease-out
        hover:from-[#4aa8ff] hover:to-[#1a8fff]
        hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_8px_24px_rgba(10,132,255,0.45),0_4px_8px_rgba(0,0,0,0.1)]
        active:scale-[0.98]
        active:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_8px_rgba(10,132,255,0.3)]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#0A84FF]/50 focus-visible:ring-offset-2
        focus-visible:ring-offset-white
        animate-fade-in-up animation-delay-100
      "
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
      />

      <span className="relative flex items-center justify-center gap-2">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        새 여행 만들기
      </span>
    </button>
  );
}
