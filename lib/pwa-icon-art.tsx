/** 임시 PWA 아이콘 — 나중에 public/icons PNG 로 교체 가능 */

export type PwaIconVariant = "default" | "maskable";

type PwaIconArtProps = {
  size: number;
  variant?: PwaIconVariant;
};

export function PwaIconArt({ size, variant = "default" }: PwaIconArtProps) {
  const isMaskable = variant === "maskable";
  const fontSize = Math.round(size * (isMaskable ? 0.34 : 0.43));
  const borderRadius = isMaskable ? 0 : Math.round(size * 0.22);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)",
        borderRadius,
        color: "white",
        fontSize,
        fontWeight: 700,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "-0.04em",
      }}
    >
      J
    </div>
  );
}
