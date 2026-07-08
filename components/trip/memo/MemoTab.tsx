"use client";

import { useMemo, useState } from "react";
import type { Note, NoteInput } from "@/types/note";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { createNote, updateNote } from "@/lib/note-utils";
import MemoItem from "./MemoItem";
import MemoModal from "./MemoModal";

function MemoTabContent() {
  const { data, updateData } = useTripDetail();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const notes = useMemo(
    () =>
      [...data.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [data.notes],
  );

  const openCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSave = (input: NoteInput) => {
    updateData((prev) => {
      if (editingNote) {
        return {
          ...prev,
          notes: prev.notes.map((note) =>
            note.id === editingNote.id ? updateNote(note, input) : note,
          ),
        };
      }

      return {
        ...prev,
        notes: [createNote(input), ...prev.notes],
      };
    });
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== id),
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">메모</h2>
      <p className="mt-2 text-sm text-[#6e6e73]">{notes.length}개</p>

      <button
        type="button"
        onClick={openCreateModal}
        className="mt-4 w-full rounded-xl bg-[#0A84FF] py-3 text-sm font-semibold text-white"
      >
        메모 추가
      </button>

      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-[#6e6e73]">
          아직 등록된 메모가 없습니다.
        </p>
      ) : (
        <ul className="mt-6 space-y-3" role="list">
          {notes.map((note) => (
            <li key={note.id}>
              <MemoItem
                note={note}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <MemoModal
        isOpen={isModalOpen}
        editingNote={editingNote}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** 메모 탭 — TripDetailData.notes 사용 */
export default function MemoTab() {
  return <MemoTabContent />;
}
