import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";

const Pong = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null);
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null);
  const [courtHeight, setCourtHeight] = useState(600);
  const paddleHeight = 100;
  const paddleSpeed = 20;
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const [ballX, setBallX] = useState(390);
  const [ballY, setBallY] = useState(294);
  const [ballVX, setBallVX] = useState(0); 
  const [ballVY, setBallVY] = useState(0);
  const [paused, setPaused] = useState(true);

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [isScoring, setIsScoring] = useState(false);
  const [collisionHandled, setCollisionHandled] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        if (paused) {
          setPaused(false);
          setBallVX(5);
          setBallVY(5);
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

let scoringInProgress = false;

const handleScore = (player: number) => {
  if (scoringInProgress || isScoring) return; // Prevent duplicate scoring triggers
  scoringInProgress = true;

  console.log(`handleScore called for Player ${player}, isScoring: ${isScoring}`); 

  setIsScoring(true);
  console.log(`Player ${player} scores!`);

  if (player === 1) {
    setScore1((prevScore) => prevScore + 1);
  } else if (player === 2) {
    setScore2((prevScore) => prevScore + 1);
  }

  resetBall();

  setTimeout(() => {
    setIsScoring(false);
    scoringInProgress = false; // Reset flag
  }, 1000);
};
  
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
  
		  if (isScoring) return prevX; // Skip ball logic if scoring is in progress
  
		  const predictedBallY = ballY + ballVY;
  
		  // Player 1 Paddle Collision
		  if (
			!collisionHandled &&
			newX <= 30 &&
			predictedBallY + 20 >= paddle1Top &&
			predictedBallY <= paddle1Bottom
		  ) {
			setBallVX(Math.abs(ballVX));
			setCollisionHandled(true);
			setTimeout(() => setCollisionHandled(false), 50);
			return 31;
		  }
  
		  // Player 2 Paddle Collision
		  if (
			!collisionHandled &&
			newX >= courtWidth - 50 &&
			predictedBallY + 20 >= paddle2Top &&
			predictedBallY <= paddle2Bottom
		  ) {
			setBallVX(-Math.abs(ballVX));
			setCollisionHandled(true);
			setTimeout(() => setCollisionHandled(false), 50);
			return courtWidth - 51;
		  }
  
		  if (!isScoring) {
			if (newX <= 0) {
			  handleScore(2); // Player 2 scores
			  return courtWidth / 2 - 10;
			} else if (newX >= courtWidth - 20) {
			  handleScore(1); // Player 1 scores
			  return courtWidth / 2 - 10;
			}
		  }
  
		  return newX;
		});
  
		setBallY((prevY) => {
		  const newY = prevY + ballVY;
  
		  if (newY <= 0) {
			setBallVY(Math.abs(ballVY));
			return 0;
		  }
  
		  if (newY >= courtHeight - 20) {
			setBallVY(-Math.abs(ballVY));
			return courtHeight - 20;
		  }
  
		  return newY;
		});
	  }
	}, 16);
  
	return () => clearInterval(interval);
  }, [ballVX, ballVY, ballY, paddle1Y, paddle2Y, collisionHandled, isScoring]);

const resetBall = () => {
    console.log("Resetting ball position...");
    
    // Use fixed initial positions
    const initialX = 390;
    const initialY = 294;
    

    
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
