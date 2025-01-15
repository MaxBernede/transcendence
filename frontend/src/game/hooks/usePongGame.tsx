import { useState, useEffect, useRef } from "react";
import { usePowerUp } from "./usePowerUp";

export const usePongGame = () => {
  const [paddle1Y, setPaddle1Y] = useState<number>(250);
  const [paddle2Y, setPaddle2Y] = useState<number>(250);
  const paddleHeightBase = 100;
  const [paddleHeight1, setPaddleHeight1] = useState(paddleHeightBase);
  const [paddleHeight2, setPaddleHeight2] = useState(paddleHeightBase);

  const [ballX, setBallX] = useState(390);
  const [ballY, setBallY] = useState(294);
  const [ballVX, setBallVX] = useState(0);
  const [ballVY, setBallVY] = useState(0);

  const [paused, setPaused] = useState(true);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [collisionHandled, setCollisionHandled] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const isScoringRef = useRef(false); // Prevents duplicate scoring
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const paddleSpeed = 20;
  const courtHeight = 600;

  const updatePaddleSize = (player: number) => {
    if (player === 1) {
      setPaddleHeight1((prev) => prev + 50);
      setTimeout(() => setPaddleHeight1(paddleHeightBase), 10000);
    } else if (player === 2) {
      setPaddleHeight2((prev) => prev + 50);
      setTimeout(() => setPaddleHeight2(paddleHeightBase), 10000);
    }
  };

  const { powerUpX, powerUpY, isPowerUpActive, handlePowerUpCollision } = usePowerUp(
    gameContainerRef,
    updatePaddleSize,
    updatePaddleSize,
    true
  );

  const resetBallAndPaddles = () => {
    console.log("Resetting ball and paddles...");

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      // Reset ball, paddles, and unlock scoring
      setBallX(390);
      setBallY(294);
      setBallVX(0);
      setBallVY(0);
      setPaused(true);

      setPaddle1Y(250);
      setPaddle2Y(250);

      isScoringRef.current = false;
      console.log("Reset complete.");
    }, 100); // Ensure this timeout prevents overlapping resets
  };

  const handleScore = (player: number) => {
    if (isScoringRef.current) {
      console.warn(`Scoring blocked for Player ${player}`);
      return;
    }

    isScoringRef.current = true; // Lock scoring
    console.log(`Player ${player} scores! BallX: ${ballX}`);

    if (player === 1) {
      setScore1((prev) => prev + 1);
    } else if (player === 2) {
      setScore2((prev) => prev + 1);
    }

    resetBallAndPaddles();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paused) {
        setPaused(false);
        setBallVX(5);
        setBallVY(5);
      }

      switch (event.key) {
        case "w":
          setPaddle1Y((prev) => Math.max(prev - paddleSpeed, 0));
          break;
        case "s":
          setPaddle1Y((prev) => Math.min(prev + paddleSpeed, courtHeight - paddleHeight1));
          break;
        case "ArrowUp":
          setPaddle2Y((prev) => Math.max(prev - paddleSpeed, 0));
          break;
        case "ArrowDown":
          setPaddle2Y((prev) => Math.min(prev + paddleSpeed, courtHeight - paddleHeight2));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paused, courtHeight, paddleHeight1, paddleHeight2]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        const courtWidth = rect.width;

        setBallX((prevX) => {
          const newX = prevX + ballVX;
          const predictedBallY = ballY + ballVY;

          handlePowerUpCollision(
            paddle1Y,
            paddle1Y + paddleHeight1,
            paddle2Y,
            paddle2Y + paddleHeight2
          );

          if (!collisionHandled && newX <= 30 && predictedBallY >= paddle1Y && predictedBallY <= paddle1Y + paddleHeight1) {
            setBallVX(Math.abs(ballVX));
            setCollisionHandled(true);
            setTimeout(() => setCollisionHandled(false), 50);
            return 31;
          }

          if (!collisionHandled && newX >= courtWidth - 50 && predictedBallY >= paddle2Y && predictedBallY <= paddle2Y + paddleHeight2) {
            setBallVX(-Math.abs(ballVX));
            setCollisionHandled(true);
            setTimeout(() => setCollisionHandled(false), 50);
            return courtWidth - 51;
          }

          if (newX <= 0) {
            handleScore(2);
            return courtWidth / 2 - 10;
          }

          if (newX >= courtWidth - 20) {
            handleScore(1);
            return courtWidth / 2 - 10;
          }

          return newX;
        });

        setBallY((prevY) => {
          const newY = prevY + ballVY;
          if (newY <= 0 || newY >= rect.height - 20) {
            setBallVY(-ballVY);
          }
          return Math.max(0, Math.min(newY, rect.height - 20));
        });
      }
    }, 16);

    return () => clearInterval(interval);
  }, [ballVX, ballVY, ballY, paddle1Y, paddle2Y, collisionHandled]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return {
    gameContainerRef,
    paddle1Y,
    paddle2Y,
    paddleHeight1,
    paddleHeight2,
    ballX,
    ballY,
    powerUpX,
    powerUpY,
    isPowerUpActive,
    score1,
    score2,
  };
};
