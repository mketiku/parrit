import React, { useState } from 'react';
import { usePairingStore } from '../../pairing/store/usePairingStore';
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react';

const MAX_PEOPLE = 16;

const PRESET_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#06b6d4',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function TeamScreen() {
  const { people, addPerson, updatePerson, removePerson } = usePairingStore();
  const atLimit = people.length >= MAX_PEOPLE;

  // "Add" form state
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || atLimit) return;
    addPerson(newName.trim());
    setNewName('');
    setIsAdding(false);
  };

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const commitEdit = () => {
    if (!editingId || !editName.trim()) return;
    updatePerson(editingId, {
      name: editName.trim(),
      avatarColorHex: editColor,
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Team Members
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Add, rename, or remove people from your workspace.
          </p>
        </div>
        <button
          onClick={() => !atLimit && setIsAdding(true)}
          disabled={atLimit}
          title={atLimit ? `Team limit of ${MAX_PEOPLE} reached` : undefined}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          Add Person
        </button>
      </div>

      {/* At-limit nudge banner */}
      {atLimit && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-500/10">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Team limit of {MAX_PEOPLE} reached
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-500">
              Research shows the most effective engineering teams pair best with
              8–12 people. Consider removing inactive members before adding new
              ones.
            </p>
          </div>
        </div>
      )}

      {/* Add Person Form */}
      {isAdding && !atLimit && (
        <form
          onSubmit={handleAdd}
          className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-500/10"
        >
          <input
            autoFocus
            type="text"
            placeholder="Full name (e.g. Peter Parker)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500"
          >
            <Check className="h-4 w-4" />
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewName('');
            }}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </form>
      )}

      {/* People List */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-600">
            <p className="text-sm">
              No team members yet. Add one to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {people.map((person) => {
              const isEditing = editingId === person.id;
              const initials = getInitials(
                isEditing ? editName || person.name : person.name
              );

              return (
                <li
                  key={person.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  {/* Avatar Preview */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-1 ring-black/10 transition-all dark:ring-white/10"
                    style={{
                      backgroundColor: isEditing
                        ? editColor
                        : person.avatarColorHex,
                    }}
                  >
                    {initials}
                  </div>

                  {isEditing ? (
                    /* Inline Edit Form */
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-950"
                      />
                      {/* Color swatches */}
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            className={`h-6 w-6 rounded-full transition-all ${editColor === color ? 'scale-125 ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={commitEdit}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-all hover:bg-indigo-500"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 text-neutral-500 transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Row */
                    <>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {person.name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-600">
                          {getInitials(person.name)} · {person.avatarColorHex}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            startEdit(
                              person.id,
                              person.name,
                              person.avatarColorHex
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removePerson(person.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-neutral-400 dark:text-neutral-600">
        {people.length} {people.length === 1 ? 'person' : 'people'} in workspace
      </p>
    </div>
  );
}
