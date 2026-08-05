"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ListMemoItem, Note } from "@/types/note";
import { formatNoteDate, getNoteType } from "@/lib/note-utils";
import { Button, Card, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import ListMemoItemDetailDialog from "./ListMemoItemDetailDialog";
import LinkifiedText from "./LinkifiedText";

interface MemoItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleListItem?: (noteId: string, itemId: string) => void;
}

/** 접기/펼치기 가능한 메모 항목 */
export default function MemoItem({
  note,
  onEdit,
  onDelete,
  onToggleListItem,
}: MemoItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ListMemoItem | null>(null);
  const isList = getNoteType(note) === "list";
  const items = note.items ?? [];
  const images = note.images ?? [];

  const preview = isList
    ? items.length > 0
      ? `${items.length}개 항목`
      : "항목 없음"
    : note.content.trim().length > 0
      ? note.content.trim().split("\n")[0]
      : images.length > 0
        ? `사진 ${images.length}장`
        : "내용 없음";

  return (
    <>
      <Card padding="none">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-start justify-between gap-3 px-2.5 py-2 text-left"
          aria-expanded={isOpen}
        >
          <div className="min-w-0 flex-1">
            <Text
              variant="body-medium"
              as="h3"
              className="text-[13px] font-semibold leading-snug"
            >
              {note.title}
            </Text>
            {!isOpen && (
              <Text variant="muted" className="mt-0.5 truncate text-[12px]">
                {preview}
              </Text>
            )}
            <Text variant="caption" className="mt-0.5 text-[11px]">
              {formatNoteDate(note.updatedAt)}
              {isList ? " · 리스트" : ""}
            </Text>
          </div>
          {isOpen ? (
            <ChevronUp
              className="h-3.5 w-3.5 shrink-0 pt-0.5 text-muted"
              aria-hidden
            />
          ) : (
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 pt-0.5 text-muted"
              aria-hidden
            />
          )}
        </button>

        {isOpen && (
          <div className="border-t border-border px-2.5 py-2">
            {isList ? (
              items.length > 0 ? (
                <ul className="space-y-2" role="list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-start gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0">
                        <input
                          type="checkbox"
                          checked={item.checked === true}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleListItem?.(note.id, item.id);
                          }}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                          aria-label={`${item.name} 체크`}
                        />
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="min-w-0 flex-1 space-y-1.5 text-left hover:opacity-90"
                        >
                          <Text
                            variant="body-medium"
                            as="span"
                            className={cn(
                              "block text-[13px] font-semibold",
                              item.checked && "text-muted line-through",
                            )}
                          >
                            {item.name}
                          </Text>
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : null}
                          {item.memo ? (
                            <Text
                              variant="muted"
                              className="line-clamp-2 block whitespace-pre-wrap text-[12px]"
                            >
                              {item.memo}
                            </Text>
                          ) : null}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text variant="muted" className="text-[12px]">
                  항목이 없습니다.
                </Text>
              )
            ) : (
              <div className="space-y-3">
                {note.content.trim() ? (
                  <div className="text-[13px] text-foreground">
                    <LinkifiedText text={note.content} />
                  </div>
                ) : (
                  <Text variant="muted" className="text-[12px]">
                    내용이 없습니다.
                  </Text>
                )}
                {images.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, index) => (
                      <button
                        key={`${note.id}-img-${index}`}
                        type="button"
                        onClick={() =>
                          setDetailItem({
                            id: `${note.id}-img-${index}`,
                            name: note.title,
                            imageUrl: url,
                          })
                        }
                        className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                        aria-label={`${note.title} 사진 ${index + 1} 크게 보기`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-20 w-20 object-cover transition-opacity hover:opacity-90"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-3 flex gap-2">
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

      <ListMemoItemDetailDialog
        item={detailItem}
        isOpen={detailItem != null}
        onClose={() => setDetailItem(null)}
      />
    </>
  );
}
