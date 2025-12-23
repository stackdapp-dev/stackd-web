# Stack'd Liquid Glass Design Guidelines

> **Version:** 2.1 | **Last Updated:** December 2024  
> **Framework:** React + Tailwind CSS v4  
> **Design Style:** Liquid Glass (Glassmorphism)  
> **Typography:** SF Pro Display (Apple Design System)

---

## Overview

Stack'd Liquid Glass design combines the brand's core amber accent color (#ffa02d) with modern glassmorphism aesthetics, featuring frosted glass effects, backdrop blur, and semi-transparent layers over dark gradients.

---

## Color Palette

### Core Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `black` | App background |
| `--foreground` | `white` | Primary text |
| `--primary` | `#ffa02d` | Brand accent (amber) |
| `--primary-foreground` | `black` | Text on primary |
| `--card` | `#333333` | Card backgrounds |
| `--card-foreground` | `white` | Card text |
| `--muted-foreground` | `oklch(0.556 0 0)` | Secondary text |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Error states |
| `--border` | `rgba(255, 255, 255, 0.1)` | Glass borders |
| `--input-background` | `rgba(255, 255, 255, 0.05)` | Input backgrounds |

### Gradient Backgrounds
```css
/* Primary screen background */
bg-gradient-to-b from-slate-950 via-slate-900 to-black

/* Accent card gradients */
bg-gradient-to-br from-[#ffa02d]/20 via-purple-500/10 to-black/40
```

### Glass Effect Colors
```css
/* Default glass */
bg-white/5 border-white/10

/* Dark glass */
bg-black/20 border-white/5

/* Accent glass */
bg-[#ffa02d]/10 border-[#ffa02d]/20

/* Success glass */
bg-emerald-900/20 border-emerald-500/20
```

---

## Glass Card Component

### Variants

```tsx
// Default - Subtle light glass
<GlassCard variant="default">
  backdrop-blur-xl bg-white/5 border-white/10
</GlassCard>

// Dark - Darker glass for contrast
<GlassCard variant="dark">
  backdrop-blur-xl bg-black/20 border-white/5
</GlassCard>

// Accent - Amber-tinted glass
<GlassCard variant="accent">
  backdrop-blur-xl bg-[#ffa02d]/10 border-[#ffa02d]/20
</GlassCard>

// Green - Success/earning glass
<GlassCard variant="green">
  backdrop-blur-xl bg-emerald-900/20 border-emerald-500/20
</GlassCard>
```

### Glass Card Properties
- **Border Radius:** `rounded-2xl` (1rem)
- **Backdrop Blur:** `backdrop-blur-xl` (24px)
- **Border:** 1px solid with 10-20% opacity
- **Background:** Semi-transparent with 5-20% opacity
- **Padding:** Default `p-4` or `p-6`

---

## Typography

### Font
- **Family:** SF Pro Display (Apple Design System)
- **Variable:** `--font-sf-pro`
- **Fallback:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Features:** Clean, modern sans-serif with excellent readability at all sizes
- **Font Smoothing:** Antialiased for crisp rendering

### Font Import
```css
/* fonts.css */
@import url('https://fonts.cdnfonts.com/css/sf-pro-display');

:root {
  --font-sf-pro: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
                 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
                 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}
```

### Text Hierarchy
```css
/* Headings */
h1: text-2xl to text-4xl, text-white, font-weight: 500
h2: text-xl, text-white, font-weight: 500
h3: text-sm to text-lg, text-white, font-weight: 500

/* Body Text */
Primary: text-white, font-weight: 400
Secondary: text-white/60 or text-white/40, font-weight: 400
Muted: text-white/40, font-weight: 400

/* Accent Text */
Primary accent: text-[#ffa02d], font-weight: 500
Success: text-emerald-400
Warning: text-amber-400
Error: text-rose-500

/* Buttons */
font-weight: 500 (font-medium)
```

### Font Weights
- **Regular (400):** Body text, descriptions, secondary content
- **Medium (500):** Headings, buttons, labels, emphasized content

---

## Glassmorphism Effects

### Backdrop Blur Levels
| Level | Class | Blur Amount | Usage |
|-------|-------|-------------|-------|
| Standard | `backdrop-blur-xl` | 24px | Cards, overlays |
| Strong | `backdrop-blur-2xl` | 40px | Navigation, modals |
| Subtle | `backdrop-blur-lg` | 16px | Hover states |

### Transparency Guidelines
- **Primary glass surfaces:** 5-10% opacity
- **Secondary glass surfaces:** 10-20% opacity
- **Accent glass surfaces:** 10-20% opacity
- **Navigation bars:** 40% black with strong blur

---

## Components

### Glass Buttons
```tsx
// Primary Button (Solid Amber with Gradient & Glow) - Main CTAs
className="relative bg-gradient-to-br from-[#ffa02d] to-[#ff8c00] text-black px-6 py-2.5 
           rounded-full hover:shadow-[0_0_20px_rgba(255,160,45,0.5)] hover:scale-105 
           transition-all duration-300 font-medium shadow-lg"

// Primary Action Button (Large with Overlay Effect) - Critical Actions
className="relative bg-gradient-to-br from-[#ffa02d] to-[#ff8c00] text-black py-3.5 
           rounded-2xl hover:shadow-[0_0_25px_rgba(255,160,45,0.6)] hover:scale-[1.02] 
           transition-all duration-300 font-medium shadow-lg group overflow-hidden"

// Secondary/Minor Button (Glass with Amber Border & Glow) - Deposit, Repay, etc.
className="relative backdrop-blur-xl bg-gradient-to-br from-[#ffa02d]/20 to-[#ff8c00]/10 
           border-2 border-[#ffa02d]/40 text-[#ffa02d] px-6 py-2.5 rounded-2xl 
           hover:border-[#ffa02d]/60 hover:bg-[#ffa02d]/30 
           hover:shadow-[0_0_20px_rgba(255,160,45,0.3)] hover:scale-[1.02] 
           transition-all duration-300 font-medium group overflow-hidden"

// Glass Ghost Button
className="rounded-full backdrop-blur-xl bg-white/5 border border-white/10 text-white px-4 py-2"

// Icon Button (Glass)
className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/5 border border-white/10"
```

#### Button Hover Overlays
```tsx
// Primary Button Overlay (white gradient on solid amber)
<button className="... group overflow-hidden">
  <span className="relative z-10">Button Text</span>
  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</button>

// Secondary/Minor Button Overlay (amber gradient on glass)
<button className="... group overflow-hidden">
  <span className="relative z-10">Button Text</span>
  <div className="absolute inset-0 bg-gradient-to-t from-[#ffa02d]/10 to-transparent 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</button>
```

#### Button Design Principles
- **Primary buttons:** Solid amber gradient (from-[#ffa02d] to-[#ff8c00]) with black text for high-impact CTAs
- **Ghost buttons:** Glass effect with white border and white text for secondary actions (Deposit, Repay, Borrow, filter toggles)
- **Button hierarchy:** Primary = solid amber, Ghost = glass with white border
- **Border weight:** Primary uses no border, Ghost uses `border border-white/10`
- **Border radius:** Small buttons use `rounded-full`, large buttons use `rounded-2xl`
- **Glow effects:** Apply shadow on hover using custom box shadows `shadow-[0_0_20px_rgba(255,160,45,0.5)]`
- **Scale animations:** Subtle scale on hover (`hover:scale-105` for small, `hover:scale-[1.02]` for large)
- **Smooth transitions:** Always use `duration-300` for professional feel
- **Background:** Ghost buttons use `backdrop-blur-xl bg-white/5`
- **Font weight:** Use `font-medium` for better readability on glass

#### Button Usage Guidelines

**Primary Buttons - Use for:**
- Active/selected filter states
- Solid CTAs that need maximum visual weight
- One primary action per screen section

**Ghost Buttons - Use for:**
- Action buttons (Deposit, Repay, Borrow, Withdraw)
- Filter toggles (inactive state)
- Multiple actions in a group
- Actions within cards or repeated elements

### Icon Containers
```tsx
// Default icon container
className="w-10 h-10 rounded-full bg-{color}-500/20 flex items-center justify-center"

// Available colors:
- bg-emerald-500/20 text-emerald-400
- bg-blue-500/20 text-blue-400
- bg-purple-500/20 text-purple-400
- bg-orange-500/20 text-orange-400
- bg-[#ffa02d]/20 text-[#ffa02d]
```

### Bottom Navigation
```tsx
// Container
className="fixed bottom-0 backdrop-blur-2xl bg-black/40 border-t border-white/10 px-6 py-3"

// Active state
className="text-[#ffa02d]"

// Inactive state
className="text-white/60"
```

### Liquid Glass Navigation Bar

The navigation bar uses an elevated liquid glass design with floating appearance:

```tsx
// Full Navigation Container Structure
<div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-sm w-full pb-safe">
  <div className="m-4 mb-6 backdrop-blur-2xl bg-black/30 border border-white/10 rounded-3xl px-6 py-4 shadow-2xl shadow-black/50">
    {/* Nav items here */}
  </div>
</div>
```

#### Navigation Glass Properties
- **Container:** `backdrop-blur-2xl` for strong glass effect
- **Background:** `bg-black/30` (30% opacity for depth)
- **Border:** `border-white/10` (subtle glass edge)
- **Border Radius:** `rounded-3xl` (24px for floating pill shape)
- **Shadow:** `shadow-2xl shadow-black/50` (elevated appearance)
- **Margin:** `m-4 mb-6` (floating 16px from edges, 24px from bottom)
- **Padding:** `px-6 py-4` (balanced spacing)
- **Safe Area:** `pb-safe` on container for iOS notch support

#### Navigation Item States

**Active State:**
```tsx
// Icon & text color
className="text-[#ffa02d]"

// Background glow (absolute positioned)
<div className="absolute -inset-3 bg-[#ffa02d]/10 rounded-2xl backdrop-blur-sm" />

// Icon glow effect
className="drop-shadow-[0_0_8px_rgba(255,160,45,0.5)]"

// Complete active button
<button className="flex flex-col items-center gap-1 transition-all relative text-[#ffa02d]">
  <div className="absolute -inset-3 bg-[#ffa02d]/10 rounded-2xl backdrop-blur-sm" />
  <Icon className="w-6 h-6 relative z-10 drop-shadow-[0_0_8px_rgba(255,160,45,0.5)]" />
  <span className="text-xs relative z-10">Label</span>
</button>
```

**Inactive State:**
```tsx
// Default color
className="text-white/60"

// Hover state
className="hover:text-white/80"

// Complete inactive button
<button className="flex flex-col items-center gap-1 transition-all relative text-white/60 hover:text-white/80">
  <Icon className="w-6 h-6 relative z-10" />
  <span className="text-xs relative z-10">Label</span>
</button>
```

#### Navigation Selection Design Principles

1. **Visual Hierarchy:**
   - Active items use brand amber (#ffa02d)
   - Inactive items use subtle white (60% opacity)
   - Hover increases to 80% opacity for feedback

2. **Glow Effects:**
   - Active icons get amber glow using drop-shadow
   - Background glow uses 10% opacity amber pill
   - Layered approach: background glow + icon glow

3. **Positioning:**
   - Active state glow uses `absolute -inset-3` for padding around icon
   - Content uses `relative z-10` to stay above glow
   - Rounded-2xl on glow maintains soft pill shape

4. **Transitions:**
   - All state changes use `transition-all` for smooth animations
   - Color, opacity, and shadow animate together
   - No jarring state switches

5. **Spacing:**
   - Icon to label gap: `gap-1` (4px)
   - Items distributed with `justify-around`
   - Icon size: `w-6 h-6` (24px)
   - Label size: `text-xs`

#### Navigation Layout Examples

**4-Item Navigation (Home, Earn, Card, Rewards):**
```tsx
const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'earn', icon: TrendingUp, label: 'Earn' },
  { id: 'card', icon: CreditCard, label: 'Card' },
  { id: 'rewards', icon: Sparkles, label: 'Rewards' },
];
```

**3-Item Navigation (Wallet, History, Menu):**
```tsx
const navItems = [
  { id: 'wallet', icon: Wallet, label: 'Wallet' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'menu', icon: Menu, label: 'Menu' },
];
```

#### Responsive Behavior
- **Mobile:** Full width with margins
- **Desktop:** Centered with `md:max-w-sm md:left-1/2 md:-translate-x-1/2`
- **Safe areas:** Uses `pb-safe` for iOS devices

### Progress Bars
```tsx
// Background track
className="w-full bg-white/5 rounded-full h-2"

// Progress fill
className="bg-gradient-to-r from-[#ffa02d] to-purple-500 h-2 rounded-full"
```

### Toggle Switches
```tsx
className="w-11 h-6 bg-white/10 rounded-full 
           peer-checked:bg-[#ffa02d] 
           after:bg-white after:rounded-full after:h-5 after:w-5"
```

---

## Layout

### Screen Structure
```tsx
<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 pb-24">
  {/* Content with bottom navigation spacing */}
</div>
```

### Container Specifications
- **Mobile:** Full width with `p-4` padding
- **Desktop:** `md:max-w-sm md:mx-auto` centered
- **Bottom padding:** `pb-24` (accounts for navigation)
- **Overflow:** `overflow-y-auto` on content

### Header Section
```tsx
<div className="pt-12 pb-6">
  <h1 className="text-white text-2xl mb-8">Page Title</h1>
  {/* Header content */}
</div>
```

---

## Spacing & Sizing

### Standard Spacing
| Context | Value | Usage |
|---------|-------|-------|
| Screen padding | `p-4` | Mobile screens |
| Card padding | `p-4` or `p-6` | Glass cards |
| Gap between items | `gap-3` | List items |
| Section gap | `gap-6` or `mb-6` | Major sections |
| Header padding | `pt-12 pb-6` | Screen headers |

### Border Radius
| Element | Class | Size |
|---------|-------|------|
| Glass cards | `rounded-2xl` | 16px |
| Buttons | `rounded-full` | 9999px |
| Icons | `rounded-full` | 9999px |
| Small elements | `rounded-lg` | 8px |

---

## Status & Accent Colors

### Color System
```css
/* Primary Brand */
Amber: #ffa02d (primary accent)

/* Status Colors */
Success/Positive: text-emerald-400, text-emerald-500
Error/Negative: text-rose-500, text-red-400
Warning: text-amber-400
Info: text-blue-400, text-blue-500

/* Tuyos Points */
Purple dot: bg-purple-500
```

### Badge Components
```tsx
// Active badge
className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"

// Inactive badge
className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
```

---

## Data Visualization

### Mini Charts
```tsx
// Bar chart style
<div className="h-8 flex items-end gap-0.5">
  {data.map((value, i) => (
    <div 
      className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-500/20 rounded-t"
      style={{ height: `${value}%` }}
    />
  ))}
</div>
```

### Stat Cards
```tsx
// Balance card
<GlassCard variant="dark" className="p-4">
  <p className="text-white/60 text-xs mb-1">LABEL</p>
  <p className="text-white text-2xl">$1,234<span className="text-lg">.56</span></p>
</GlassCard>

// With indicator dot
<p className="text-white text-2xl flex items-center gap-2">
  $1,234
  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
</p>
```

---

## Icons

### Icon Library
- **Library:** Lucide React
- **Standard size:** `w-6 h-6` (24px)
- **Small size:** `w-5 h-5` (20px)
- **Button icons:** `w-4 h-4` (16px)

### Common Icons
```tsx
import { 
  Home, TrendingUp, CreditCard, Sparkles,
  Search, MoreVertical, ArrowUpRight,
  Lock, Settings, Gift, Trophy, Star
} from 'lucide-react';
```

---

## Animation & Transitions

### Standard Transitions
```css
/* Color transitions */
transition-colors

/* All properties */
transition-all

/* Hover states */
hover:bg-[#ffa02d]/90
hover:text-white
```

### Smooth Scrolling
```css
overflow-y-auto
```

---

## Screen Examples

### Home Screen Features
- Total balance display
- Quick stats (Cash, Holdings)
- Holdings list with mini charts
- Transaction history
- Glass card containers

### Earn Screen Features
- Total balance card
- Active strategies counter
- Current APY with trend indicator
- Projected daily earnings
- Currency list (USD, EUR, ETH)
- Multi-stat display per currency

### Card Screen Features
- Virtual card display with glassmorphism
- Available balance
- Freeze toggle with glass switch
- Card settings
- Recent transactions

### Rewards Screen Features
- Points balance with animation
- Level progress bar
- Available rewards grid
- Recent activity log
- Redeem buttons

---

## Best Practices

### Do's ✓
- Use backdrop-blur on all glass surfaces
- Layer transparency for depth (5-20% opacity)
- Combine gradients with glass effects
- Use white borders at 10-20% opacity
- Maintain amber (#ffa02d) for primary CTAs
- Use rounded-full for buttons and icons
- Add subtle glows with colored shadows

### Don'ts ✗
- Don't use solid backgrounds on cards
- Avoid harsh borders (keep them subtle)
- Don't overuse blur (stick to 3 levels max)
- Avoid mixing too many accent colors
- Don't place low-contrast text on glass
- Avoid cluttered layouts

---

## File Structure

```
src/
├── app/
│   ├── App.tsx                    # Main app container
│   └── components/
│       ├── GlassCard.tsx          # Reusable glass card component
│       ├── BottomNav.tsx          # Navigation with glass effect
│       ├── HomeScreen.tsx         # Home screen
│       ├── EarnScreen.tsx         # Earn screen
│       ├── CardScreen.tsx         # Card screen
│       └── RewardsScreen.tsx      # Rewards screen
├── styles/
│   ├── theme.css                  # CSS variables
│   └── fonts.css                  # Font imports
```

---

## Accessibility

### Contrast Guidelines
- Ensure white text on glass has sufficient background darkness
- Minimum contrast ratio: 4.5:1 for normal text
- Use darker glass variants for better readability
- Test glass overlays on various backgrounds

### Interactive Elements
- Maintain focus states with rings: `focus-visible:ring-2 focus-visible:ring-[#ffa02d]`
- Ensure touch targets are minimum 44x44px
- Provide clear hover states
- Use semantic HTML elements

---

## Technical Implementation

### CSS Variables (theme.css)
```css
:root {
  --background: black;
  --foreground: white;
  --primary: #ffa02d;
  --card: #333333;
  --border: rgba(255, 255, 255, 0.1);
  --radius: 0.625rem;
}
```

### Tailwind Utilities
```tsx
// Glass effect utility pattern
backdrop-blur-xl bg-{color}/{opacity} border border-{color}/{opacity}

// Example combinations
backdrop-blur-xl bg-white/5 border-white/10
backdrop-blur-2xl bg-black/40 border-white/10
```

---

## Version History

- **v2.1** - Added SF Pro Display typography (December 2024)
- **v2.0** - Added liquid glass design system (December 2024)
- **v1.0** - Initial Stack'd design guidelines (December 2024)

---

## Resources

- Figma Design File: [Link to design]
- Component Library: React + Tailwind CSS v4
- Icon Library: Lucide React
- Font: SF Pro Display (Apple Design System)