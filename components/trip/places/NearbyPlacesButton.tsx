"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import {
  getCurrentPosition,
  LOCATION_DENIED_MESSAGE,
  type GeoPosition,
} from "@/lib/directions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

interface NearbyPlacesButtonProps {
  onOpen: (position: GeoPosition) => void;
  className?: string;
}

/** 내 주변 진입 버튼 */
export default function NearbyPlacesButton({
  onOpen,
  className,
}: NearbyPlacesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const position = await getCurrentPosition();
      onOpen(position);
    } catch {
      window.alert(LOCATION_DENIED_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        void handleClick();
      }}
      disabled={isLoading}
      className={cn("h-8 text-[11px]", className)}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {isLoading ? "위치 확인 중…" : "내 주변"}
    </Button>
  );
}
