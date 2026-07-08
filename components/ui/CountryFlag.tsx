import type { ReactNode } from "react";
import { getCountryFlag } from "@/data/countries";

interface CountryFlagProps {
  code: string;
  className?: string;
  label?: string;
}

/** Unicode 국기 이모지 — 이모지 전용 폰트로 렌더링 */
export default function CountryFlag({
  code,
  className = "",
  label,
}: CountryFlagProps): ReactNode {
  const flag = getCountryFlag(code);

  return (
    <span
      className={`country-flag inline-block leading-none ${className}`}
      role="img"
      aria-label={label}
    >
      {flag}
    </span>
  );
}
