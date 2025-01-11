import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";

const Pong = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null);
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null);
  const [courtHeight, setCourtHeight] = useState(600);
  const paddleHeight = 100;
  const paddleSpeed = 15;
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const [ballX, setBallX] = useState(390);
  const [ballY, setBallY] = useState(294);
  const [ballVX, setBallVX] = useState(0); // Start stationary
  const [ballVY, setBallVY] = useState(0); // Start stationary
  const [paused, setPaused] = useState(true);

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [isScoring, setIsScoring] = useState(false);
  const [collisionHandled, setCollisionHandled] = useState(false);

  useEffect(() => {
    const updateContainerMetrics = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
		console.log("Game Screen Width:", rect.width);
		console.log("Game Screen Height:", rect.height);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        if (paused) {
          setPaused(false);
          setBallVX(3);
          setBallVY(3);
          console.log("Game resumed!");
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

  useEffect(() => {
	const interval = setInterval(() => {
	  if (gameContainerRef.current) {
		const rect = gameContainerRef.current.getBoundingClientRect();
		console.log("Game container metrics on reset:", rect);
		const courtWidth = rect.width;
		const courtHeight = rect.height;

		console.log("Current Ball Position:", { ballX, ballY });
		console.log("Current Velocity:", { ballVX, ballVY });
  
		const paddle1Top = paddle1Y ?? 0;
		const paddle1Bottom = paddle1Top + paddleHeight;
		const paddle2Top = paddle2Y ?? 0;
		const paddle2Bottom = paddle2Top + paddleHeight;
  
		setBallX((prevX) => {
		  const newX = prevX + ballVX;
  
		  // Predict next Y position for better collision handling
		  const predictedBallY = ballY + ballVY;
  
		  // Player 1 Paddle Collision
		  if (
			!collisionHandled &&
			newX <= 30 &&
			predictedBallY + 20 >= paddle1Top &&
			predictedBallY <= paddle1Bottom
		  ) {
			console.log("Collision with Player 1 paddle");
			setBallVX(Math.abs(ballVX)); // Reverse horizontal direction
			setCollisionHandled(true);
			setTimeout(() => setCollisionHandled(false), 50);
			return 31; // Ensure the ball doesn't stick
		  }
  
		  // Player 2 Paddle Collision
		  if (
			!collisionHandled &&
			newX >= courtWidth - 50 &&
			predictedBallY + 20 >= paddle2Top &&
			predictedBallY <= paddle2Bottom
		  ) {
			console.log("Collision with Player 2 paddle");
			setBallVX(-Math.abs(ballVX)); // Reverse horizontal direction
			setCollisionHandled(true);
			setTimeout(() => setCollisionHandled(false), 50);
			return courtWidth - 51; // Ensure the ball doesn't stick
		  }
  
		  // Scoring logic for Player 2
		  if (newX <= 0 && !isScoring) {
			console.log("Player 2 scores!");
			setIsScoring(true);
			setScore2((prevScore) => {
			  const newScore = prevScore + 1;
			  console.log("Updated Score Player 2:", newScore);
			  return newScore;
			});
			resetBall();
			setTimeout(() => setIsScoring(false), 100);
			return courtWidth / 2 - 10; // Reset to center
		  }
  
		  // Scoring logic for Player 1
		  if (newX >= courtWidth - 20 && !isScoring) {
			console.log("Player 1 scores!");
			setIsScoring(true);
			setScore1((prevScore) => {
			  const newScore = prevScore + 1;
			  console.log("Updated Score Player 1:", newScore);
			  return newScore;
			});
			resetBall();
			setTimeout(() => setIsScoring(false), 100);
			return courtWidth / 2 - 10; // Reset to center
		  }
  
		  return newX;
		});
  
		setBallY((prevY) => {
		  const newY = prevY + ballVY;
  
		  if (newY <= 0) {
			console.log("Ball bounces off the top wall");
			setBallVY(Math.abs(ballVY));
			return 0;
		  }
  
		  if (newY >= courtHeight - 20) {
			console.log("Ball bounces off the bottom wall");
			setBallVY(-Math.abs(ballVY));
			return courtHeight - 20;
		  }
  
		  return newY;
		});
	  }
	}, 16);
  
	return () => clearInterval(interval);
  }, [ballVX, ballVY, ballY, paddle1Y, paddle2Y, paddleHeight, isScoring, collisionHandled]);
  

//   const resetBall = (courtWidth: number, courtHeight: number) => {
//     console.log("Resetting ball position...");
//     setBallX(courtWidth / 2 - 10);
//     setBallY(courtHeight / 2 - 10);
//     setBallVX(0);
//     setBallVY(0);
//     setPaused(true);

//     const paddleMiddlePosition = courtHeight / 2 - paddleHeight / 2;
//     setPaddle1Y(paddleMiddlePosition);
//     setPaddle2Y(paddleMiddlePosition);
//   };

const resetBall = () => {
    console.log("Resetting ball position...");
    
    // Use fixed initial positions
    const initialX = 390;
    const initialY = 294;
    
    console.log("Reset to PositionX:", initialX);
    console.log("Reset to PositionY:", initialY);
    
    setBallX(initialX); // Set ball's X position
    setBallY(initialY); // Set ball's Y position
    setBallVX(0);       // Stop ball's horizontal motion
    setBallVY(0);       // Stop ball's vertical motion
    setPaused(true);    // Pause the game

    // Reset paddle positions
    const paddleMiddlePosition = courtHeight / 2 - paddleHeight / 2;
    setPaddle1Y(paddleMiddlePosition);
    setPaddle2Y(paddleMiddlePosition);
};


  return (
    <div className="pong-wrapper">
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
