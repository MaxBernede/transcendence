import React from "react";
import "./Pong.css";
import Paddle from "./Paddle";
import Ball from "./Ball";
import Scoreboard from "./Scoreboard";
import { usePongGame } from "./hooks/usePongGame";

const Pong = () => {
  const { gameContainerRef, paddle1Y, paddle2Y, ballX, ballY, score1, score2 } =
    usePongGame();

  return (
    <div className="pong-wrapper">
      <Scoreboard score1={score1} score2={score2} />
      <div ref={gameContainerRef} className="pong-game-container">
        <div className="pong-center-line"></div>
        <Paddle position="left" top={paddle1Y ?? 0} />
        <Paddle position="right" top={paddle2Y ?? 0} />
        <Ball x={ballX} y={ballY} />
      </div>
    </div>
  );
};

export default Pong;
