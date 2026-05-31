# Design System Reference

## CSS variables (design tokens)

All tokens are defined in `app/globals.css` inside a `@theme {}` block (Tailwind v4 syntax). Use these variables in inline styles and `var()` calls.

### Colors

```css
--color-bg: #0A0A0A          /* page background */
--color-surface: #141414     /* card / panel background */
--color-surface-2: #1C1C1C   /* elevated surface (tooltips, popovers) */
--color-border: rgba(255, 255, 255, 0.08)  /* subtle dividers */
--color-accent: #FF6B35      /* primary action color — Fedi orange */
--color-accent-dim: rgba(255, 107, 53, 0.15)  /* accent tint for backgrounds */
--color-text: #F0EEE9        /* primary text */
--color-text-muted: #8A8880  /* secondary / supporting text */
--color-text-subtle: #4A4845 /* placeholder, disabled text */
```

### Typography

```css
--font-display: 'Bricolage Grotesque', system-ui, sans-serif  /* headings */
--font-body: 'DM Sans', system-ui, sans-serif                 /* body text */
--font-mono: 'JetBrains Mono', monospace                      /* code, addresses */
```

### Border radius

```css
--radius-sm: 4px    /* small chips, badges */
--radius-md: 8px    /* buttons, inputs, cards */
--radius-lg: 12px   /* large cards, modals */
```

## Using tokens in components

### Inline styles (when Tailwind class doesn't exist)

```tsx
<div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
```

### Tailwind arbitrary values

```tsx
<div className="bg-[var(--color-surface)] rounded-[var(--radius-md)]">
```

### Tailwind theme integration

The Tailwind theme maps `--color-*` tokens, so you can use shorthand:

```tsx
<div className="bg-surface text-text-muted border border-border">
```

## Components from @create-fedi-app/ui

> Note: UI components are added in the next scaffold phase. Check `packages/ui/src/index.ts` for the current export list.

## shadcn/ui conventions

This project uses shadcn/ui naming conventions for any added components:

- Components live in `components/ui/` (shadcn primitives) and `components/` (app-specific)
- File names are kebab-case: `components/ui/button.tsx`, `components/ui/card.tsx`
- Exports are named (not default): `export function Button(...)`
- Compose with `cn()` from `lib/utils.ts` for conditional classes

## Anti-slop rules for AI agents

These rules prevent the most common AI-generated UI mistakes in this codebase. Follow them strictly.

1. **Use design tokens, not hardcoded hex.** Never write `color: '#FF6B35'` — write `color: 'var(--color-accent)'`. Never write `background: '#141414'` — write `background: 'var(--color-surface)'`. The only exception is truly one-off values with no token equivalent.

2. **Never invent new colors.** If a color doesn't exist as a token, use the closest existing token or ask. Do not introduce new hex values, `hsl()`, `rgb()`, or opacity tricks that approximate an existing token.

3. **Respect the radius scale.** Use `--radius-sm`, `--radius-md`, or `--radius-lg`. Do not use arbitrary values like `rounded-2xl`, `rounded-full` on rectangles, or `border-radius: 16px`. Avatars and circular elements may use `rounded-full`.

4. **Never add box shadows.** The design system is shadowless. Do not add `shadow-*` classes or `box-shadow` styles. Use borders with `--color-border` for separation.

5. **Match the font stack.** Headings use `--font-display`. Body copy uses `--font-body` (set on `html`, inherited). Code, addresses, keys, and amounts use `--font-mono`. Do not mix them or introduce new fonts.

6. **Don't add color to text for decoration.** Color communicates state: `--color-accent` means "interactive/active", `--color-text-muted` means "supporting info", `--color-text-subtle` means "disabled/placeholder". Don't use accent color on static descriptive text.

7. **Minimum touch target is 44×44px.** Any interactive element (button, link, toggle) must have at least `min-h-[44px] min-w-[44px]` or equivalent padding. Never make a button that's 24×24.

8. **Loading states must show something.** When `isPaying`, `isLoading`, or `isConnecting` is true, the button/area must visibly change — spinner, opacity reduction, or label change. Never leave the UI frozen without feedback.

9. **Errors must surface to the user.** When `paymentError`, `signError`, or any error state is non-null, show the message. Do not silently swallow errors with empty `catch {}` blocks or conditional rendering that hides the error element.

10. **No placeholder text in production UI.** Don't generate components with "Lorem ipsum", "TODO", "Sample text", or generic copy. Write real copy, or use a `{{PLACEHOLDER}}` template variable that the dev must fill in.
