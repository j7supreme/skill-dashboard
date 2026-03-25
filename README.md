# Agent Skill Dashboard

A local web interface to manage, explore, and install your AI agent skills (`.agents/skills`, `.codex`, etc.).

![Skill Dashboard preview](public/preview.png)

## Features
- **Global & Project Scopes**: View skills installed globally vs. tied to the current project.
- **Smart Functional Grouping**: Automatically clusters your skills into functional categories (Design & UI, Code & Dev, Workflow, etc.) based on their descriptions.
- **Rich Markdown Previews**: Quickly glance at `SKILL.md` summaries without leaving the page.
- **Dark/Light Mode**: Polished interface with Fira Code typography and dark mode support.
- **Sorting & Filtering**: Find the exact skill you need by sorting by installation date or filtering by compatible agents.

## Installation

Install it globally so you can launch it from inside any project directory:

```bash
npm install -g @j7supreme/skill-dashboard
```

After install, launch it with:

```bash
skill-dashboard
```

## Requirements

- Node.js 18 or newer
- `npx` available on your `PATH`
- The `skills` CLI must be runnable through `npx -y skills ...`

## Usage

Navigate to any directory and run `skill-dashboard`.

It starts a local server on port `3847`, opens your default browser, and reads your installed skills through the standard `npx skills ls` command family.

## Translation Setup

By default, skill details stay in the original language. To enable Simplified Chinese translation with Zhipu GLM-4-Flash, either export environment variables or create a local `.env` file:

```bash
export SKILL_DASH_TRANSLATOR_PROVIDER=zhipu
export ZHIPU_API_KEY=your_zhipu_api_key
export ZHIPU_MODEL=glm-4-flash-250414
```

Optional settings:

```bash
export ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

`.env` example:

```env
SKILL_DASH_TRANSLATOR_PROVIDER=zhipu
ZHIPU_API_KEY=your_zhipu_api_key
ZHIPU_MODEL=glm-4-flash-250414
```

Notes:
- If `SKILL_DASH_TRANSLATOR_PROVIDER` is unset, the dashboard falls back to the original English content.
- If Zhipu translation fails or times out, the dashboard also falls back to the original content.
- `SKILL_DASH_TRANSLATOR_PROVIDER=google` is still supported, but it is no longer the default.

## Tech Stack
- Frontend: Vanilla JS, Vanilla CSS, HTML5
- Backend: Node.js, Express
- Runtime opens the browser with the `open` package

## License
MIT
