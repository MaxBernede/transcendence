import React, { useState, useEffect, useRef } from "react";
import "./Pong.css";
import Paddle from "./Paddle"; // Import Paddle component
import Ball from "./Ball"; // Import Ball component
import Scoreboard from "./Scoreboard"; // Import Scoreboard component

const Pong = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null);
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null);
  const [courtHeight, setCourtHeight] = useState(600);
  const [isResetting, setIsResetting] = useState(false);

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
		if (isResetting) {
            console.log("Skipping ball updates during reset.");
            return;
        }
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

//   const resetBall = () => {
//     console.log("Resetting ball position...");
// 	setIsResetting(true);

//     const initialX = 390;
//     const initialY = 294;
//     const paddleMiddlePosition = courtHeight / 2 - paddleHeight / 2;
	
//     setBallX(initialX);
// 	console.log(`setting ball to X: ${initialX}`);
//     setBallY(initialY);
// 	console.log(`setting ball to Y: ${initialY}`);
//     setBallVX(0);
//     setBallVY(0);
//     setPaused(true);

//     // Update paddle positions
//     setPaddle1Y(paddleMiddlePosition);
//     setPaddle2Y(paddleMiddlePosition);

//     // Force re-render by temporarily setting paddles to null and back to the middle position
//     setTimeout(() => {
// 		setIsResetting(false);
//         setPaddle1Y(null);
//         setPaddle2Y(null);
//         setTimeout(() => {
//             setPaddle1Y(paddleMiddlePosition);
//             setPaddle2Y(paddleMiddlePosition);
//             console.log(`Paddle 1 final position: ${paddleMiddlePosition}`);
//             console.log(`Paddle 2 final position: ${paddleMiddlePosition}`);
//         }, 10);
//     }, 10);

//     console.log(`Paddles resetting to middle: ${paddleMiddlePosition}`);
// };

const resetBall = () => {
    console.log("Resetting ball position...");
    setIsResetting(true);

    const initialX = 390; // Target middle X position
    const initialY = 294; // Target middle Y position
    const paddleMiddlePosition = courtHeight / 2 - paddleHeight / 2;

    console.log(`Calculated middle X: ${initialX}, Y: ${initialY}`);
    console.log(`Calculated paddle middle position: ${paddleMiddlePosition}`);

    setBallX(initialX);
    setBallY(initialY);
    setBallVX(0);
    setBallVY(0);
    setPaused(true);

    // Log ball position immediately after setting
    setTimeout(() => {
        console.log(`Ball X after reset: ${ballX}, Ball Y after reset: ${ballY}`);
    }, 10);

    // Update paddle positions
    setPaddle1Y(paddleMiddlePosition);
    setPaddle2Y(paddleMiddlePosition);

    // Force re-render to ensure paddles reset properly
    setTimeout(() => {
        setIsResetting(false);
        setPaddle1Y(null);
        setPaddle2Y(null);

        setTimeout(() => {
            setPaddle1Y(paddleMiddlePosition);
            setPaddle2Y(paddleMiddlePosition);
            console.log(`Paddle 1 final position: ${paddleMiddlePosition}`);
            console.log(`Paddle 2 final position: ${paddleMiddlePosition}`);
        }, 10);
    }, 10);

    console.log(`Paddles resetting to middle: ${paddleMiddlePosition}`);
};


return (
	<div className="pong-wrapper">
	  {/* Use Scoreboard component */}
	  <Scoreboard score1={score1} score2={score2} /> 
  
	  <div ref={gameContainerRef} className="pong-game-container">
		<div className="pong-center-line"></div>
  
		{/* Use Paddle components for left and right paddles */}
		<Paddle position="left" top={paddle1Y ?? 0} />
		<Paddle position="right" top={paddle2Y ?? 0} />
  
		{/* Use Ball component for the ball */}
		<Ball x={ballX} y={ballY} />
	  </div>
	</div>
  );
};
  

export default Pong;
