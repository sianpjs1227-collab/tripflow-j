"use client";

import { useMemo, useState } from "react";
import type { Note, NoteInput } from "@/types/note";
import { useTripDetail } from "@/contexts/TripDetailContext";
import { createNote, updateNote } from "@/lib/note-utils";
import { Text } from "@/components/ui";
import TripTabHeader from "../TripTabHeader";
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
    <div className="space-y-2">
      <TripTabHeader
        title="메모"
        meta={notes.length > 0 ? `${notes.length}개` : undefined}
        onAdd={openCreateModal}
      />

      {notes.length === 0 ? (
        <Text variant="muted" className="py-4 text-center text-[12px]">
          아직 등록된 메모가 없습니다.
        </Text>
      ) : (
        <ul className="space-y-1.5" role="list">
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
