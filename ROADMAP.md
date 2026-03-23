# 🗺️ Project Roadmap

## ⚡ Current Focus: UI Polish & Micro-animations (Small)

- Refine component styling for a premium feel.
- Implement smooth hover effects and interactive elements.
- Ensure visual harmony across light and dark modes.

## 🚀 Next Up: Keyboard Shortcuts & Webhooks (Medium)

- **Integrations & Ecosystem**: Push daily pairing snapshots to Slack, Discord, or MS Teams using webhooks.
- **Observability & Analytics**:
  - **Team Health Heatmaps**: Visualizations identifying "islands of knowledge".
  - **Rotation Velocity**: Metrics on pair rotation frequency and session lifespan.
- Implement global keyboard shortcuts for efficient navigation.
- Enhance pair rotation logic with configurable constraints.

## 🌟 Future Vision: Multi-team Workspaces & Real-time Collaboration (Advanced)

- Enable multi-team workspaces with separate boards.
- Implement real-time collaboration using WebSockets.
- **Extensible Plugin System**:
  - **Custom Contextual HUDs**: Plugins to inject real-time metadata (Jira tickets, PR status, skills) onto person cards.
  - **Custom Rotation Rules**: Logic-as-code plugins to define complex team-specific rotation constraints.
  - **Theming API**: Allow community-driven visual skins and custom component overrides.
- **Infrastructure & Accessibility**:
  - **Full WCAG 2.1 AA Compliance**: Keyboard-accessible drag-and-drop.
  - **Dockerized Self-Hosting**: Official `docker-compose` support for on-premise deployment.
- **AI-Enhanced Orchestration**: Evolution from our current "Least-Recent" heuristic to a context-aware engine.
  - **Why AI?**: Current logic only considers pairing history. The AI engine will integrate with GitHub/Jira to suggest pairs based on **technical expertise**, **active PRs**, and **onboarding needs**.
