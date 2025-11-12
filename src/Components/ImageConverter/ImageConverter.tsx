import React, { useState, useEffect, useCallback } from "react";
import "./ImageConverter.scss";
import Panel from "../Panel/Panel";

const ImageConverter: React.FC = () => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [size, setSize] = useState(3);
  const [sensetivity, setSensetivity] = useState(0);
  const [brightness, setBrightness] = useState(0.45);
  const [inverted, setInverted] = useState(false);
  const [color, setColor] = useState("#45a6ff");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maxImageSize, setMaxImageSize] = useState(800);
  const [fileName, setFilename] = useState("");

  const blueColor = "#5d9dda";
  const greenColor = "#61c55d";
  const pineColor = "#ca9462";
  const whiteColor = "#fffffa";

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

      const hexHeight = size;
      const hexWidth = size;

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
            if (!inverted) {
            }

            if (rgb < 255 - sensetivity && rgb > 35) {
              // Assign color based on brightness, skip darkest colors
              let fillColor = whiteColor;
              const t1 = 44;
              const t2 = 83;
              const t3 = 160;

              if (rgb < t1) {
                fillColor = greenColor;
              } else if (rgb < t2) {
                fillColor = blueColor;
              } else if (rgb < t3) {
                fillColor = pineColor;
              } else {
                fillColor = whiteColor;
              }

              // Invert colors if inverted is true
              if (inverted) {
                if (fillColor === greenColor) fillColor = whiteColor;
                else if (fillColor === blueColor) fillColor = pineColor;
                else if (fillColor === pineColor) fillColor = blueColor;
                else if (fillColor === whiteColor) fillColor = greenColor;
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
      sensetivity,
      brightness,
      inverted,
      maxImageSize,
      blueColor,
      greenColor,
      pineColor,
      whiteColor,
    ]
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
    <div
      className={`img-converter ${color === "#45a6ff" ? "light" : "dark"}`}
      style={{ display: "flex" }}>
      <Panel
        handleFileChange={handleFileChange}
        color={color}
        setColor={setColor}
        maxImageSize={maxImageSize}
        setMaxImageSize={setMaxImageSize}
        size={size}
        setSize={setSize}
        inverted={inverted}
        setInverted={setInverted}
        brightness={brightness}
        sensetivity={sensetivity}
        setBrightness={setBrightness}
        setSensetivity={setSensetivity}
        svgContent={svgContent}
        downLoadPng={downLoadPng}
        handleDownload={handleDownload}
        fileName={fileName}
      />
      {svgContent && (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} id="svg" />
      )}
    </div>
  );
};

export default ImageConverter;
