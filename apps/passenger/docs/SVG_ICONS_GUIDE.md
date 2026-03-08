# SVG Icons Implementation Guide

## Status: ⚠️ SVG Icons Created - PNG Conversion Needed

All 26 professional SVG icons have been created in `apps/passenger/assets/icons/` as source files.

**Action Required:** Convert SVG files to PNG format (or use PNG versions) for immediate compatibility with the existing codebase.

## Important: SVG Usage in React Native

SVG files in React Native are imported as **React Components**, not image sources like PNG files. This means you cannot use them directly with `<Image source={icons.xxx} />`.

### Current State

- ✅ All 26 SVG files created as source files
- ✅ `react-native-svg` and `react-native-svg-transformer` installed
- ✅ Metro config supports SVG imports
- ✅ TypeScript declarations configured
- ⚠️ **PNG versions needed for immediate use with existing `<Image>` components**
- 📝 Constants still import `.png` files (needs actual PNG files in assets/icons/)

### Two Options to Complete Migration

#### Option 1: Use SVG Icons as Components (Recommended)

**Advantages:**
- True vector graphics that scale perfectly
- Can change color via `fill` or `stroke` props
- Smaller file size
- Better performance

**Example Usage:**

```tsx
import { icons } from '@/constants';

// Instead of:
<Image source={icons.checkmark} className="w-5 h-5" tintColor={COLORS.primary} />

// Use:
<icons.checkmark width={20} height={20} fill={COLORS.primary} />
```

**Files to Update:** ~50+ components using `<Image source={icons.xxx} />`

#### Option 2: Revert to PNG Icons (Quick Fix)

**If you want to keep using `<Image>` components:**

1. Revert `apps/passenger/constants/index.ts` to import `.png` files:
   ```ts
   import checkmark from "@/assets/icons/check.png";
   ```

2. Convert SVG files to PNG using online tools or design software
3. Place PNG files in `apps/passenger/assets/icons/`

## How to Use SVG Icons as Components

### Basic Usage

```tsx
import { icons } from '@/constants';

<icons.checkmark 
  width={24} 
  height={24} 
  fill="#10b981"  // or stroke="#10b981" depending on icon
/>
```

### With NativeWind/Tailwind

```tsx
<View className="w-6 h-6">
  <icons.checkmark width="100%" height="100%" fill="currentColor" />
</View>
```

### Dynamic Color from Theme

```tsx
import { COLORS } from '@/constants/theme';

<icons.star 
  width={20} 
  height={20} 
  fill={COLORS.primary}
/>
```

## Icon Reference

All icons are located in `apps/passenger/assets/icons/`:

- `arrow-down.svg`
- `arrow-up.svg`
- `back-arrow.svg`
- `chat.svg`
- `check.svg`
- `close.svg`
- `dollar.svg`
- `email.svg`
- `eyecross.svg`
- `google.svg`
- `home.svg`
- `list.svg`
- `lock.svg`
- `map.svg`
- `marker.svg`
- `out.svg`
- `person.svg`
- `pin.svg`
- `point.svg`
- `profile.svg`
- `search.svg`
- `selected-marker.svg`
- `star.svg`
- `target.svg`
- `to.svg`

## Quick Start: Get PNG Icons Now

**Fastest Solution:** Download professional PNG icon packs from these sources:

1. **Heroicons** (https://heroicons.com) - MIT License, matches the SVG designs created
   - Download 24x24 outline icons
   - Rename to match: `check.png`, `arrow-down.png`, etc.

2. **Feather Icons** (https://feathericons.com) - MIT License
   - Download PNG exports at 2x resolution (48x48)

3. **Online Converter:**
   - Upload the SVG files from `assets/icons/` to https://svgtopng.com
   - Export at 96x96px @ 2x (192x192px actual)
   - Download and place in `assets/icons/`

4. **Use Existing Icon Library:**
   ```bash
   npm install react-native-vector-icons
   ```
   Then use Ionicons/Feather/MaterialIcons directly in components

## Next Steps

**Choose One:**

1. **Migrate to SVG Components:** Update all ~50 components to use SVG icons as components (recommended for long-term quality)

2. **Stick with PNG:** Revert imports and convert/download PNG versions of the icons

## Need PNG Versions?

If you choose Option 2, you can:
- Use online SVG-to-PNG converters (svgtopng.com, cloudconvert.com)
- Use design tools (Figma, Illustrator, Inkscape)
- Ask AI to generate PNG versions

Recommended export size: 96x96px @ 2x resolution (192x192px actual)
