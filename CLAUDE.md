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
   - Skip transparent or white pixels
   - Assign color based on brightness thresholds (4 color palette)
   - Apply color inversion if enabled
   - Generate `<circle>` SVG elements with calculated radius
6. **Export** → Download as SVG (direct) or PNG (via canvas conversion)

### Color System

The application uses a hardcoded 4-color palette in [ImageConverter.tsx](src/Components/ImageConverter/ImageConverter.tsx):
- **Blue** (`#45a6ff`): darkest areas (RGB < 80)
- **Pine** (`#ca9a68`): mid-dark areas (80 ≤ RGB < 140)
- **White** (`#fefdf8`): mid-light areas (140 ≤ RGB < 190)
- **Green** (`#76d47a`): lightest areas (RGB ≥ 190)

Color inversion reverses the palette mapping: blue ↔ white, green ↔ pine.

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
