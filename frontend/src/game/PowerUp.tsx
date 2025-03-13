import React from "react";

interface PowerUpProps {
  x: number | null; // X-coordinate of the power-up
  y: number | null; // Y-coordinate of the power-up
  isActive: boolean; // Whether the power-up is currently active
  type: "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null; // Type of the power-up
  darkMode: boolean; // Whether dark mode is active
}

const PowerUp: React.FC<PowerUpProps> = ({ x, y, isActive, type, darkMode }) => {
  if (!isActive || x === null || y === null) return null; // Ensure valid position

  // Map power-up types to emojis for light and dark modes
  const powerUpEmojiMap: Record<string, { light: string; dark: string }> = {
    shrinkOpponent: { light: "💗", dark: "🕷️" }, // Shrink opponent emoji
    speedBoost: { light: "🦩", dark: "🕸️" }, // Speed boost emoji
    enlargePaddle: { light: "🌺", dark: "🕯️" }, // Enlarge paddle emoji
  };

  return (
    <div
      className="power-up"
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        fontSize: "30px",
        zIndex: 10,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {powerUpEmojiMap[type || "shrinkOpponent"][darkMode ? "dark" : "light"] || "❓"}
    </div>
  );
};

export default PowerUp;
