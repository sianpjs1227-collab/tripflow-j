"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Note } from "@/types/note";
import { formatNoteDate } from "@/lib/note-utils";
import { Button, Card, Text } from "@/components/ui";

interface MemoItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

/** 접기/펼치기 가능한 메모 항목 */
export default function MemoItem({ note, onEdit, onDelete }: MemoItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const preview =
    note.content.trim().length > 0
      ? note.content.trim().split("\n")[0]
      : "내용 없음";

  return (
    <Card padding="none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <Text variant="body-medium" as="h3" className="text-base font-semibold">
            {note.title}
          </Text>
          {!isOpen && (
            <Text variant="muted" className="mt-1 truncate">
              {preview}
            </Text>
          )}
          <Text variant="caption" className="mt-1">
            {formatNoteDate(note.updatedAt)}
          </Text>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 pt-1 text-muted" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 pt-1 text-muted" aria-hidden />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-3">
          {note.content.trim() ? (
            <Text variant="body" className="whitespace-pre-wrap">
              {note.content}
            </Text>
          ) : (
            <Text variant="muted">내용이 없습니다.</Text>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(note)}
            >
              수정
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!confirm("이 메모를 삭제할까요?")) return;
                onDelete(note.id);
              }}
              className="border-danger/30 text-danger"
            >
              삭제
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
