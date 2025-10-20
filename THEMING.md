# Theming Guide

This document explains the theming system for the Monisha Inventory Management App and how to properly use CSS variables for theme-aware styling.

## Overview

The app supports robust dark/light theme toggling using CSS variables and the `data-theme` attribute. All components must use these variables to ensure proper theme switching without leftover white panels or mis-colored elements.

## Architecture

### 1. Theme Selectors

The theme system uses `html[data-theme="dark"]` and `html[data-theme="light"]` (via `:root`) as selectors. This is the **single source of truth** for theming.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

html[data-theme="dark"] {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### 2. Theme Management (Web)

The `src/utils/theme.js` utility provides:

- `getInitialTheme()` - Gets initial theme from localStorage or system preference
- `applyTheme(theme)` - Applies theme to document (sets `data-theme` and class)
- `toggleTheme()` - Toggles between dark and light
- `getCurrentTheme()` - Gets current theme
- `syncWithSystemTheme()` - Syncs with OS theme preference

**Usage:**

```javascript
import { applyTheme, toggleTheme, getInitialTheme } from './utils/theme';

// Apply theme at app bootstrap
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

// Toggle theme
toggleTheme();
```

### 3. CSS Variables

All color variables use HSL format without the `hsl()` wrapper, allowing opacity modifications:

```css
/* Variable definition */
--primary: 199 89% 48%;

/* Usage with opacity */
background: hsl(var(--primary) / 0.5);
```

## Core CSS Variables

### Color Variables

| Variable | Purpose | Light Value | Dark Value |
|----------|---------|-------------|------------|
| `--background` | Page background | `0 0% 100%` | `0 0% 3.9%` |
| `--foreground` | Primary text | `222.2 84% 4.9%` | `0 0% 98%` |
| `--card` | Card backgrounds | `0 0% 100%` | `0 0% 3.9%` |
| `--card-foreground` | Card text | `222.2 84% 4.9%` | `0 0% 98%` |
| `--primary` | Primary brand color | `199 89% 48%` | `0 72.2% 50.6%` |
| `--primary-foreground` | Text on primary | `210 40% 98%` | `0 85.7% 97.3%` |
| `--muted` | Muted backgrounds | `210 40% 96.1%` | `0 0% 14.9%` |
| `--muted-foreground` | Muted text | `215 20% 35%` | `0 0% 63.9%` |
| `--border` | Border color | `214 30% 80%` | `0 0% 14.9%` |
| `--input` | Input backgrounds | `214 30% 80%` | `0 0% 14.9%` |
| `--ring` | Focus ring color | `199 89% 48%` | `0 72.2% 50.6%` |
| `--destructive` | Error/danger color | `0 84.2% 60.2%` | `0 62.8% 30.6%` |

### Shadow Variables

| Variable | Purpose | Light | Dark |
|----------|---------|-------|------|
| `--shadow-elevation-1` | Subtle shadow | Light gray | Darker black |
| `--shadow-elevation-2` | Medium shadow | Medium gray | Dark black |
| `--shadow-elevation-3` | Prominent shadow | Stronger gray | Very dark |
| `--shadow-elevation-4` | Maximum shadow | Darkest gray | Almost black |

### Chart Colors

Chart colors (`--chart-1` through `--chart-5`) are automatically adjusted for better visibility in dark mode.

## Utility Classes

Six essential utility classes for theme-aware styling:

### 1. `.bg-base`
Background using theme background color.
```html
<div className="bg-base">...</div>
```

### 2. `.surface`
Card/surface background with proper foreground text.
```html
<div className="surface">Card content</div>
```

### 3. `.text-base`
Primary text color.
```html
<p className="text-base">Main text</p>
```

### 4. `.text-muted`
Secondary/muted text color.
```html
<span className="text-muted">Secondary info</span>
```

### 5. `.border-base`
Theme-aware border color.
```html
<div className="border border-base">...</div>
```

### 6. `.icon`
Icon color that respects theme.
```html
<svg className="icon">...</svg>
```

## Adding New Components

When creating new components, follow these rules:

### ✅ DO:

```jsx
// Use CSS variables
<div style={{ background: 'hsl(var(--card))' }}>

// Use Tailwind theme colors
<div className="bg-card text-card-foreground">

// Use utility classes
<div className="surface border-base">

// For charts, read CSS variables at runtime
const root = getComputedStyle(document.documentElement);
const chartColor = root.getPropertyValue('--chart-1').trim();
```

### ❌ DON'T:

```jsx
// DON'T use hardcoded hex colors
<div style={{ background: '#ffffff' }}>

// DON'T use hardcoded RGB
<div style={{ color: 'rgb(255, 255, 255)' }}>

// DON'T use fixed HSL without var()
<div style={{ background: 'hsl(0, 0%, 100%)' }}>

// DON'T use inline styles for colors when avoidable
<div style={{ backgroundColor: 'white' }}>
```

## SVG and Icons

### Make SVGs theme-aware:

```jsx
// Use currentColor
<svg fill="currentColor" stroke="currentColor">
  <path d="..." />
</svg>

// Apply icon class
<svg className="icon">
  <path d="..." />
</svg>
```

### For icon components:

```jsx
import { Icon } from 'lucide-react';

<Icon className="text-foreground" />
```

## Form Elements

All inputs automatically respect theme via base CSS:

```css
input, textarea, select {
  background: hsl(var(--input));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}

input:focus, textarea:focus, select:focus {
  outline: 2px solid hsl(var(--ring));
}
```

## Chart Integration

For chart libraries that require color config:

```javascript
import { useEffect, useState } from 'react';

function MyChart() {
  const [chartColors, setChartColors] = useState({});

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setChartColors({
      primary: `hsl(${root.getPropertyValue('--chart-1').trim()})`,
      secondary: `hsl(${root.getPropertyValue('--chart-2').trim()})`,
      // ...
    });
  }, []);

  return <Chart colors={chartColors} />;
}
```

## Third-Party Components

If a third-party component only accepts inline props:

1. **Preferred:** Wrap it in a theme-aware container:
```jsx
<div className="surface">
  <ThirdPartyComponent />
</div>
```

2. **Alternative:** Override with CSS using `!important` (document why):
```css
.third-party-component {
  background: hsl(var(--card)) !important; /* Third-party doesn't support theming */
}
```

## Testing Theme Implementation

### Manual Testing:
1. Toggle theme using UI control
2. Check all screens for:
   - Proper background colors
   - Readable text contrast
   - No white/black panels that don't change
   - Icons that adapt to theme
   - Borders that are visible in both themes

### Automated Testing:
Run the theme-check script:

```bash
cd web
node scripts/theme-check.js
```

This scans for:
- Hardcoded hex colors
- RGB/RGBA values not using variables
- HSL values not using `var()`
- Inline styles with color properties

## Accessibility

### Contrast Requirements:
- Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Test with browser DevTools contrast checker
- Muted text should still meet minimum contrast ratios

### Focus Indicators:
- Focus rings use `--ring` variable
- Always visible in both themes
- 2px outline with 2px offset

## Mobile App

The mobile app (`mobile/global.css`) uses the same variable structure. React Native components should use the color constants which are generated from CSS variables.

## Troubleshooting

### Issue: Theme not applying
- Verify `data-theme` attribute is set on `<html>`
- Check if `applyTheme()` was called at bootstrap
- Ensure CSS variables are defined in both `:root` and `html[data-theme="dark"]`

### Issue: Component shows wrong color
- Check if component uses hardcoded colors
- Verify CSS variable usage: `hsl(var(--variable))`
- For Tailwind: use theme colors like `bg-card`, not `bg-white`

### Issue: Shadows not changing
- Ensure using `--shadow-elevation-*` variables
- Not hardcoded `rgba()` values

### Issue: Charts not updating
- Charts may need to re-read CSS variables on theme change
- Implement theme listener to update chart config

## Best Practices

1. **Always use CSS variables** for any color-related styling
2. **Use utility classes** when possible (`.surface`, `.text-base`, etc.)
3. **Test both themes** before committing component changes
4. **Document exceptions** if hardcoded colors are necessary
5. **Use semantic colors** (e.g., `--destructive` for errors, not red)
6. **Leverage Tailwind** theme colors which already use variables
7. **Run theme-check** regularly during development

## Example: Creating a Theme-Aware Card

```jsx
// ❌ Bad - Hardcoded colors
function BadCard() {
  return (
    <div style={{ 
      background: '#ffffff',
      color: '#000000',
      border: '1px solid #e5e5e5',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      Content
    </div>
  );
}

// ✅ Good - Theme-aware
function GoodCard() {
  return (
    <div className="surface border-base rounded-lg p-6 shadow-elevation-2">
      Content
    </div>
  );
}

// ✅ Also Good - Using CSS variables
function AlsoGoodCard() {
  return (
    <div style={{
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
      boxShadow: 'var(--shadow-elevation-2)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem'
    }}>
      Content
    </div>
  );
}
```

## Summary

The theming system ensures:
- ✅ Consistent appearance across all screens
- ✅ Smooth dark/light mode transitions
- ✅ No leftover white panels or mis-colored elements
- ✅ Accessible contrast ratios in both themes
- ✅ Easy maintenance and updates
- ✅ Tailwind compatibility via both `data-theme` and class

When in doubt: **Use CSS variables, not hardcoded colors.**
