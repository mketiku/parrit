# UX Principles & Design Patterns

Design decisions documented here to preserve intent and prevent regression through refactoring.

---

## Inline Editing

**Pattern:** Click content to edit inline. Triggers are **decoupled** to prevent accidental "bulk edits." Auto-save on blur. Escape to cancel.

**Why:** Reduces modal fatigue. Decoupling (e.g., renaming the board separate from editing goals) prevents a user from being overwhelmed with too many input fields when they only want to change one thing.

**Implementation:**

- Board Name is editable via the dedicated **Pencil icon** (Rename Board).
- Goals are editable by **clicking directly** on the goals area.
- Click triggers the specific `isEditing` or `isEditingGoals` state.
- Textarea/input is shown inline at the same location.
- Blur automatically saves via `handleSave()` callback.
- Textarea grows with content: `rows={Math.max(3, value.split('\n').length + 1)}`.
- Escape key cancels (restores original value, closes editor).

**Files:** `DroppableBoard.tsx`

---

## Destructive Action Confirmations

**Pattern:** Delete/destructive actions always require confirmation dialog before executing.

**Why:** Prevents accidental data loss. Users must consciously confirm the action.

**Implementation:**

- Button click sets confirmation state: `setDeleteConfirmOpen(true)`
- Confirmation dialog (fixed overlay, backdrop blur, z-50) appears with:
  - Icon (Trash2, AlertTriangle, etc.)
  - Title ("Delete Board?")
  - Description
  - Cancel + Confirm buttons
- Only on confirm click does the action execute

**Files:** `DroppableBoard.tsx` (delete board), `HistoryScreen.tsx` (delete session)

---

## Toast Feedback for Save Operations

**Pattern:** Rename/save operations show success/error toasts.

**Why:** User sees confirmation that the action completed (or failed).

**Implementation:**

- Wrap operation in try/catch
- On success: `addToast('Board renamed', 'success')`
- On failure: `addToast('Failed to rename board', 'error')`
- Toast auto-dismisses after 3-5 seconds

**Files:** `DroppableBoard.tsx` (board rename)

---

## Button Sizing Consistency

**Pattern:** All primary action buttons use same dimensions and styling.

**Why:** Visual consistency across the app. Users recognize CTAs.

**Sizing:**

- **Primary buttons:** `px-4 py-2 text-sm font-semibold`
- **Icon-only buttons:** `h-7 w-7` for small actions, `h-9 w-9` for medium
- **Icon sizes within buttons:** `h-4 w-4` for text buttons, `h-3.5 w-3.5` for compact buttons

**Colors:**

- **Primary action:** `bg-brand-500 text-white`
- **Secondary action:** `bg-white border border-neutral-200`
- **Destructive action:** `bg-red-50 text-red-500`

**Files:** `AppLayout.tsx` (Sign Out button), `PairingWorkspace.tsx` (Save Session)

---

## Subtle Add Action (Placeholder Pattern)

**Pattern:** Avoid heavy primary buttons for intermittent actions. Use subtle text placeholders that blend into the content list.

**Why:** Prevents "visual competition" between buttons and the actual data (team members). Keeps the dashboard clean when multiple boards are visible.

**Implementation:**

```tsx
{
  isEmpty ? (
    <button className="group/add-goal flex items-center gap-2 px-2 py-1 text-[11px] text-neutral-400 ...">
      <Plus className="h-3 w-3 transition-transform group-hover/add-goal:rotate-90" />
      <span>Add daily goal...</span>
    </button>
  ) : (
    /* Render goals list */
  );
}
```

**Files:** `DroppableBoard.tsx` (Add Goals button)

---

## Disabled State Guards

**Pattern:** Disable buttons when preconditions aren't met (not just during loading).

**Why:** Prevents invalid operations. Sets user expectations.

**Example:** Recommend Pairs button disabled when:

