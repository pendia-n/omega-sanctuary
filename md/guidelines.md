# GUIDELINES: orega Design System

## 1. Visual Identity ("The Terminal")
The UI must feel like a specialized developer tool, not a marketing site. 
- **Theme**: High-Contrast Dark Mode.
- **Background**: `#0a0a0a` (Near Black).
- **Accents**: 
  - **Neon Green (`#00ff9d`)**: Success, Active, Live.
  - **Cyber Blue (`#00e1ff`)**: Information, Structure.
  - **Alert Red (`#ff0055`)**: Errors, Expiry, Warnings.

## 2. Typography
- **Primary Font**: Monospace (JetBrains Mono, Fira Code, or System Mono).
- **Rules**:
  - All headers are `UPPERCASE`.
  - All data values are `code-styled`.
  - Max readability: White text on dark backgrounds.

## 3. Component Rules
### A. The Ephemeral Key Toast
- Must be the **loudest** element on screen when active.
- **Animation**: Pulsing count-down bar.
- **Behavior**: Absolute dismissal on timer zero.

### B. Code Blocks
- Dark grey background (`#111`).
- Syntax highlighting for JSON/Bash.
- "Copy to Clipboard" button is mandatory.

### C. The Warning Modal
- **Text**: "WARNING: KEY IS EPHEMERAL."
- **Tone**: Severe but helpful. "We do not store your key. You must save it."

## 4. UX Patterns
- **No-Click to Read**: All documentation snippets should be visible immediately.
- **One-Click to Act**: Buttons should provide immediate feedback (e.g., "Copied!", "Sent!").
- **Live Feed**: The "Log" window should scroll automatically, mimicking a terminal tail.
