# LINCD Styling & Theme System

## Overview

The LINCD theme system is built on **Tailwind CSS v4** with a three-layer architecture that provides flexibility for different user types while maintaining consistency and reusability across the ecosystem.

## Three-Layer Architecture

1. **Tailwind Core** → Base CSS variables and utilities (`--color-*`, `--shadow-*`, `--radius-*`, etc.)
2. **LINCD Defaults** → Semantic variables and component utilities (`--bg-card`, `--spacing-modal`, `card-base`, etc.)
3. **App Theme** → App-specific brand colors and customizations

This architecture allows components to be truly reusable while giving each app complete control over its visual identity.

---

<!-- See CN-specific personas in docs/cn-components-and-styling.md -->

## Architecture & Integration

### Tailwind v4 CSS-First Configuration

LINCD uses Tailwind v4's new CSS-first approach. Theme configuration happens directly in CSS files using the `@theme` directive:

```css
@theme {
  --color-primary-500: oklch(68% 0.1 250);
  --shadow-card: var(--shadow-md);
  --radius-modal: var(--radius-2xl);
}
```

**What this generates:**
- Color utilities: `bg-primary-500`, `text-primary-500`, `border-primary-500`, etc.
- Shadow utilities: `shadow-card`
- Radius utilities: `rounded-modal`

### LINCD's Semantic Variable Layer

While Tailwind provides low-level variables, LINCD adds semantic meaning:

**In `lincd/theme-defaults.css`:**

```css
:root {
  /* Semantic backgrounds - describe WHAT, not HOW */
  --bg-page: var(--color-gray-50);
  --bg-section: var(--color-gray-100);
  --bg-card: var(--color-white);
  --bg-modal: var(--color-white);
  
  /* Semantic spacing - per component type */
  --spacing-card: calc(var(--spacing) * 4);
  --spacing-modal: calc(var(--spacing) * 6);
  --spacing-element-x: calc(var(--spacing) * 4);
  --spacing-element-y: calc(var(--spacing) * 2);
  
  /* Z-index layers */
  --z-surface: 10;
  --z-popover: 30;
  --z-overlay: 40;
  --z-modal: 50;
  --z-tooltip: 100;
}
```

These are then exposed as Tailwind utilities using `@utility`:

```css
@utility bg-card {
  background-color: var(--bg-card);
}

@utility p-card {
  padding: var(--spacing-card);
}

@utility z-modal {
  z-index: var(--z-modal);
}
```

### Component Base Utilities

LINCD provides component "mixins" in `lincd/utilities.css` that combine multiple properties:

```css
@utility card-base {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-card);
}

@utility modal-base {
  background: var(--bg-modal);
  border-radius: var(--radius-modal);
  padding: var(--spacing-modal);
  box-shadow: var(--shadow-modal);
  z-index: var(--z-modal);
}
```

These can be used with `@apply` in CSS Modules (see Component Creators section).

---

## For Component Creators (Package Development)

### Using Component Utilities

Import utilities with `@reference` to use them with `@apply`:

```css
/* MyCard.module.css */
@reference "lincd/utilities.css";

.card {
  @apply card-base;
  /* Additional custom styles */
  border: 1px solid var(--color-gray-200);
}
```

**What `card-base` provides:**
- `background: var(--bg-card)`
- `border-radius: var(--radius-card)`
- `box-shadow: var(--shadow-card)`
- `padding: var(--spacing-card)`

### Using CSS Variables Directly

You can also use LINCD's semantic variables directly:

```css
/* MyModal.module.css */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-modal);
  border-radius: var(--radius-modal);
  padding: var(--spacing-modal);
  box-shadow: var(--shadow-modal);
  z-index: var(--z-modal);
}
```

### Mixing Utilities and Custom Styles

```css
@reference "lincd/utilities.css";

.popover {
  @apply popover-base;
  /* Override specific properties */
  max-width: 300px;
  animation: fadeIn 0.2s ease-out;
}

.popoverArrow {
  /* Use variables for consistency */
  background: var(--bg-popover);
  border-radius: var(--radius-sm);
}
```

### Component-Specific Variables (Optional Pattern)

For frequently reused components that need customization, you can define component-specific variables with fallbacks:

```css
.customCard {
  background: var(--my-card-bg, var(--bg-card));
  border-radius: var(--my-card-radius, var(--radius-card));
  padding: var(--my-card-padding, var(--spacing-card));
}
```

Apps can then override these in their theme:

```css
/* App theme.css */
:root {
  --my-card-bg: var(--color-primary-50);
  --my-card-radius: var(--radius-xl);
}
```

**Note:** This pattern is available but not emphasized. Most components should use LINCD's semantic variables directly. Component-specific variables are only needed for highly customizable components used across many apps.

---

## For Developers Building Apps

### Using Tailwind Utilities Directly

While CN generates CSS classes, developers can use Tailwind utility classes directly in their code:

```tsx
export function DeveloperCard() {
  return (
    <div className="bg-card p-card rounded-card shadow-card border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">Title</h2>
      <p className="text-gray-600">Description</p>
    </div>
  );
}
```

### Override Levels

There are four practical places to customize styling, from broadest to most specific:

