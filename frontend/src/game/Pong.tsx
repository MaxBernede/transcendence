import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";

const Pong = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null); // Vertical position of Player 1's paddle
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null); // Vertical position of Player 2's paddle
  const [courtHeight, setCourtHeight] = useState(600); // Height of the game container
  const paddleHeight = 100; // Paddle height
  const paddleSpeed = 15; // Speed of paddle movement
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateContainerMetrics = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();

        console.log("Container Dimensions:", rect);
        console.log("courtHeight (Total Height of Container):", rect.height);

        setCourtHeight(rect.height);

        // Align paddles so their middle aligns with the center of the container
        const paddleMiddlePosition = (rect.height / 2) - (paddleHeight / 2);
        console.log("Calculated paddleMiddlePosition:", paddleMiddlePosition);

        // Initialize paddle positions
        if (paddle1Y === null) setPaddle1Y(paddleMiddlePosition);
        if (paddle2Y === null) setPaddle2Y(paddleMiddlePosition);

        console.log("Paddle1Y Initial Position:", paddleMiddlePosition);
        console.log("Paddle2Y Initial Position:", paddleMiddlePosition);
      }
    };

    updateContainerMetrics();

    window.addEventListener("resize", updateContainerMetrics);
    return () => {
      window.removeEventListener("resize", updateContainerMetrics);
    };
  }, [paddle1Y, paddle2Y]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        switch (event.key) {
          case "w": // Player 1 moves up
            setPaddle1Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "s": // Player 1 moves down
            setPaddle1Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight)
            );
            break;
          case "ArrowUp": // Player 2 moves up
            setPaddle2Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "ArrowDown": // Player 2 moves down
            setPaddle2Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight)
            );
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [courtHeight, paddle1Y, paddle2Y]);

  return (
    <div className="pong-wrapper">
      {/* Scoreboard */}
      <div className="pong-scoreboard">
        <div className="pong-score pong-score-left">
          <div className="pong-score-name">🎀 PLAYER 1 🎀</div>
          <div className="pong-score-number">0</div>
        </div>
        <div className="pong-score pong-score-right">
          <div className="pong-score-name">🌸 PLAYER 2 🌸</div>
          <div className="pong-score-number">0</div>
        </div>
      </div>

      {/* Game Container */}
      <div ref={gameContainerRef} className="pong-game-container">
        <div className="pong-center-line"></div>
        <div
          className="pong-paddle pong-paddle-left"
          style={{ top: `${paddle1Y ?? 0}px` }}
        ></div>
        <div
          className="pong-paddle pong-paddle-right"
          style={{ top: `${paddle2Y ?? 0}px` }}
        ></div>
        <div className="pong-ball"></div>
      </div>
    </div>
  );
};

export default Pong;
