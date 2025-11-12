import React, { useState, useEffect, useRef } from "react";
import "./Panel.scss";
// import Image from "./dmp-logo-desktop.svg";
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
}) => {
  const [download, setDownload] = useState("svg-download");
  return (
    <div className="panel" style={{ backgroundColor: color }}>
      <div>
        <img src={color === "#45a6ff" ? Image : ImageDark} />
        <div className="upload">
          <label htmlFor="imageUpload" className="upload-label">
            Last opp bilde her
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
              Lastet opp : <b>{fileName}</b>
            </span>
          )}
        </div>
        <div className="slider">
          <label className="slider-header">
            Bildebredde:
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
            Sirkel størrelse:
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
            Sensitivitet:
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
        <div className="slider">
          <label className="slider-header">
            Lyshet
            <span>{brightness}</span>
          </label>
          <input
            type="range"
            min="0.1"
            step="0.05"
            max="1"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
          />
        </div>
        <label htmlFor="checkbox" className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={inverted}
            onChange={(e) => setInverted(e.target.checked)}
            id="checkbox"
          />
          <span className="checkmark"></span>
          Invert
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
      {svgContent && (
        <div className="download-container">
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
