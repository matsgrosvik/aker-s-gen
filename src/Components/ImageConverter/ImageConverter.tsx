import React, { useState, useEffect, useRef } from "react";
import "./ImageConverter.scss";
import Panel from "../Panel/Panel";

interface Props {
  initialSize?: number;
  initialInverted?: boolean;
  initialColor?: string;
}

const ImageConverter: React.FC<Props> = ({}) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [size, setSize] = useState(9);
  const [sensetivity, setSensetivity] = useState(2);
  const [brightness, setBrightness] = useState(0.45);
  const [inverted, setInverted] = useState(false);
  const [color, setColor] = useState("#1b1f32");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maxImageSize, setMaxImageSize] = useState(800);
  const [fileName, setFilename] = useState("");

  const blueColor = "#45a6ff";
  const greenColor = "#76d47a";
  const pineColor = "#ca9a68";
  const whiteColor = "#fefdf8";

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
  }, [imageFile, size, inverted, color, maxImageSize, sensetivity, brightness]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const processImage = (img: HTMLImageElement) => {
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
          const rgb = (r + g + b) / 3;

          // If alpha is 0 (fully transparent) or pixel is completely white, skip drawing the circle
          if (a === 0 || (r === 255 && g === 255 && b === 255)) {
            continue;
          }

          if (rgb < 255 - sensetivity) {
            // Assign color based on brightness
            let fillColor = blueColor;
            if (rgb > 190) {
              fillColor = greenColor;
            } else if (rgb > 140) {
              fillColor = whiteColor;
            } else if (rgb > 80) {
              fillColor = pineColor;
            }

            // Invert colors if inverted is true
            if (inverted) {
              if (fillColor === blueColor) fillColor = whiteColor;
              else if (fillColor === greenColor) fillColor = pineColor;
              else if (fillColor === pineColor) fillColor = greenColor;
              else if (fillColor === whiteColor) fillColor = blueColor;
            }

            const radius = size * brightness;
            svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${fillColor}" />`;
          }
        }
      }
    }

    svgContent += "</svg>";
    setSvgContent(svgContent);
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
