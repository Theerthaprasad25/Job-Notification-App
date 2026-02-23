# Job Notification App — Design System

Premium SaaS design system. Calm, intentional, coherent, confident. B2C product quality.

## Philosophy

- **No** gradients, glassmorphism, neon colors, or animation noise
- **Yes** clear hierarchy, generous spacing, consistent components

## Usage

Link the single entry file in your app:

```html
<link rel="stylesheet" href="design-system/index.css" />
```

Or in JS/CSS:

```css
@import "design-system/index.css";
```

## Structure

| File | Purpose |
|------|--------|
| `tokens.css` | Colors, typography, spacing scale, radius, transitions |
| `base.css` | Reset, body, headings, focus, selection |
| `layout.css` | Page shell, top bar, context header, workspace, panel, proof footer |
| `components.css` | Buttons, badges, cards, inputs, copy box, error/empty states |
| `index.css` | Fonts + imports all of the above |

## Global layout

Every page must follow:

1. **Top Bar** — Left: app name. Center: Step X / Y. Right: status badge (Not Started / In Progress / Shipped)
2. **Context Header** — Large serif headline + one-line subtext. No hype.
3. **Main** — Primary workspace (70%) + secondary panel (30%)
4. **Proof Footer** — Checklist: UI Built, Logic Working, Test Passed, Deployed

## Tokens

- **Spacing:** Use only `8px`, `16px`, `24px`, `40px`, `64px` (vars: `--space-1` … `--space-5`)
- **Colors:** Background `#F7F6F3`, text `#111111`, accent `#8B0000`, success (muted green), warning (muted amber). Max 4 in use.
- **Transitions:** 150–200ms, ease-in-out. No bounce.
- **Border radius:** One value everywhere (`--radius`).

## Components

- **Primary button:** Solid deep red (`#8B0000`)
- **Secondary button:** Outlined
- **Cards:** Subtle border, no drop shadows
- **Inputs:** Clean border, clear focus state (accent outline)
- **Errors:** Explain what went wrong and how to fix. Never blame the user.
- **Empty states:** Guide next action. Never blank screens.

## Demo

Open `index.html` at project root to see the full layout and components in place.
