import React from "react";

interface BallProps {
  x: number;
  y: number;
}

const Ball: React.FC<BallProps> = ({ x, y }) => {
  return (
    <div
      className="pong-ball"
      style={{ left: `${x}px`, top: `${y}px` }}
    ></div>
  );
};

export default Ball;
