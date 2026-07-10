"use client";

import type { LucideIcon } from "lucide-react";
import {
  Map,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Button, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type TripSettingsMenuAction =
  | "share-trip"
  | "edit-trip"
  | "manage-mymaps"
  | "delete-trip";

export interface TripSettingsMenuItem {
  id: TripSettingsMenuAction;
  label: string;
  icon: LucideIcon;
  variant?: "default" | "danger";
  ownerOnly?: boolean;
}

const MENU_ITEMS: TripSettingsMenuItem[] = [
  {
    id: "share-trip",
    label: "여행 공유",
    icon: Share2,
    ownerOnly: true,
  },
  {
    id: "edit-trip",
    label: "여행 설정",
    icon: Pencil,
  },
  {
    id: "manage-mymaps",
    label: "Google My Maps",
    icon: Map,
  },
  {
    id: "delete-trip",
    label: "여행 삭제",
    icon: Trash2,
    variant: "danger",
  },
];

interface TripMoreMenuProps {
  isOpen: boolean;
  isOwner?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (action: TripSettingsMenuAction) => void;
}

/** 여행 설정 메뉴 — Owner만 공유 항목 표시 */
export default function TripMoreMenu({
  isOpen,
  isOwner = false,
  onOpen,
  onClose,
  onSelect,
}: TripMoreMenuProps) {
  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.ownerOnly || isOwner,
  );

  const handleSelect = (action: TripSettingsMenuAction) => {
    onClose();
    onSelect(action);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpen}
        className="h-10 w-10 p-0 text-muted"
        aria-label="여행 설정 메뉴"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </Button>

      {isOpen && (
        <OverlayLayer
          onClose={onClose}
          closeLabel="메뉴 닫기"
          sheet
          panelClassName="bg-card p-5 shadow-xl"
        >
          <div role="dialog" aria-labelledby="trip-settings-menu-title">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />

            <Text
              variant="title-sm"
              as="h2"
              id="trip-settings-menu-title"
              className="font-bold"
            >
              여행 설정
            </Text>

            <ul className="mt-4 space-y-1" role="menu">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isDanger = item.variant === "danger";

                return (
                  <li key={item.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-colors",
                        isDanger
                          ? "text-danger hover:bg-danger/5"
                          : "text-foreground hover:bg-background",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isDanger ? "text-danger" : "text-muted",
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="mt-3 w-full text-muted"
            >
              닫기
            </Button>
          </div>
        </OverlayLayer>
      )}
    </>
  );
}

/** 메뉴 항목 확장용 export */
export { MENU_ITEMS as tripSettingsMenuItems };