- `boards.length === 0` (nothing to pair into)
- `people.length < 2` (can't pair with fewer than 2 people)

**Implementation:**

```tsx
disabled={isLoading || boards.length === 0 || people.length < 2}
```

**Files:** `PairingWorkspace.tsx` (Recommend Pairs button)

---

## Single-Purpose Actions

**Pattern:** Use specific icons for specific tasks. Avoid icons that trigger "Global" edit modes.

**Why:** Predictability. If a user clicks a pencil next to a title, they expect to rename that title, not edit the entire board configuration.

**Instead:** Use a single pencil for title renaming. Use the "Click-to-edit" pattern with a hover hint for the goals list.

**Files:** `DroppableBoard.tsx`

---

## Meeting Link Visibility

**Pattern:** Show meeting link preview only when not editing related content.

**Why:** Prevent display clutter when editing. Clear separation of view/edit modes.

**Implementation:**

```tsx
{board.meetingLink && (
  <a href={board.meetingLink} ...>Join Session</a>
)}
```

(No `!isEditingGoals` guard needed since goals are now inline-edited at different location.)

**Files:** `DroppableBoard.tsx`

---

## Form Layout & Spacing

**Pattern:**

- `space-y-3` between form sections
- `mb-4` for goal/content blocks below board header
- `px-3 py-2` for inline form inputs
- `rounded-xl` for modern, soft corners

**Why:** Consistent visual rhythm. Breathing room without excess space.

**Files:** All components using forms

---

## Dark Mode Support

**Pattern:** Every color has light AND dark variant.

**Implementation:**

```tsx
className =
  'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400';
```

**Why:** App supports both light and dark themes. CSS must account for both.

**Files:** All components

---

## Hover Affordance Hints

**Pattern:** Content that is "Click-to-edit" should show a subtle affordance on hover (background tint + faint secondary icon).

**Why:** Solves the discoverability problem of inline editing without cluttering the UI with permanent edit buttons.

**Implementation:**

- Apply `group/goals` to the container.
- Add an absolute-positioned icon (e.g., Pencil) with `opacity-0 group-hover/goals:opacity-40`.
- Apply a subtle background shift: `hover:bg-neutral-50`.

**Files:** `DroppableBoard.tsx` (goals section)

---

## Auto-save Debouncing

**Pattern:** Debounce rapid saves to avoid hitting DB too frequently.

**Why:** Performance. Reduces unnecessary database calls during rapid user input.

**Implementation:** (Not yet implemented, but planned for textarea changes)

---

## Error Recovery

**Pattern:** On failed operations, restore previous value and show error toast.

**Why:** User knows the operation failed. Data isn't left in broken state.

**Implementation:**

```tsx
try {
  await updateBoard(board.id, { name: trimmed });
  addToast('Board renamed', 'success');
} catch {
  setEditedName(board.name); // restore
  addToast('Failed to rename board', 'error');
}
```

**Files:** `DroppableBoard.tsx` (board rename)

---

## Testing Patterns

**Pattern:** Component tests use mock factories and selector-based store mocks.

**Why:** Tests reflect real usage (selectors). Mocks are maintainable (factories).

**Implementation:**

```tsx
const mockStore = createMockPairingStore();
vi.mocked(usePairingStore).mockImplementation((selector?: any) =>
  selector ? selector(mockStore) : mockStore
);
```

**Files:** `*.test.tsx` files

---

## Keyboard Shortcuts

**Pattern:** Text inputs respond to Enter and Escape.

**Why:** Standard UX. Users expect these shortcuts.

**Implementation:**

- **Enter:** Save/submit (for single-field inputs)
- **Escape:** Cancel/close editor

**Files:** All inline editors

---

## Semantic Status vs Utility Actions

**Pattern:** Separate high-level "Operational Modes" (e.g., Active vs. Off-Duty) from specific "Utility Actions" (e.g., Lock, Rename).

**Why:** Prevents "Action Overload." If every button looks like a small icon in a group, the user has to stop and think about the meaning of each. By moving the mode toggle to the **Board Icon** and using a dedicated **Status Badge**, we create a clear hierarchy: "What is this board's role?" vs "What do I want to do to this board right now?"

**Files:** `DroppableBoard.tsx`

---

## Silent Defaults (Exception-first Design)

**Pattern:** Avoid labeling the standard or "ideal" state (e.g., "Active," "Normal," "Connected"). Only label the **Exceptions**.

**Why:** Reduces visual noise. If 80% of your boards are "Active," having 8 labels that say "Active" provides zero new information while creating massive clutter. By keeping the default state "Silent," we ensure that when an exception _does_ appear (like "Off-Duty" or "Stale Pair"), it captures the user's attention effectively.

**Contrast Rule:** Non-critical status exceptions (like "Off-Duty") should use low-contrast, neutral tones (`neutral-400`) to signal their status without competing with primary data or critical alerts.

**Files:** `DroppableBoard.tsx`
