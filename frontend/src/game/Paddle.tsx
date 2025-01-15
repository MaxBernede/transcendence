import React from "react";

interface PaddleProps {
  position: "left" | "right"; // Determines paddle alignment
  top: number; // Distance from the top of the container
  height: number; // Height of the paddle
}

const Paddle: React.FC<PaddleProps> = ({ position, top, height }) => {
  return (
    <div
      className={`pong-paddle pong-paddle-${position}`}
      style={{
        top: `${top}px`, // Set vertical position
        height: `${height}px`, // Set paddle height dynamically
        width: "10px", // Fixed paddle width
        position: "absolute", // Ensure proper positioning
        [position]: "10px", // Dynamically set alignment based on position
        backgroundColor: "deeppink", // Corrected CSS color
      }}
    ></div>
  );
};

export default Paddle;
