import React, { useState } from "react";
import "./Panel.scss";
import ImageDark from "./Aker-Security-logo-RGB_Light.svg";
import Image from "./Aker-Security-logo-RGB_Dark.svg";

interface Props {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  size: number;
  setSize: React.Dispatch<React.SetStateAction<number>>;
  maxImageSize: number;
  setMaxImageSize: React.Dispatch<React.SetStateAction<number>>;
  inverted: boolean;
  setInverted: React.Dispatch<React.SetStateAction<boolean>>;
  brightness: number;
  setBrightness: React.Dispatch<React.SetStateAction<number>>;
  sensetivity: number;
  setSensetivity: React.Dispatch<React.SetStateAction<number>>;
  svgContent: string;
  downLoadPng: () => void;
  handleDownload: () => void;
  fileName: string;
  colorRanking: string[];
  setColorRanking: React.Dispatch<React.SetStateAction<string[]>>;
  colorDominance: { [key: string]: number };
  setColorDominance: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  blueColor: string;
  greenColor: string;
  pineColor: string;
  whiteColor: string;
}

const Panel: React.FC<Props> = ({
  handleFileChange,
  color,
  setColor,
  maxImageSize,
  setMaxImageSize,
  size,
  setSize,
  inverted,
  setInverted,
  brightness,
  sensetivity,
  setBrightness,
  setSensetivity,
  svgContent,
  downLoadPng,
  handleDownload,
  fileName,
  colorRanking,
  setColorRanking,
  colorDominance,
  setColorDominance,
  blueColor,
  greenColor,
  pineColor,
  whiteColor,
}) => {
  const [download, setDownload] = useState("svg-download");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Helper function to get color name
  const getColorName = (colorHex: string): string => {
    if (colorHex === blueColor) return "Blue Sky";
    if (colorHex === greenColor) return "Bright Green";
    if (colorHex === pineColor) return "Forest Pine";
    if (colorHex === whiteColor) return "White";
    return "Unknown";
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;

    const newRanking = [...colorRanking];
    const draggedColor = newRanking[draggedIndex];
    newRanking.splice(draggedIndex, 1);
    newRanking.splice(dropIndex, 0, draggedColor);

    setColorRanking(newRanking);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle dominance change with auto-normalization
  const handleDominanceChange = (colorHex: string, newValue: number) => {
    const oldValue = colorDominance[colorHex];
    const difference = newValue - oldValue;

    // Create new dominance object
    const newDominance = { ...colorDominance };
    newDominance[colorHex] = newValue;

    // Distribute the difference among other colors proportionally
    const otherColors = Object.keys(colorDominance).filter(
      (c) => c !== colorHex
    );
    const totalOtherDominance = otherColors.reduce(
      (sum, c) => sum + colorDominance[c],
      0
    );

    if (totalOtherDominance > 0) {
      otherColors.forEach((c) => {
        const proportion = colorDominance[c] / totalOtherDominance;
        newDominance[c] = Math.max(
          5,
          colorDominance[c] - difference * proportion
        );
      });
    }

    // Normalize to ensure total is 100%
    const total = Object.values(newDominance).reduce((a, b) => a + b, 0);
    const normalized: { [key: string]: number } = {};
    Object.keys(newDominance).forEach((c) => {
      normalized[c] = (newDominance[c] / total) * 100;
    });

    setColorDominance(normalized);
  };

  return (
    <div className="panel" style={{ backgroundColor: color }}>
      <div>
        <img src={color === "#45a6ff" ? Image : ImageDark} alt="logo" />
        <div className="upload">
          <label htmlFor="imageUpload" className="upload-label">
            Upload image here
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {fileName && (
            <span className="upload-label-uploaded">
              Uploaded: <b>{fileName}</b>
            </span>
          )}
        </div>
        <div className="slider">
          <label className="slider-header">
            Image Width:
            <span>{maxImageSize}px</span>
          </label>
          <input
            type="range"
            min="100"
            max="4000"
            step="50"
            value={maxImageSize}
            onChange={(e) => setMaxImageSize(Number(e.target.value))}
          />
        </div>
        <div className="slider">
          <label className="slider-header">
            Circle Size:
            <span>{size}</span>
          </label>
          <input
            type="range"
            min="3"
            step="1"
            max="20"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>
        <div className="slider">
          <label className="slider-header">
            Sensitivity:
            <span>{sensetivity}</span>
          </label>
          <input
            type="range"
            min="0"
            step="0.5"
            max="200"
            value={sensetivity}
            onChange={(e) => setSensetivity(Number(e.target.value))}
          />
        </div>

        {/* Color Ranking Section */}
        <div className="color-ranking-section">
          <h3 className="section-header">Color Ranking</h3>
          <p className="section-hint">Drag and drop to change order</p>
          <div className="color-ranking-list">
            {colorRanking.map((colorHex, index) => (
              <div
                key={colorHex}
                className={`color-rank-item ${
                  draggedIndex === index ? "dragging" : ""
                }`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}>
                <div className="rank-number">{index + 1}</div>
                <div
                  className="color-swatch-large"
                  style={{ backgroundColor: colorHex }}></div>
                <div className="color-info">
                  <span className="color-name">{getColorName(colorHex)}</span>
                  <span className="color-level">
                    {index === 0 && "Darkest"}
                    {index === 1 && "2nd Darkest"}
                    {index === 2 && "2nd Lightest"}
                    {index === 3 && "Lightest"}
                  </span>
                </div>
                <div className="drag-handle">⋮⋮</div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Dominance Section */}
        <div className="color-dominance-section">
          <h3 className="section-header">Color Dominance</h3>
          {colorRanking.map((colorHex, index) => (
            <div key={colorHex} className="slider">
              <label className="slider-header">
                {getColorName(colorHex)}
                <span>{colorDominance[colorHex].toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="5"
                step="1"
                max="70"
                value={colorDominance[colorHex]}
                onChange={(e) =>
                  handleDominanceChange(colorHex, Number(e.target.value))
                }
              />
              <div
                className="dominance-bar"
                style={{
                  width: `${colorDominance[colorHex]}%`,
                  backgroundColor: colorHex,
                }}></div>
            </div>
          ))}
        </div>
        <div className="color-dominance-section">
          <h3 className="section-header">Mode</h3>

          <label htmlFor="checkbox" className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={inverted}
              onChange={(e) => setInverted(e.target.checked)}
              id="checkbox"
            />
            <span className="checkmark"></span>
            Invert colors
          </label>
          <button
            className={`color-button ${color === "#1b1f32" ? "selected" : ""}`}
            onClick={() => setColor("#1b1f32")}>
            <span
              className="color-swatch"
              style={{ backgroundColor: "#1b1f32" }}></span>
            <span className="color-label">Light</span>
          </button>
          <button
            className={`color-button ${color === "#45a6ff" ? "selected" : ""}`}
            onClick={() => setColor("#45a6ff")}>
            <span
              className="color-swatch"
              style={{ backgroundColor: "#45a6ff" }}></span>
            <span className="color-label">Dark</span>
          </button>
        </div>
      </div>
      {svgContent && (
        <div className="download-container color-dominance-section">
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="download-type"
                value="svg-download"
                checked={download === "svg-download"}
                onChange={(e) => setDownload(e.target.value)}
              />
              <span className="custom-radio"></span>
              SVG
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="download-type"
                value="png-download"
                checked={download === "png-download"}
                onChange={(e) => setDownload(e.target.value)}
              />
              <span className="custom-radio"></span>
              PNG
            </label>
          </div>
          <button
            className="download-button"
            onClick={
              download === "svg-download" ? handleDownload : downLoadPng
            }>
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default Panel;
