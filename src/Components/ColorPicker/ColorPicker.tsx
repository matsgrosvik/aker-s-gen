import { BlockPicker } from "react-color";
import { useState } from "react";

interface Props {
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
}

const ColorPicker: React.FC<Props> = ({ color, setColor }) => {
  return (
    <BlockPicker
      triangle="hide"
      colors={["#45a6ff", "#1b1f32"]}
      color={color}
      onChange={(color) => {
        setColor(color.hex);
      }}
    />
  );
};

export default ColorPicker;
