import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";

const Pong = () => {
  // Paddle position
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null);
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null);
  const [courtHeight, setCourtHeight] = useState(600);
  const paddleHeight = 100;
  const paddleSpeed = 15;
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Ball position
  const [ballX, setBallX] = useState(400);
  const [ballY, setBallY] = useState(300);
  const [ballVX, setBallVX] = useState(0); // Start stationary
  const [ballVY, setBallVY] = useState(0); // Start stationary
  const [paused, setPaused] = useState(true); // Game starts paused

  // Scores
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  // Update paddle positions based on game container
  useEffect(() => {
    const updateContainerMetrics = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        setCourtHeight(rect.height);

        const paddleMiddlePosition = rect.height / 2 - paddleHeight / 2;
        if (paddle1Y === null) setPaddle1Y(paddleMiddlePosition);
        if (paddle2Y === null) setPaddle2Y(paddleMiddlePosition);
      }
    };

    updateContainerMetrics();
    window.addEventListener("resize", updateContainerMetrics);
    return () => {
      window.removeEventListener("resize", updateContainerMetrics);
    };
  }, [paddle1Y, paddle2Y]);

  // Paddle movement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        if (paused) {
          console.log("Game resumed!");
          setPaused(false); // Resume game on any key press
          setBallVX(3); // Start ball with a default velocity
          setBallVY(3);
        }

        switch (event.key) {
          case "w":
            setPaddle1Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "s":
            setPaddle1Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight)
            );
            break;
          case "ArrowUp":
            setPaddle2Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "ArrowDown":
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
  }, [courtHeight, paddle1Y, paddle2Y, paused]);

  // Ball movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        const courtWidth = rect.width;
        const courtHeight = rect.height;

        const paddle1Top = paddle1Y ?? 0;
        const paddle1Bottom = paddle1Top + paddleHeight;
        const paddle2Top = paddle2Y ?? 0;
        const paddle2Bottom = paddle2Top + paddleHeight;

		setBallX((prevX) => {
			const newX = prevX + ballVX;
		  
			// Collision with Player 1's paddle
			if (newX <= 30 && ballY + 20 >= paddle1Top && ballY <= paddle1Bottom) {
			  console.log("Collision with Player 1 paddle");
			  const paddleCenter = paddle1Top + paddleHeight / 2;
			  const collisionOffset = (ballY + 10) - paddleCenter;
			  const maxOffset = paddleHeight / 2;
		  
			  setBallVX(Math.abs(ballVX));
			  setBallVY((collisionOffset / maxOffset) * 5);
			  return 31;
			}
		  
			// Collision with Player 2's paddle
			if (newX >= courtWidth - 50 && ballY + 20 >= paddle2Top && ballY <= paddle2Bottom) {
			  console.log("Collision with Player 2 paddle");
			  const paddleCenter = paddle2Top + paddleHeight / 2;
			  const collisionOffset = (ballY + 10) - paddleCenter;
			  const maxOffset = paddleHeight / 2;
		  
			  setBallVX(-Math.abs(ballVX));
			  setBallVY((collisionOffset / maxOffset) * 5);
			  return courtWidth - 51;
			}
		  
			// Scoring logic
			if (newX <= 0 && !paused) {
			  console.log("Player 2 scores!");
			  setPaused(true); // Pause the game
			  setScore2((prevScore) => {
				const newScore = prevScore + 1;
				console.log("Updated Score Player 2:", newScore);
				return newScore;
			  });
			  setTimeout(() => resetBall(courtWidth, courtHeight), 0); // Ensure reset after all updates
			  return courtWidth / 2 - 10;
			} else if (newX >= courtWidth - 20 && !paused) {
			  console.log("Player 1 scores!");
			  setPaused(true); // Pause the game
			  setScore1((prevScore) => {
				const newScore = prevScore + 1;
				console.log("Updated Score Player 1:", newScore);
				return newScore;
			  });
			  setTimeout(() => resetBall(courtWidth, courtHeight), 0); // Ensure reset after all updates
			  return courtWidth / 2 - 10;
			}
		  
			return newX;
		  });		  
		  

        setBallY((prevY) => {
          const newY = prevY + ballVY;

          if (newY <= 0) {
            console.log("Ball bounces off the top wall");
            setBallVY(Math.abs(ballVY));
            setBallVX((prevVX) => prevVX + (Math.random() - 0.5) * 0.5);
            return 0;
          }

          if (newY >= courtHeight - 20) {
            console.log("Ball bounces off the bottom wall");
            setBallVY(-Math.abs(ballVY));
            setBallVX((prevVX) => prevVX + (Math.random() - 0.5) * 0.5);
            return courtHeight - 20;
          }

          return newY;
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [ballVX, ballVY, paddle1Y, paddle2Y, paddleHeight, paused]);

  // Reset ball position and pause
  const resetBall = (courtWidth: number, courtHeight: number) => {
    console.log("Resetting ball position...");
    setBallX(courtWidth / 2 - 10); // Center X
    setBallY(courtHeight / 2 - 10); // Center Y
    setBallVX(0); // Stop ball movement
    setBallVY(0); // Stop ball movement
  };

  return (
    <div className="pong-wrapper">
      {/* Scoreboard */}
      <div className="pong-scoreboard">
        <div className="pong-score pong-score-left">
          <div className="pong-score-name">🎀 PLAYER 1 🎀</div>
          <div className="pong-score-number">{score1}</div>
        </div>
        <div className="pong-score pong-score-right">
          <div className="pong-score-name">🌸 PLAYER 2 🌸</div>
          <div className="pong-score-number">{score2}</div>
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
        <div
          className="pong-ball"
          style={{ left: `${ballX}px`, top: `${ballY}px` }}
        ></div>
      </div>
    </div>
  );
};

export default Pong;
