import React from "react";

interface PowerUpProps {
  x: number; // X-coordinate of the power-up
  y: number; // Y-coordinate of the power-up
  isActive: boolean; // Whether the power-up is currently active
  type: "shrinkOpponent" | "speedBoost" | "enlargePaddle"; // Add the new power-up type
}

const PowerUp: React.FC<PowerUpProps> = ({ x, y, isActive, type }) => {
  if (!isActive) return null;

  // Determine styles based on the type
  const styles: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "3px dashed",
    backgroundColor:
      type === "shrinkOpponent"
        ? "lightblue"
        : type === "speedBoost"
        ? "yellow"
        : "green", // Green for enlargePaddle
    borderColor:
      type === "shrinkOpponent"
        ? "purple"
        : type === "speedBoost"
        ? "orange"
        : "darkgreen", // Dark green for enlargePaddle
    animation: type === "speedBoost" ? "pulse 1s infinite" : undefined, // Animation for speed boost
  };

  return <div className="power-up" style={styles} />;
};

export default PowerUp;
