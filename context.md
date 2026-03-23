# Skill Dashboard - Project Context

## 📌 Project Overview
The **Skill Dashboard** is a lightweight, local web interface designed to manage, explore, and install AI agent skills (following the emerging `skills.sh` open standard). It acts as a graphical layer over the `npx skills` command-line interface, making it effortless for developers to navigate their `.agents/skills` repository.

### Core Value Proposition
While the standard approach for managing AI skills is heavily CLI-based, this dashboard provides a **Unified Visual Inventory**. Compared to the only known competitor in the market—a heavy Rust/Tauri desktop application called *SkillDuck*—this dashboard is a fast, OS-agnostic, browser-first Node.js tool that can be easily installed via `npm install -g`.

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express
- **Frontend:** Vanilla HTML5, CSS3, JavaScript
- **Markdown Parsing:** `marked` library
- **Execution:** Spawns child processes to run `npx -y skills ls --json`
- **Typography:** Fira Code (Monospace)
- **Design Paradigm:** "Distill" — ultra-minimalist, stark aesthetic stripped of unnecessary icons, focusing purely on content readability and spacing.

---

## ✨ Key Features & Capabilities

### 1. Scope Segregation
- **Global Skills:** Scans the user's global `.agents/skills` environment.
- **Project Skills:** Reads the immediate directory the `skill-dashboard` command was launched from to determine localized skills, providing dual-tab navigation.

### 2. Smart Functional Grouping
Instead of relying on rigid naming conventions, the backend server parses every `SKILL.md` file and uses regex to analyze the **description frontmatter** and **first body paragraph**. It automatically classifies skills into five frozen, alphabetically sorted UI categories:
- **Analysis & Review** *(e.g., critique, audit)*
- **Code & Development** *(e.g., refactoring, edge cases, react, typescript)*
- **Content & Communication** *(e.g., copy, pptx, slides)*
- **Design & UI** *(e.g., figma, animation, components)*
- **Workflow & Tooling** *(e.g., finding skills, one-time configs)*

### 3. Dynamic Sorting & Layouts
- **Custom Sorts:** Skills inside the functional categories automatically re-sort based on user preference (Newest Installed, Oldest Installed, Name A-Z).
- **View Modes:** Toggleable Grid (Cards) and List (Rows) layouts.

### 4. Slide-in Details Drawer
Clicking anywhere on a skill card summons a fixed 560px-wide side drawer from the right edge. It presents:
- Evaluated `SKILL.md` contents rendered into safe HTML.
- Exact installation date tracking (parsed dynamically as `YYYY/MM/DD HH:MM`).
- Compatible agent badges (e.g., `Antigravity`, `Cline`).
- Fixed persistent action buttons locked to the bottom footer (View on skills.sh, Copy install command).

### 5. Mobile Responsiveness
The dashboard uses advanced flexbox layouts to remain perfectly usable on narrow screens (< 860px):
- The rigid desktop topbar shatters into three elegantly stacked rows.
- The 560px side drawer expands to 100% width.
- Action buttons remain locked alongside the logo.
- The heavy filter/view/sort menus degrade into a native, horizontally scrollable overflow row to prevent viewport clipping.

---

## 🚀 Publishing Blueprint
The project is structurally primed for NPM publication (`package.json` contains the `bin` entry to lock it in as a global command). 

**To publish as a global executable tool:**
1. Ensure the `name` field in `package.json` is globally unique (e.g., `@jameshou/skill-dashboard` or `agent-skills-dashboard`).
2. Run `npm login` in the terminal.
3. Run `npm publish --access public`.
4. Any user can then run `npm install -g <package-name>` and type that name in their terminal to launch the GUI immediately on `http://localhost:3847`.
