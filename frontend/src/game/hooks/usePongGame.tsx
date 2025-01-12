import { useState, useEffect, useRef } from "react";

export const usePongGame = () => {
  const [paddle1Y, setPaddle1Y] = useState<number | null>(null); // Paddle position Pl1
  const [paddle2Y, setPaddle2Y] = useState<number | null>(null); // Paddle position Pl2
  const [courtHeight, setCourtHeight] = useState(600); // Height of the game container
  const [isResetting, setIsResetting] = useState(false); // Flag for resetting game state

  const paddleHeight = 100; 
  const paddleSpeed = 20; 

  // Game container reference for accessing dimensions
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const [ballX, setBallX] = useState(390); 
  const [ballY, setBallY] = useState(294); 
  const [ballVX, setBallVX] = useState(0); 
  const [ballVY, setBallVY] = useState(0); 

  const [paused, setPaused] = useState(true);
  const [score1, setScore1] = useState(0); 
  const [score2, setScore2] = useState(0); 

  const [isScoring, setIsScoring] = useState(false); // Prevents duplicate scoring
  const [collisionHandled, setCollisionHandled] = useState(false); // Prevents duplicate collision detection

  // Update the court dimensions and paddle positions on mount and resize
  useEffect(() => {
    const updateContainerMetrics = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        setCourtHeight(rect.height); // Update court height dynamically

        // Center paddles initially
        const paddleMiddlePosition = rect.height / 2 - paddleHeight / 2;
        if (paddle1Y === null) setPaddle1Y(paddleMiddlePosition);
        if (paddle2Y === null) setPaddle2Y(paddleMiddlePosition);
      }
    };

    updateContainerMetrics(); // Initial setup
    window.addEventListener("resize", updateContainerMetrics); // Handle window resizing
    return () => {
      window.removeEventListener("resize", updateContainerMetrics); // Cleanup
    };
  }, [paddle1Y, paddle2Y]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paddle1Y !== null && paddle2Y !== null) {
        // Start the game when any movement key is pressed
        if (paused) {
          setPaused(false);
          setBallVX(5); // Set initial ball velocity
          setBallVY(5);
        }

        // Move paddles based on key pressed
        switch (event.key) {
          case "w": // Move Player 1 paddle up
            setPaddle1Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "s": // Move Player 1 paddle down
            setPaddle1Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight)
            );
            break;
          case "ArrowUp": // Move Player 2 paddle up
            setPaddle2Y((prev) => Math.max((prev ?? 0) - paddleSpeed, 0));
            break;
          case "ArrowDown": // Move Player 2 paddle down
            setPaddle2Y((prev) =>
              Math.min((prev ?? 0) + paddleSpeed, courtHeight - paddleHeight)
            );
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown); // Listen for keydown events
    return () => {
      window.removeEventListener("keydown", handleKeyDown); // Cleanup listener
    };
  }, [courtHeight, paddle1Y, paddle2Y, paused]);

  let scoringInProgress = false; // Prevent multiple scoring triggers at once

  // Handle scoring when the ball reaches the left or right end
  const handleScore = (player: number) => {
    if (scoringInProgress || isScoring) return; // Avoid duplicate scoring events
    scoringInProgress = true;

    setIsScoring(true); // Indicate scoring in progress

    if (player === 1) setScore1((prevScore) => prevScore + 1);
    if (player === 2) setScore2((prevScore) => prevScore + 1);

    resetBall();

    // Allow new scoring after a brief delay
    setTimeout(() => {
      setIsScoring(false);
      scoringInProgress = false;
    }, 1000);
  };

  // Game loop to update ball position and detect collisions
  useEffect(() => {
    const interval = setInterval(() => {
      if (isResetting) return;

      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        const courtWidth = rect.width;

        const paddle1Top = paddle1Y ?? 0;
        const paddle1Bottom = paddle1Top + paddleHeight;
        const paddle2Top = paddle2Y ?? 0;
        const paddle2Bottom = paddle2Top + paddleHeight;

        // Update ball position and handle collisions
        setBallX((prevX) => {
          const newX = prevX + ballVX;

          if (isScoring) return prevX; // Skip updates during scoring

          const predictedBallY = ballY + ballVY;

          // Collision with Player 1 paddle
          if (
            !collisionHandled &&
            newX <= 30 &&
            predictedBallY + 20 >= paddle1Top &&
            predictedBallY <= paddle1Bottom
          ) {
            setBallVX(Math.abs(ballVX)); // Reverse X velocity
            setCollisionHandled(true);
            setTimeout(() => setCollisionHandled(false), 50); // Allow future collisions
            return 31;
          }

          // Collision with Player 2 paddle
          if (
            !collisionHandled &&
            newX >= courtWidth - 50 &&
            predictedBallY + 20 >= paddle2Top &&
            predictedBallY <= paddle2Bottom
          ) {
            setBallVX(-Math.abs(ballVX)); // Reverse X velocity
            setCollisionHandled(true);
            setTimeout(() => setCollisionHandled(false), 50);
            return courtWidth - 51;
          }

          // Check for scoring
          if (!isScoring) {
            if (newX <= 0) {
              handleScore(2);
              return courtWidth / 2 - 10; // Reset ball position
            } else if (newX >= courtWidth - 20) {
              handleScore(1); 
              return courtWidth / 2 - 10;
            }
          }

          return newX;
        });

        // Update ball's Y position and check for wall collisions
        setBallY((prevY) => {
          const newY = prevY + ballVY;

          if (newY <= 0) {
            setBallVY(Math.abs(ballVY)); // Bounce off the top wall
            return 0;
          }

          if (newY >= rect.height - 20) {
            setBallVY(-Math.abs(ballVY)); // Bounce off the bottom wall
            return rect.height - 20;
          }

          return newY;
        });
      }
    }, 16); 

    return () => clearInterval(interval); 
  }, [ballVX, ballVY, ballY, paddle1Y, paddle2Y, collisionHandled, isScoring]);

  // Reset ball and paddles to their initial positions
  const resetBall = () => {
    setIsResetting(true);
    const paddleMiddlePosition = courtHeight / 2 - paddleHeight / 2;

    setBallX(390); 
    setBallY(294); 
    setBallVX(0); 
    setBallVY(0);
    setPaused(true); 

    // Reset paddle positions after a brief delay
    setTimeout(() => {
      setIsResetting(false);
      setPaddle1Y(paddleMiddlePosition);
      setPaddle2Y(paddleMiddlePosition);
    }, 10);
  };

  return {
    gameContainerRef,
    paddle1Y,
    paddle2Y,
    ballX,
    ballY,
    score1,
    score2,
  };
};