1. **Design tokens + semantics (Tailwind `@theme` + `:root`)**
   - Define tokens (`--color-*`, `--radius-*`, `--shadow-*`) and semantic variables (`--bg-section`, `--spacing-card`, `--z-modal`).
   - Tokens auto-generate utilities; semantics are plain CSS variables you control.
   ```css
   @theme {
     --color-primary-500: var(--color-teal-500);
     --radius-card: var(--radius-xl);
     --shadow-modal: var(--shadow-2xl);
   }
   :root {
     --bg-section: var(--color-primary-50);
     --spacing-card: calc(var(--spacing) * 5);
   }
   ```

2. **Component styles (ownership-aware)**
   - If you own the component: edit its CSS Module directly (use `@reference` + `@apply` or variables).
   - If you do NOT own it: create a wrapper component and override styles there.
   ```css
   /* Own the component */
   @reference "lincd/utilities.css";
   .card { @apply card-base; }
   .card--emphasis { box-shadow: var(--shadow-lg); }
   
   /* Wrapper component overrides */
   .wrappedCard :global(.card) { background: var(--color-white); }
   ```

3. **Instance-level overrides**
   - Pass a class for a specific usage. Prefer variables over hard-coded values.
   ```tsx
   import styles from './Some.module.css';
   <Card className={styles.card} />
   ```

4. **Inline styles (last resort)**
   - Highest specificity; use sparingly for dynamic one-offs.

Note: Component-specific variables are possible (e.g., `--my-card-radius` with fallbacks) but are intentionally de-emphasized to avoid fragmentation. Prefer global tokens and semantic variables.

### Checking Out from CN

Developers can take over a CN-generated codebase and continue development:
- All code is readable TypeScript/CSS
- CSS uses standard variables and classes
- Tailwind utilities are available for new code
- Can refactor CN-generated CSS to use Tailwind utilities if desired

---

## Theme Override Hierarchy

Understanding the cascade (later definitions override earlier ones):

1. **Tailwind Core Defaults** → `--color-gray-500`, `--shadow-md`, etc.
2. **LINCD Theme Defaults** (`lincd/theme-defaults.css`) → Default primary color, semantic variables
3. **App Theme** (`src/scss/theme.css`) → App-specific brand colors and customizations
4. **Component CSS Modules** → Component-specific styles
5. **CN-Generated Instance Classes** → Individual instance overrides
6. **Inline Styles** → Ultimate override (use sparingly)

### Example of Cascade in Action

```css
/* 1. Tailwind Core */
--color-sky-500: oklch(67% 0.15 235);

/* 2. LINCD Defaults */
--color-primary-500: var(--color-sky-500);
--bg-card: var(--color-white);
--spacing-card: calc(var(--spacing) * 4);

/* 3. App Theme */
--color-primary-500: var(--color-teal-500); /* Override primary */
--bg-card: var(--color-gray-50); /* Tint all cards */

/* 4. Component Module */
.productCard {
  background: var(--bg-card); /* Uses overridden value */
  padding: var(--spacing-card);
}

/* 5. Instance Override (CN-generated) */
.heroCard {
  composes: productCard;
  background: var(--color-white); /* This specific instance is white */
  padding: calc(var(--spacing-card) * 1.5); /* Larger padding */
}
```

---

## Practical Examples

### Example 1: Creating a Card Component

**MyCard.module.css:**
```css
@reference "lincd/utilities.css";

.card {
  @apply card-base;
  border: 1px solid var(--color-gray-200);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.cardTitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.cardContent {
  color: var(--color-gray-600);
}
```

**MyCard.tsx:**
```tsx
import styles from './MyCard.module.css';

export function MyCard({ title, children }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>{children}</div>
    </div>
  );
}
```

### Example 2: Overriding Primary Color in App Theme

**src/scss/theme.css:**
```css
@import 'lincd/theme-defaults.css';
@import 'lincd/utilities.css';

@theme {
  /* Set app brand color */
  --color-primary-50: var(--color-teal-50);
  --color-primary-100: var(--color-teal-100);
  --color-primary-200: var(--color-teal-200);
  --color-primary-300: var(--color-teal-300);
  --color-primary-400: var(--color-teal-400);
  --color-primary-500: var(--color-teal-500);
  --color-primary-600: var(--color-teal-600);
  --color-primary-700: var(--color-teal-700);
  --color-primary-800: var(--color-teal-800);
  --color-primary-900: var(--color-teal-900);
}

:root {
  /* Optional: Override semantic variables */
  --bg-section: var(--color-primary-50);
}
```

Now all components using `bg-primary-500` or `--bg-section` will reflect these changes.

### Example 4: Component with Fallback Pattern

**CustomButton.module.css:**
```css
.button {
  /* Component-specific variables with semantic fallbacks */
  background: var(--button-bg, var(--color-primary-500));
  color: var(--button-text, var(--color-white));
  padding: var(--button-padding, var(--spacing-element-y) var(--spacing-element-x));
  border-radius: var(--button-radius, var(--radius-element));
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover {
  background: var(--button-bg-hover, var(--color-primary-600));
}
```

Apps can customize this button globally:
```css
:root {
  --button-bg: var(--color-purple-500);
  --button-radius: var(--radius-full);
}
```
