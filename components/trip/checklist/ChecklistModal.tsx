"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChecklistInput, ChecklistItem } from "@/types/checklist";
import { Button, Card, Input, OverlayLayer, Text } from "@/components/ui";

interface ChecklistModalProps {
  isOpen: boolean;
  editingItem?: ChecklistItem | null;
  onClose: () => void;
  onSave: (input: ChecklistInput) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM: ChecklistInput = { text: "" };

export default function ChecklistModal({
  isOpen,
  editingItem = null,
  onClose,
  onSave,
  onDelete,
}: ChecklistModalProps) {
  const [form, setForm] = useState<ChecklistInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingItem !== null;

  const handleClose = useCallback(() => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      editingItem
        ? { text: editingItem.text, category: editingItem.category }
        : EMPTY_FORM,
    );
    setError("");
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.text.trim()) {
      setError("항목 내용을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleDelete = () => {
    if (!editingItem || !onDelete) return;
    if (!confirm("이 항목을 삭제할까요?")) return;
    onDelete(editingItem.id);
    handleClose();
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
        aria-labelledby="checklist-modal-title"
      >
        <Text
          variant="title-sm"
          as="h2"
          id="checklist-modal-title"
          className="text-xl font-bold"
        >
          {isEditing ? "체크리스트 수정" : "체크리스트 추가"}
        </Text>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              항목명
            </Text>
            <Input
              ref={inputRef}
              type="text"
              value={form.text}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, text: e.target.value }));
                setError("");
              }}
              placeholder="예: 여권"
              className="mt-1"
              autoComplete="off"
            />
          </label>

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
                onClick={handleDelete}
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
              {isEditing ? "저장" : "추가"}
            </Button>
          </div>
        </form>
      </Card>
    </OverlayLayer>
  );
}
