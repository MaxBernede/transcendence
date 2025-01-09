import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";

const Pong = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null); // Vertical position of Player 1's paddle
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null); // Vertical position of Player 2's paddle
  const [courtHeight, setCourtHeight] = useState(600); // Height of the game container, it is dynamically measured 
  const paddleHeight = 100; // Paddle height
  const paddleSpeed = 15; // Speed of paddle movement
  const gameContainerRef = useRef<HTMLDivElement>(null);


  // updates paddle position
  useEffect(() => {
    const updateContainerMetrics = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect(); // measure game screen dimensions

        setCourtHeight(rect.height); 

        // Align paddles so their middle aligns with the center of the container
        const paddleMiddlePosition = (rect.height / 2) - (paddleHeight / 2);

        // Initialize paddle positions if they are not already set
        if (paddle1Y === null) setPaddle1Y(paddleMiddlePosition);
        if (paddle2Y === null) setPaddle2Y(paddleMiddlePosition);

      }
    };

    updateContainerMetrics(); // update positions

    window.addEventListener("resize", updateContainerMetrics); // if window size changed (does this even happen?) it is dynamically resized
    return () => {
      window.removeEventListener("resize", updateContainerMetrics); // clean up
    };
  }, [paddle1Y, paddle2Y]);


  // paddle movement
  // prev ?? 0 is there to make sure 0 is default starting point when undefined or 0
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        switch (event.key) {
          case "w": // Player 1 moves up	
            setPaddle1Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0)); // if prev ?? 0 it substitutes 0 otherwise substract speed for current position, make sure it can't be less than 0 so you don't go above game screen
            break;
          case "s": // Player 1 moves down
            setPaddle1Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight) // if prev ?? 0 it substitutes 0 otherwise add speed for current position, make sure the result is at most courtHeight - paddleHeight so it does not go lower than screen
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

    window.addEventListener("keydown", handleKeyDown); // use handlekeydown whenever key is pressed down

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
