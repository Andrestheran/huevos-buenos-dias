# PWA Icons

This directory needs the following icons for the PWA to work properly:

## Required Files

1. **icon-192.png** (192x192 pixels)
   - Used for home screen icon on Android
   - Should be the app logo on transparent or white background

2. **icon-512.png** (512x512 pixels)
   - Used for splash screen
   - Should be the app logo on transparent or white background

3. **favicon.ico** (32x32 or 16x16 pixels)
   - Browser tab icon
   - Can be generated from the PNG files

## How to Generate

### Option 1: Use Online Tool (Recommended)
1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your logo (PNG or SVG)
3. Configure settings:
   - iOS: Yes
   - Android: Yes
   - Windows: Optional
4. Generate and download
5. Extract files to this directory

### Option 2: Manual Creation
Use any image editor (Photoshop, Figma, Canva):

1. Create 512x512px canvas
2. Add your logo/brand
3. Export as PNG
4. Resize to 192x192px for second file
5. Convert to ICO format for favicon

## Recommended Design

For an egg production app, consider:
- 🥚 Egg emoji or icon
- 🏠 Farm/barn icon
- 📊 Chart icon
- Combination of above

**Colors**: Use your brand colors from Tailwind config:
- Primary: `#F59E0B` (Amber)
- Success: `#10B981` (Green)

## Temporary Placeholder

Until you have custom icons, you can use emoji-based icons:

1. Go to [Emoji to PNG](https://emoji.gg/)
2. Search for "egg" (🥚)
3. Download as PNG in 512x512
4. Resize for 192x192
5. Use as temporary icons

## After Adding Icons

1. Verify files exist:
   ```bash
   ls -la public/
   # Should show icon-192.png, icon-512.png, favicon.ico
   ```

2. Test PWA installation:
   - Deploy to Vercel
   - Open on mobile browser
   - Click "Add to Home Screen"
   - Verify icon appears correctly

---

**Note**: The app will work without these icons, but PWA installation may not be available or will use browser defaults.
