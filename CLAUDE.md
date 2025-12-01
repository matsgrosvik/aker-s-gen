# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an image-to-SVG converter application called "Ilucreator" for Aker Security. It converts uploaded images into SVG graphics composed of colored circles arranged in a hexagonal pattern, producing a distinctive visual style.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Run tests in interactive watch mode
npm test

# Create production build (outputs to /build folder)
npm run build
```

## Architecture

### Core Image Processing Pipeline

The main conversion logic lives in [src/Components/ImageConverter/ImageConverter.tsx](src/Components/ImageConverter/ImageConverter.tsx) and follows this flow:

1. **File Upload** → User selects an image file via file input
2. **Image Loading** → FileReader converts file to data URL, creates Image object
3. **Canvas Processing** → Image is drawn to canvas, resized based on `maxImageSize` while maintaining aspect ratio
4. **Pixel Analysis** → Canvas pixel data is extracted via `getImageData()`
5. **SVG Generation** → Loop through image in hexagonal grid pattern:
   - Sample pixel at each hexagon center point
   - Calculate RGB average to determine brightness
   - Skip transparent or white pixels (alpha=0 or RGB=255,255,255)
   - Apply sensitivity filter (skip pixels based on brightness thresholds)
   - Assign color based on dynamic thresholds calculated from color dominance
   - Apply color inversion if enabled (reverses the color ranking array)
   - Generate `<circle>` SVG elements with calculated radius
6. **Export** → Download as SVG (direct) or PNG (via canvas conversion)

### Color System

The application uses a 4-color palette with **dynamic threshold calculation**:

**Fixed Color Definitions:**
- **Blue Sky** (`#45A6FF`)
- **Bright Green** (`#76D47A`)
- **Forest Pine** (`#CA9A68`)
- **White** (`#FEFDF8`)

**Color Ranking System:**
Colors can be arranged in any order from darkest to lightest via drag-and-drop UI. Default ranking (darkest→lightest):
1. Green → 2. Blue → 3. Pine → 4. White

**Color Dominance System:**
Each color's dominance percentage determines what portion of the 0-255 brightness range it occupies. Default dominance values:
- Green: 17.3% (threshold: 0-44)
- Blue: 15.3% (threshold: 44-83)
- Pine: 30.2% (threshold: 83-160)
- White: 37.3% (threshold: 160-255)

Dominance percentages auto-normalize to always total 100%. When one color's dominance is adjusted, the difference is distributed proportionally among other colors.

**Color Inversion:**
When inverted mode is enabled, the `colorRanking` array is reversed before applying thresholds. This flips the brightness-to-color mapping (dark pixels get light colors, light pixels get dark colors).

### Component Structure

- **App.tsx** - Root component, renders `ImageConverter` (has commented `Test` component option)
- **ImageConverter.tsx** - Main conversion logic and state management
- **Panel.tsx** - Left sidebar control panel with:
  - File upload input
  - Sliders for: image width, hexagon size, sensitivity, brightness
  - Invert checkbox
  - Theme toggle (light/dark)
  - Download buttons (SVG/PNG)
- **ColorPicker.tsx** - Simple theme selector using `react-color` BlockPicker (currently limited to 2 colors)

### State Management

All state is managed locally in ImageConverter using React hooks:
- `size` - Hexagon grid spacing (default: 9)
- `sensetivity` - Threshold for pixel detection (default: 2)
- `brightness` - Circle radius multiplier (default: 0.45)
- `inverted` - Color palette inversion flag
- `color` - UI theme color
- `maxImageSize` - Maximum width for processed image (default: 800)

Note: Typo exists in codebase: "sensetivity" should be "sensitivity"

## Styling

The project uses SCSS for styling:
- [src/Components/ImageConverter/ImageConverter.scss](src/Components/ImageConverter/ImageConverter.scss) - Main converter styles
- [src/Components/Panel/Panel.scss](src/Components/Panel/Panel.scss) - Control panel styles
- Theme switching is done via CSS classes (`.light` vs `.dark`) based on selected color

## Key Implementation Details

### Image Processing Limitations
- Transparent pixels (alpha = 0) are skipped
- Fully white pixels (RGB 255,255,255) are skipped
- Processing happens on every state change due to the useEffect dependency array

### SVG Rendering
- SVG is generated as an HTML string and rendered via `dangerouslySetInnerHTML`
- SVG dimensions match the processed canvas dimensions
- Background is transparent (`fill="none"`)

### PNG Export
- Serializes the rendered SVG element from DOM
- Creates Blob → Object URL → Image → Canvas → PNG data URL
- Downloads via temporary anchor element

## TypeScript Configuration

Project uses strict TypeScript with:
- Target: ES5
- JSX: react-jsx (automatic React 17+ transform)
- Strict mode enabled
- Module resolution: node

## Testing

This is a Create React App project using:
- Jest for test framework
- React Testing Library for component testing
- Run tests with `npm test` (watch mode)
