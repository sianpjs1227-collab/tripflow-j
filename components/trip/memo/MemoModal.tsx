"use client";

import { useEffect, useState } from "react";
import type { NoteInput, Note } from "@/types/note";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-label="모달 닫기"
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-[#1c1c1e]">
        <h2 className="text-xl font-bold text-[#111111] dark:text-white">
          {isEditing ? "메모 수정" : "메모 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              제목
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 맛집 리스트"
              className="mt-1 w-full rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111111] dark:text-white">
              내용
            </span>
            <textarea
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="메모 내용을 입력하세요"
              rows={6}
              className="mt-1 w-full resize-none rounded-xl border border-[#ebebeb] px-4 py-3 text-base outline-none focus:border-[#0A84FF] dark:border-white/20 dark:bg-black/30 dark:text-white"
            />
          </label>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 dark:border-red-500/30"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-[#ebebeb] py-3 font-medium text-[#111111] dark:border-white/20 dark:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#0A84FF] py-3 font-semibold text-white"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
