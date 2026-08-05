"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import type { ListMemoItem, ListNoteInput, Note } from "@/types/note";
import {
  generateListMemoItemId,
} from "@/lib/note-utils";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

interface DraftRow {
  key: string;
  id?: string;
  name: string;
  memo?: string;
  imageUrl?: string;
  checked: boolean;
}

interface ListMemoEditorProps {
  isOpen: boolean;
  editingNote?: Note | null;
  /** 자동 저장으로 확정된 메모 id (삭제 버튼 표시용) */
  persistedNoteId?: string | null;
  onClose: () => void;
  /** 항목/제목 변경 시마다 호출 (자동 저장) */
  onSave: (input: ListNoteInput) => void;
  onDelete?: (id: string) => void;
}

function toDraftRows(items: ListMemoItem[]): DraftRow[] {
  const rows = items.map((item) => ({
    key: item.id,
    id: item.id,
    name: item.name,
    memo: item.memo,
    imageUrl: item.imageUrl,
    checked: item.checked === true,
  }));
  return [...rows, emptyDraft()];
}

function emptyDraft(): DraftRow {
  return {
    key: `draft-${generateListMemoItemId()}`,
    name: "",
    checked: false,
  };
}

function draftsToItems(rows: DraftRow[]): ListMemoItem[] {
  return rows
    .filter((row) => row.name.trim().length > 0)
    .map((row) => ({
      id: row.id ?? generateListMemoItemId(),
      name: row.name.trim(),
      ...(row.memo?.trim() ? { memo: row.memo.trim() } : {}),
      ...(row.imageUrl?.trim() ? { imageUrl: row.imageUrl.trim() } : {}),
      ...(row.checked ? { checked: true as const } : {}),
    }));
}

