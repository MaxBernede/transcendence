import React from "react";

interface BallProps {
  x: number;
  y: number;
  color: string; // New color prop
}

const Ball: React.FC<BallProps> = ({ x, y, color }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: color, // Apply color
        transition: "transform 0.016s linear",
      }}
    ></div>
  );
};

export default Ball;
