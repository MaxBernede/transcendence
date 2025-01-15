import React from "react";

interface PowerUpProps {
  x: number; // X-coordinate of the power-up
  y: number; // Y-coordinate of the power-up
  isActive: boolean; // Whether the power-up is currently active
}

const PowerUp: React.FC<PowerUpProps> = ({ x, y, isActive }) => {
	if (!isActive) return null;
  
	return (
	  <div
		className="power-up"
		style={{
		  position: "absolute",
		  left: `${x}px`,
		  top: `${y}px`,
		  width: "30px", // Increased size
		  height: "30px",
		  backgroundColor: "lightblue", // Changed color to light blue
		  borderRadius: "50%",
		  border: "3px dashed purple", // Changed border style and color
		}}
	  />
	);
  };

export default PowerUp; // Default export
