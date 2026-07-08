"use client";

import { useState } from "react";
import type { Note } from "@/types/note";
import { formatNoteDate } from "@/lib/note-utils";

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
    <article className="rounded-xl border border-[#ebebeb] bg-white dark:border-white/10 dark:bg-white/[0.05]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#111111] dark:text-white">
            {note.title}
          </h3>
          {!isOpen && (
            <p className="mt-1 truncate text-sm text-[#6e6e73]">{preview}</p>
          )}
          <p className="mt-1 text-xs text-[#6e6e73]">
            {formatNoteDate(note.updatedAt)}
          </p>
        </div>
        <span className="shrink-0 pt-1 text-sm text-[#6e6e73]" aria-hidden>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[#ebebeb] px-4 py-3 dark:border-white/10">
          {note.content.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-[#111111] dark:text-white">
              {note.content}
            </p>
          ) : (
            <p className="text-sm text-[#6e6e73]">내용이 없습니다.</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="rounded-lg border border-[#ebebeb] px-3 py-2 text-sm text-[#111111] dark:border-white/20 dark:text-white"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm("이 메모를 삭제할까요?")) return;
                onDelete(note.id);
              }}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 dark:border-red-500/30"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
