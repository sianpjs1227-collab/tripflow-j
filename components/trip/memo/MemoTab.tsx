"use client";

import { useMemo, useState } from "react";
import type { ListNoteInput, Note, NoteInput, NoteType } from "@/types/note";
import { useTripDetail } from "@/contexts/TripDetailContext";
import {
  createListNote,
  createNote,
  getNoteType,
  updateListNote,
  updateNote,
} from "@/lib/note-utils";
import { Text } from "@/components/ui";
import TripTabHeader from "../TripTabHeader";
import MemoItem from "./MemoItem";
import MemoModal from "./MemoModal";
import MemoTypePickerModal from "./MemoTypePickerModal";
import ListMemoEditor from "./ListMemoEditor";

function MemoTabContent() {
  const { data, updateData } = useTripDetail();
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isListEditorOpen, setIsListEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const notes = useMemo(
    () =>
      [...data.notes].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [data.notes],
  );

  const openCreatePicker = () => {
    setEditingNote(null);
    setIsTypePickerOpen(true);
  };

  const handleSelectType = (type: NoteType) => {
    setEditingNote(null);
    if (type === "list") {
      setIsListEditorOpen(true);
    } else {
      setIsTextModalOpen(true);
    }
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    if (getNoteType(note) === "list") {
      setIsListEditorOpen(true);
    } else {
      setIsTextModalOpen(true);
    }
  };

  const closeTextModal = () => {
    setIsTextModalOpen(false);
    setEditingNote(null);
  };

  const closeListEditor = () => {
    setIsListEditorOpen(false);
    setEditingNote(null);
  };

  const handleSaveText = (input: NoteInput) => {
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

  const handleSaveList = (input: ListNoteInput) => {
    updateData((prev) => {
      if (editingNote) {
        return {
          ...prev,
          notes: prev.notes.map((note) =>
            note.id === editingNote.id ? updateListNote(note, input) : note,
          ),
        };
      }

      return {
        ...prev,
        notes: [createListNote(input), ...prev.notes],
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
        onAdd={openCreatePicker}
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
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <MemoTypePickerModal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        onSelect={handleSelectType}
      />

      <MemoModal
        isOpen={isTextModalOpen}
        editingNote={
          editingNote && getNoteType(editingNote) === "text"
            ? editingNote
            : null
        }
        onClose={closeTextModal}
        onSave={handleSaveText}
        onDelete={handleDelete}
      />

      <ListMemoEditor
        isOpen={isListEditorOpen}
        editingNote={
          editingNote && getNoteType(editingNote) === "list"
            ? editingNote
            : null
        }
        onClose={closeListEditor}
        onSave={handleSaveList}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** 메모 탭 — TripDetailData.notes 사용 */
export default function MemoTab() {
  return <MemoTabContent />;
}
