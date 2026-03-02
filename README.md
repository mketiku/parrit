# Parrit 🦜

A modern, premium pairing tool designed for high-performance teams. Build faster, together.

Created and maintained by **Michael Ketiku**.

## Overview

Parrit is an "ideal" pairing tool that is fast, beautiful, and maintenance-free. It helps teams manage their pairing sessions, track pairing history, and provides intelligent recommendations to ensure optimal team collaboration.

## Features

- **Workspace Management**: Individual authentication with multi-workspace support.
- **Dynamic Pairing Boards**: Create, rename, and manage boards for different team contexts.
- **Real-time Collaboration**: Powered by Supabase for instant updates across the team.
- **Intelligent Recommendations**: Weighted-random pairing algorithm to suggest optimal pairs.
- **Premium UI/UX**: Professional glassmorphism design with theme support (Light/Dark/System).
- **Accessibility First**: Built with ARIA support and keyboard navigation in mind.

## Tech Stack

- **Frontend**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) + [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Drag & Drop**: [@dnd-kit/core](https://dnd-kit.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pairing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests

- Unit Tests: `npm run test`
- E2E Tests: `npx playwright test`

## Project Structure

- `src/features/`: Feature-based modules (auth, pairing, recommendation, etc.)
- `src/components/`: Reusable UI components.
- `src/lib/`: External service clients and utilities.
- `docs/`: Project documentation and implementation plans.

## License

This project is private and maintained by Michael Ketiku.
