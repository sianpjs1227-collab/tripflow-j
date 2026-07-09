"use client";

import { useEffect, useState } from "react";
import type { NoteInput, Note } from "@/types/note";
import { Button, Input, OverlayLayer, Text, Textarea } from "@/components/ui";

interface MemoModalProps {
  isOpen: boolean;
  editingNote?: Note | null;
  onClose: () => void;
  onSave: (input: NoteInput) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_FORM: NoteInput = { title: "", content: "" };

export default function MemoModal({
  isOpen,
  editingNote = null,
  onClose,
  onSave,
  onDelete,
}: MemoModalProps) {
  const [form, setForm] = useState<NoteInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = editingNote !== null;

  useEffect(() => {
    if (!isOpen) return;

    if (editingNote) {
      setForm({
        title: editingNote.title,
        content: editingNote.content,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [isOpen, editingNote]);

  const handleChange = (field: keyof NoteInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    onSave(form);
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleDelete = () => {
    if (!editingNote || !onDelete) return;
    if (!confirm("이 메모를 삭제할까요?")) return;
    onDelete(editingNote.id);
    handleClose();
  };

  return (
    <OverlayLayer
      isOpen={isOpen}
      sheet
      onClose={handleClose}
      closeLabel="모달 닫기"
    >
        <Text variant="title-sm" as="h2" className="text-xl font-bold">
          {isEditing ? "메모 수정" : "메모 추가"}
        </Text>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <Text variant="label" as="span">
              제목
            </Text>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 맛집 리스트"
              className="mt-1"
            />
          </label>

          <label className="block">
            <Text variant="label" as="span">
              내용
            </Text>
            <Textarea
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="메모 내용을 입력하세요"
              rows={6}
              className="mt-1"
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
              저장
            </Button>
          </div>
        </form>
    </OverlayLayer>
  );
}
