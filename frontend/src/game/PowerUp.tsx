import React from "react";

interface PowerUpProps {
  x: number; // X-coordinate of the power-up
  y: number; // Y-coordinate of the power-up
  isActive: boolean; // Whether the power-up is currently active
  type: "shrinkOpponent" | "speedBoost" | "enlargePaddle"; // Type of the power-up
}

const PowerUp: React.FC<PowerUpProps> = ({ x, y, isActive, type }) => {
  if (!isActive) return null;

  // Map power-up types to emojis
  const powerUpEmojiMap: Record<string, string> = {
    shrinkOpponent: "💗", // Shrink opponent emoji
    speedBoost: "🦩", // Speed boost emoji
    enlargePaddle: "🌺", // Enlarge paddle emoji
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
      {powerUpEmojiMap[type] || "❓"} {/* Default to a question mark if type is undefined */}
    </div>
  );
};

export default PowerUp;
