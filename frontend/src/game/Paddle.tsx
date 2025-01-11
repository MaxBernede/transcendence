import React from "react";

interface PaddleProps {
	position: "left" | "right";
	top: number;
  }

  const Paddle: React.FC<PaddleProps> = ({ position, top }) => {
	console.log(`Rendering ${position} paddle with top: ${top}`);
	return (
	  <div
		className={`pong-paddle pong-paddle-${position}`}
		style={{ top: `${top}px` }}
	  ></div>
	);
  };
  
  export default Paddle;