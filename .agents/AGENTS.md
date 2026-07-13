# AI Coding Rules & Workflow (WSR) - Kid Explorer Hub

This document defines the rules, guidelines, and workflow constraints for any AI agent (Antigravity, Claude, GPT, Codex, etc.) working on this repository.

---

## 1. Scope & Permissions Constraints

To prevent unwanted changes and resource waste, the AI MUST adhere to these strict limits:

* **No Automated Full-Project Refactoring**: You are NOT permitted to refactor files outside the direct scope of the user's request. Keep edits targeted and localized.
* **Preserve Unrelated Code**: Do not modify, clean, or delete comments, docstrings, or helpers that are unrelated to the current task.
* **Propose Before Restructuring**: Any change to file structures, folder layouts, or core architectural layers must be proposed in text first. Wait for explicit user confirmation before applying.
* **Token Conservation**: Use localized search/replace or targeted line edits. DO NOT read or write entire files if only small sections are changing.
* **Git Commit & Push Frequency**: Commit and push changes to GitHub once every hour of continuous work, or upon completing a significant feature. DO NOT commit after every single prompt/edit, to maintain a clean repository history.

---

## 2. Technical Design Principles (Capacitor & Web-First)

* **Capacitor-Ready SPA**: The application is a Single Page Application (SPA) designed to compile to Android/iOS. All web-facing code must go into the `www/` directory.
* **Vanilla & Pure Web APIs**:
  - CSS: Use CSS variables, Flexbox/Grid, and standard transitions. Do not add Tailwind or heavy CSS libraries unless requested.
  - JS: Use modern vanilla ES6+ JavaScript. Avoid importing heavy framework runtimes (React/Vue/Angular) unless requested.
  - Audio: Synthesize sound effects programmatically using the **Web Audio API** (defined in `www/js/audio.js`) to keep the bundle small, fast, and offline-friendly.
  - Graphics: Prefer clean inline SVGs for UI illustrations rather than heavy PNG/JPG assets.
* **Mobile-First Responsiveness**: All layouts must scale gracefully to mobile devices in landscape mode (as specified in `manifest.json`). Ensure touch events (`touchstart`, `touchmove`, `touchend`) are bound with `preventDefault()` on drawing elements to avoid viewport scrolling.

---

## 3. Workflow Protocol (Step-by-Step)

Every task must follow this three-phase workflow:

### Phase 1: Research & Plan
* Check current files using read/search tools.
* Formulate a short, targeted plan.
* Ask the user for clarification if any requirement is ambiguous.

### Phase 2: Localized Implementation
* Implement changes in small, incremental steps.
* Create new modular files in `www/js/games/` for new games rather than piling code into `app.js`.
* Update `.gitignore` if new build artifacts or temp files are introduced.

### Phase 3: Verification
* Verify changes locally.
* Guide the user on how to run and test the changes.
* Prompt the user to test on mobile via local serve or GitHub Pages.

---

## 4. Cross-AI Tool Compatibility Map

* **Folder structure**:
  - `/www`: Target directory for all web client assets.
  - `/www/index.html`: Entry point.
  - `/www/css`: Stylesheets.
  - `/www/js`: Core client controller and game modules.
  - `/www/manifest.json` & `/www/sw.js`: PWA configuration.
* **If using Cursor/Windsurf/Cline**:
  - Respect the rules in `.cursorrules` (which mirrors this file).
  - Use partial file diff edits instead of overwriting files.
