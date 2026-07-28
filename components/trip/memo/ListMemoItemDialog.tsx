"use client";

import { useEffect, useRef, useState } from "react";
import type { ListMemoItem, ListMemoItemInput } from "@/types/note";
import { Button, Card, Input, OverlayLayer, Text, Textarea } from "@/components/ui";
import ListMemoItemImagePicker from "./ListMemoItemImagePicker";

interface ListMemoItemDialogProps {
  isOpen: boolean;
  editingItem?: ListMemoItem | null;
  onClose: () => void;
  onSave: (input: ListMemoItemInput) => void;
}

const EMPTY_FORM: ListMemoItemInput = {
  name: "",
  memo: "",
  imageUrl: "",
};

/** 리스트 메모 항목 추가/수정 — 중앙 Dialog */
export default function ListMemoItemDialog({
  isOpen,
  editingItem = null,
  onClose,
  onSave,
}: ListMemoItemDialogProps) {
  const [form, setForm] = useState<ListMemoItemInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const isEditing = editingItem != null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setForm({
        name: editingItem.name,
        memo: editingItem.memo ?? "",
        imageUrl: editingItem.imageUrl ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen, editingItem]);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    onSave({
      name: form.name.trim(),
      memo: form.memo?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
    });
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      centered
      onClose={handleClose}
      closeLabel="모달 닫기"
      panelClassName="w-[90vw] max-w-[460px]"
    >
      <Card
        padding="lg"
        className="w-full bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-memo-item-dialog-title"
      >
        <Text
          variant="title-sm"
          as="h2"
          id="list-memo-item-dialog-title"
          className="text-xl font-bold"
        >
          {isEditing ? "항목 수정" : "항목 추가"}
        </Text>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              이름
            </Text>
            <Input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setError("");
              }}
              placeholder="예: 커피젤리푸딩"
              className="mt-1"
              autoComplete="off"
            />
          </label>

          <label className="block">
            <Text variant="label" as="span">
              메모{" "}
              <Text variant="muted" as="span">
                (선택)
              </Text>
            </Text>
            <Textarea
              value={form.memo ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, memo: e.target.value }))
              }
              placeholder="짧은 메모"
              rows={3}
              className="mt-1"
            />
          </label>

          <ListMemoItemImagePicker
            value={form.imageUrl}
            onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
            onError={setError}
          />

          {error && (
            <Text variant="body" className="text-danger" role="alert">
              {error}
            </Text>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? "저장" : "추가"}
            </Button>
          </div>
        </form>
      </Card>
    </OverlayLayer>
  );
}
