"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface CreateTripButtonProps {
  onClick: () => void;
}

/** 새 여행 만들기 버튼 */
export default function CreateTripButton({ onClick }: CreateTripButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="lg"
      className="w-full animate-fade-in-up animation-delay-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    >
      <Plus className="h-5 w-5" aria-hidden />
      새 여행 만들기
    </Button>
  );
}
