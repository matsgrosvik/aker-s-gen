import React, { useState, useEffect, useCallback } from "react";
import "./ImageConverter.scss";
import Panel from "../Panel/Panel";

const blueColor = "#46A2FC";
const greenColor = "#56A76B";
const pineColor = "#E49249";
const whiteColor = "#FFFEF9";

const DEFAULTS = {
  size: 2,
  gap: 1,
  sensetivity: 35,
  inverted: false,
  maxImageSize: 1000,
  colorRanking: [greenColor, blueColor, pineColor, whiteColor],
  colorDominance: {
    [greenColor]: 17.3,
    [blueColor]: 15.3,
    [pineColor]: 30.2,
    [whiteColor]: 37.3,
  },
};

const ImageConverter: React.FC = () => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [size, setSize] = useState(DEFAULTS.size);
  const [gap, setGap] = useState(DEFAULTS.gap);
  const [sensetivity, setSensetivity] = useState(DEFAULTS.sensetivity);
  const brightness = 0.45;
  const [inverted, setInverted] = useState(DEFAULTS.inverted);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maxImageSize, setMaxImageSize] = useState(DEFAULTS.maxImageSize);
  const [fileName, setFilename] = useState("");
  const [mode, setMode] = useState<"standard" | "creative">("standard");

  // Color ranking: darkest to lightest (default matches current thresholds)
  const [colorRanking, setColorRanking] = useState<string[]>(
    DEFAULTS.colorRanking,
  );

  // Color dominance: percentage of brightness range each color occupies
  const [colorDominance, setColorDominance] = useState<{
    [key: string]: number;
  }>(DEFAULTS.colorDominance);

  const handleModeChange = (newMode: string) => {
    setMode(newMode as "standard" | "creative");
    if (newMode === "standard") {
      setSize(DEFAULTS.size);
      setGap(DEFAULTS.gap);
      setSensetivity(DEFAULTS.sensetivity);
      setInverted(DEFAULTS.inverted);
      setMaxImageSize(DEFAULTS.maxImageSize);
      setColorRanking(DEFAULTS.colorRanking);
      setColorDominance(DEFAULTS.colorDominance);
    }
  };

  const processImage = useCallback(
    (img: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      let width = img.width;
      let height = img.height;
      const aspectRatio = width / height;

      width = maxImageSize;
      height = width / aspectRatio;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
      svgContent += `<rect width="100%" height="100%" fill="none"/>`;

      const hexHeight = size + gap;
      const hexWidth = size + gap;

      for (let y = 0; y < height + hexHeight; y += hexHeight) {
        for (let x = hexWidth / 2; x < width + hexWidth; x += hexWidth) {
          const centerX = Math.floor(x);
          const centerY = Math.floor(y);

          if (
            centerX >= 0 &&
            centerX < width &&
            centerY >= 0 &&
            centerY < height
          ) {
            const index = (centerY * width + centerX) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const a = pixels[index + 3];
            // const rgb = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const rgb = (r + g + b) / 3;

            // If alpha is 0 (fully transparent) or pixel is completely white, skip drawing the circle
            if (a === 0 || (r === 255 && g === 255 && b === 255)) {
              continue;
            }

            // Enhanced sensitivity: cut off light colors in normal mode, dark colors in inverted mode
            const shouldSkipPixel = inverted
              ? rgb < sensetivity // In inverted mode, skip dark pixels
              : rgb > 255 - sensetivity || rgb < sensetivity; // In normal mode, skip bright AND dark pixels

            if (!shouldSkipPixel) {
              // Get the effective color ranking (reversed if inverted)
              const effectiveRanking = inverted
                ? [...colorRanking].reverse()
                : colorRanking;

              // Calculate dynamic thresholds based on color dominance
              const t1 = (colorDominance[effectiveRanking[0]] / 100) * 255;
              const t2 = t1 + (colorDominance[effectiveRanking[1]] / 100) * 255;
              const t3 = t2 + (colorDominance[effectiveRanking[2]] / 100) * 255;

              // Assign color based on brightness thresholds
              let fillColor = effectiveRanking[3]; // Default to lightest

              if (rgb < t1) {
                fillColor = effectiveRanking[0]; // Darkest
              } else if (rgb < t2) {
                fillColor = effectiveRanking[1]; // 2nd darkest
              } else if (rgb < t3) {
                fillColor = effectiveRanking[2]; // 2nd lightest
              } else {
                fillColor = effectiveRanking[3]; // Lightest
              }

              const radius = size * brightness;
              svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${fillColor}" />`;
            }
          }
        }
      }

      svgContent += "</svg>";
      setSvgContent(svgContent);
    },
    [
      size,
      gap,
      sensetivity,
      brightness,
      inverted,
      maxImageSize,
      colorRanking,
      colorDominance,
    ],
  );

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
      let name = imageFile.name.split(".");
      setFilename(name[0]);
    }
  }, [imageFile, processImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downLoadPng = () => {
    const svgElement = document.querySelector("svg");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (svgElement && context) {
      const svgData = new XMLSerializer().serializeToString(svgElement);

      const img = new Image();
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = svgElement.width.baseVal.value;
        canvas.height = svgElement.height.baseVal.value;

        context.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      };

      img.src = url;
    }
  };

  return (
    <div className="img-converter light" style={{ display: "flex" }}>
      <Panel
        handleFileChange={handleFileChange}
        maxImageSize={maxImageSize}
        setMaxImageSize={setMaxImageSize}
        size={size}
        setSize={setSize}
        gap={gap}
        setGap={setGap}
        inverted={inverted}
        setInverted={setInverted}
        sensetivity={sensetivity}
        setSensetivity={setSensetivity}
        svgContent={svgContent}
        downLoadPng={downLoadPng}
        handleDownload={handleDownload}
        fileName={fileName}
        colorRanking={colorRanking}
        setColorRanking={setColorRanking}
        colorDominance={colorDominance}
        setColorDominance={setColorDominance}
        mode={mode}
        onModeChange={handleModeChange}
        blueColor={blueColor}
        greenColor={greenColor}
        pineColor={pineColor}
        whiteColor={whiteColor}
      />
      {svgContent && (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} id="svg" />
      )}
    </div>
  );
};

export default ImageConverter;