/** 리스트 메모 편집 — 자동 저장 Bottom Sheet */
export default function ListMemoEditor({
  isOpen,
  editingNote = null,
  persistedNoteId = null,
  onClose,
  onSave,
  onDelete,
}: ListMemoEditorProps) {
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([emptyDraft()]);
  const [error, setError] = useState("");
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const persistTimerRef = useRef<number | null>(null);
  const isEditing = persistedNoteId != null || editingNote != null;

  const persist = useCallback(
    (nextTitle: string, nextRows: DraftRow[]) => {
      const items = draftsToItems(nextRows);
      // 제목·항목이 모두 비어 있으면 저장하지 않음 (신규 빈 시트)
      if (!nextTitle.trim() && items.length === 0) return;
      onSave({
        title: nextTitle.trim() || "리스트 메모",
        items,
      });
    },
    [onSave],
  );

  const schedulePersist = useCallback(
    (nextTitle: string, nextRows: DraftRow[]) => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        persist(nextTitle, nextRows);
      }, 120);
    },
    [persist],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingNote && editingNote.type === "list") {
      setTitle(editingNote.title);
      setRows(toDraftRows(editingNote.items ?? []));
    } else {
      setTitle("");
      setRows([emptyDraft()]);
    }
    setError("");
    // 열릴 때만 초기화 — 자동 저장 중 editingNote 변경으로 입력 상태를 덮어쓰지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    // 닫기 전 최종 flush
    if (persistTimerRef.current != null) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    persist(title, rows);
    setError("");
    onClose();
  };

  const commitRow = (key: string, options?: { focusNext?: boolean }) => {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.key === key);
      if (index < 0) return prev;

      const current = prev[index];
      const trimmed = current.name.trim();
      if (!trimmed) {
        // 빈 행은 맨 끝 draft만 유지
        const without = prev.filter((row) => row.key !== key || !row.id);
        const ensured =
          without.some((row) => !row.id && !row.name.trim())
            ? without
            : [...without, emptyDraft()];
        schedulePersist(title, ensured);
        return ensured;
      }

      const committed: DraftRow = {
        ...current,
        id: current.id ?? generateListMemoItemId(),
        name: trimmed,
      };

      const next = [...prev];
      next[index] = committed;

      const hasTrailingEmpty = next.some(
        (row, i) => i > index && !row.name.trim() && !row.id,
      );
      if (!hasTrailingEmpty) {
        next.push(emptyDraft());
      }

      schedulePersist(title, next);

      if (options?.focusNext) {
        const nextKey = next[index + 1]?.key;
        window.setTimeout(() => {
          if (nextKey) inputRefs.current.get(nextKey)?.focus();
        }, 30);
      }

      return next;
    });
  };

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => {
      const next = prev.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      );
      return next;
    });
  };

  const persistRowPatch = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => {
      const next = prev.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      );
      schedulePersist(title, next);
      return next;
    });
  };

  const handleDeleteItem = (key: string) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.key !== key);
      const ensured =
        next.length === 0 || next.every((row) => row.name.trim())
          ? [...next, emptyDraft()]
          : next;
      schedulePersist(title, ensured);
      return ensured;
    });
  };

  const handlePickImage = (key: string, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("이미지는 2MB 이하만 사용할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        persistRowPatch(key, { imageUrl: reader.result });
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteNote = () => {
    const noteId = persistedNoteId ?? editingNote?.id;
    if (!noteId || !onDelete) return;
    if (!confirm("이 메모를 삭제할까요?")) return;
    onDelete(noteId);
    onClose();
  };

  const handleTitleBlur = () => {
    schedulePersist(title, rows);
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="모달 닫기"
    >
      <Text variant="title-sm" as="h2" className="text-xl font-bold">
        {isEditing ? "리스트 메모" : "리스트 메모 추가"}
      </Text>

      <div className="mt-4 space-y-4">
        <label className="block">
          <Text variant="label" as="span">
            제목
          </Text>
          <Input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTitleBlur();
                const first = rows[0]?.key;
                if (first) inputRefs.current.get(first)?.focus();
              }
            }}
            placeholder="예: 디저트 리스트"
            className="mt-1"
          />
        </label>

        <div className="border-t border-border pt-3">
          <ul className="space-y-2" role="list">
            {rows.map((row) => (
              <li key={row.key}>
                <Card padding="sm" className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      disabled={!row.name.trim() && !row.id}
                      onChange={(e) => {
                        if (!row.name.trim() && !row.id) return;
                        persistRowPatch(row.key, {
                          checked: e.target.checked,
                          id: row.id ?? generateListMemoItemId(),
                          name: row.name.trim(),
                        });
                      }}
                      className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                      aria-label={`${row.name || "항목"} 체크`}
                    />
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current.set(row.key, el);
                        else inputRefs.current.delete(row.key);
                      }}
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.key, { name: e.target.value })
                      }
                      onBlur={() => commitRow(row.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitRow(row.key, { focusNext: true });
                        }
                      }}
                      placeholder="항목 이름"
                      className={cn(
                        "h-9 flex-1 text-[13px]",
                        row.checked && "text-muted line-through",
                      )}
                      autoComplete="off"
                    />
                    {(row.id || row.name.trim()) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(row.key)}
                        className="h-8 shrink-0 px-2 text-[11px] text-muted hover:text-danger"
                      >
                        삭제
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pl-6">
                    {row.imageUrl ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            persistRowPatch(row.key, { imageUrl: undefined })
                          }
                          className="absolute -right-1 -top-1 rounded-full bg-card p-0.5 shadow"
                          aria-label="사진 제거"
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    ) : null}
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1.5 text-[11px] text-muted hover:border-primary/40 hover:text-foreground">
                      <Camera className="h-3.5 w-3.5" aria-hidden />
                      사진 추가
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          handlePickImage(row.key, file);
                        }}
                      />
                    </label>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 h-9 w-full text-[13px]"
            onClick={() => {
              setRows((prev) => {
                if (prev.some((row) => !row.name.trim())) return prev;
                const next = [...prev, emptyDraft()];
                const key = next[next.length - 1].key;
                window.setTimeout(
                  () => inputRefs.current.get(key)?.focus(),
                  30,
                );
                return next;
              });
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            항목 추가
          </Button>
        </div>

        {error && (
          <Text variant="body" className="text-danger" role="alert">
            {error}
          </Text>
        )}

        <div className="flex gap-3 pt-2">
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDeleteNote}
              className="border-danger/30 text-danger"
            >
              메모 삭제
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            닫기
          </Button>
        </div>
      </div>
    </OverlayLayer>
  );
}
