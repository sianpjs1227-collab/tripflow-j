"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type {
  ListMemoItem,
  ListMemoItemInput,
  ListNoteInput,
  Note,
} from "@/types/note";
import {
  createListMemoItem,
  updateListMemoItem,
} from "@/lib/note-utils";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";
import ListMemoItemDialog from "./ListMemoItemDialog";

interface ListMemoEditorProps {
  isOpen: boolean;
  editingNote?: Note | null;
  onClose: () => void;
  onSave: (input: ListNoteInput) => void;
  onDelete?: (id: string) => void;
}

/** 리스트 메모 편집 — Bottom Sheet */
export default function ListMemoEditor({
  isOpen,
  editingNote = null,
  onClose,
  onSave,
  onDelete,
}: ListMemoEditorProps) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ListMemoItem[]>([]);
  const [error, setError] = useState("");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListMemoItem | null>(null);
  const isEditing = editingNote != null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingNote && editingNote.type === "list") {
      setTitle(editingNote.title);
      setItems(editingNote.items ?? []);
    } else {
      setTitle("");
      setItems([]);
    }
    setError("");
    setIsItemDialogOpen(false);
    setEditingItem(null);
  }, [isOpen, editingNote]);

  const handleClose = () => {
    setTitle("");
    setItems([]);
    setError("");
    setIsItemDialogOpen(false);
    setEditingItem(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    onSave({ title: title.trim(), items });
    handleClose();
  };

  const openAddItem = () => {
    setEditingItem(null);
    setIsItemDialogOpen(true);
  };

  const openEditItem = (item: ListMemoItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = (input: ListMemoItemInput) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? updateListMemoItem(item, input) : item,
        ),
      );
    } else {
      setItems((prev) => [...prev, createListMemoItem(input)]);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm("이 항목을 삭제할까요?")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteNote = () => {
    if (!editingNote || !onDelete) return;
    if (!confirm("이 메모를 삭제할까요?")) return;
    onDelete(editingNote.id);
    handleClose();
  };

  return (
    <>
      <OverlayLayer
        isOpen={isOpen}
        sheet
        onClose={handleClose}
        closeLabel="모달 닫기"
      >
        <Text variant="title-sm" as="h2" className="text-xl font-bold">
          {isEditing ? "리스트 메모 수정" : "리스트 메모 추가"}
        </Text>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              placeholder="예: 디저트 리스트"
              className="mt-1"
            />
          </label>

          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={openAddItem}
              className="h-9 w-full text-[13px]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              항목 추가
            </Button>
          </div>

          <div className="border-t border-border pt-3">
            {items.length === 0 ? (
              <Text variant="muted" className="py-2 text-center text-[12px]">
                아직 항목이 없습니다.
              </Text>
            ) : (
              <ul className="space-y-2" role="list">
                {items.map((item) => (
                  <li key={item.id}>
                    <Card padding="sm" className="space-y-2">
                      <button
                        type="button"
                        onClick={() => openEditItem(item)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Text
                            variant="body-medium"
                            as="span"
                            className="block text-[13px] font-semibold"
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
                              className="block whitespace-pre-wrap text-[12px]"
                            >
                              {item.memo}
                            </Text>
                          ) : null}
                        </div>
                      </button>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 px-2 text-[11px] text-muted hover:text-danger"
                        >
                          삭제
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
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
                삭제
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" className="flex-1">
              저장
            </Button>
          </div>
        </form>
      </OverlayLayer>

      <ListMemoItemDialog
        isOpen={isItemDialogOpen}
        editingItem={editingItem}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />
    </>
  );
}
