# Feature Requirements: Modern Parrit

This document outlines the core features for the modern, from-scratch version of Parrit.

## 1. Project & Account Management
- **Individual Auth**: Users sign up with their own email (Magic Link/Social) via Supabase Auth.
- **Workspace Model**: Users can create, manage, or be invited to multiple "Workspaces" (Projects).
- **Workspace Configuration**: Default pairing boards are minimalist: one `Pairing Board` and one `Out of Office` (exempt) board are created upon Workspace initialization.
- **Project Export/Import**: Ability to export the entire project state (people, boards, history) as a JSON file and import it back to restore or migrate data.
- **Stakeholder View-Only Links**: Generatable "read-only" URLs that allow stakeholders (Managers, POs) to view the current pairing board without edit permissions or needing an account.
- **Session Links**: Ability to add/edit a Zoom or Microsoft Teams link to a pairing board for easy joining.
- **Data Persistence**: All people, boards, and history are saved to the project.

## 2. Pairing Board Workspace
- **Dynamic Boards**: Create, rename, and delete pairing boards.
- **Board Templates**: Save and load custom board layouts (e.g., "Standard Dev" vs. "Release Day") to quickly switch workspace configurations.
- **Per-Board Goals**: A dedicated focus area on each board for daily goals, Jira tickets, or context that persists for the session.
- **Exempt Boards**: Ability to mark boards (like "OUT OF OFFICE") as exempt, so people on them aren't included in rotation suggestions.
- **Role Management**: Add, move, and remove roles (e.g., "Dev", "QA") on specific boards.
- **Keyboard Shortcuts**: Power users can use keyboard keys (Tab/Arrows) to quickly navigate and move people between boards.
- **Drag & Drop**: Seamlessly move people and roles between boards and the "Unpaired" list.

## 3. Team Member Management
- **Person CRUD**: Add new team members to the project and delete them.
- **Initial-based Avatars**: Automatically generated avatars (colors + initials) based on the person's name for quick visual identification.
- **Stale Pair Highlighting**: Subtile visual cues (e.g., a "flame" icon or color shift) to highlight pairs that have been together for too long without rotation.
- **Unpaired List**: A central pool for people not currently assigned to a board.

## 4. Recommendation Engine
- **Pair Suggestion**: A "Recommend" button that suggests the best pairing arrangement based on historical data.
- **Historical Context**: Suggestions prioritize pairing people who haven't worked together recently.
- **Reset Logic**: Ability to reset all non-exempt boards, moving all people back to the "Unpaired" list.

## 5. Pairing History
- **Save Pairing**: Record the current state of all boards as a "Pairing Session".
- **History Timeline**: View a chronological list of past pairing sessions.
- **Session Management**: Ability to delete specific historical pairing records.

## 6. User Experience (Modern Goals)
- **Accessibility & Screen Readers**: Fully optimized for screen readers with proper ARIA labels and focus management for the drag-and-drop experience.
- **Theme Support**: Native support for **System**, **Light**, and **Dark** modes with seamless switching.
- **Premium Aesthetics**: "Human Modern" UI with soft shadows, clean whitespace, and professional typography.

## 7. Deployment & Infrastructure
- **Hosting**: Vercel (Optimized for SPA routing and performance).
- **CI/CD**: Automatic deployment from GitHub branches (main for production, others for preview).

## 7. Monetization & Support
- **"Buy Me a Coffee"**: Integration (link or button) to allow other developers to support the project via donations.

- **Mobile Friendliness**: (Nice-to-have) Responsive design with a "Tap-to-Select" fallback for moving people/roles on touch devices.
- **Team Stats Modal**: (Nice-to-have) Future data-driven dashboard showing pairing trends (e.g., "Most frequent pair", "Unpaired frequency", "Historical pairing coverage %").
- **Board Template Library**: Future consideration for predefined board setup templates (e.g., "Classic Bird Names", "Functional Agile").

## 9. Future Considerations (Non-immediate)
- **Privacy-Focused Analytics**: If analytics are added in the future, they must be static, privacy-focused, and free of 3rd-party scripts that impact page performance or user privacy.
