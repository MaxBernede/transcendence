import { useState, useEffect, useRef } from "react";
import { usePowerUp } from "./usePowerUp";
import { useShrinkPaddle } from "./useShrinkPaddle";

export const usePongGame = () => {
  const [paddle1Y, setPaddle1Y] = useState<number>(250);
  const [paddle2Y, setPaddle2Y] = useState<number>(250);
  const paddleHeightBase = 100;
  const [paddleHeight1, setPaddleHeight1] = useState(paddleHeightBase);
  const [paddleHeight2, setPaddleHeight2] = useState(paddleHeightBase);

  const [ballX, setBallX] = useState(390);
  const [ballY, setBallY] = useState(294);
  const [ballVX, setBallVX] = useState(5);
  const [ballVY, setBallVY] = useState(5);

  const [paused, setPaused] = useState(true);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [collisionHandled, setCollisionHandled] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const isScoringRef = useRef(false); // Prevents duplicate scoring
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const paddleSpeed = 20;
  const courtHeight = 600;
  const targetBallSpeed = 5; // Desired constant ball speed

  // Function to normalize ball velocity to maintain consistent speed
  const normalizeSpeed = (vx: number, vy: number, targetSpeed: number) => {
    const currentSpeed = Math.sqrt(vx ** 2 + vy ** 2);
    if (currentSpeed === 0) return { vx: targetSpeed, vy: 0 }; // Prevent divide-by-zero
    const scale = targetSpeed / currentSpeed;
    return { vx: vx * scale, vy: vy * scale };
  };

  // Integrate the shrink paddle hook
  const { shrinkPaddle } = useShrinkPaddle(
    paddleHeightBase,
    setPaddleHeight1,
    setPaddleHeight2
  );

  // Integrate the power-up hook
  const { powerUpX, powerUpY, powerUpType, isPowerUpActive, handlePowerUpCollision } = usePowerUp(
    gameContainerRef,
    (player, type) => {
      if (type === "shrinkOpponent") {
        console.log(`Power-up collected by Player ${player}. Shrinking opponent's paddle.`);
        if (player === 1) shrinkPaddle(2);
        else if (player === 2) shrinkPaddle(1);
      } else if (type === "speedBoost") {
        console.log(`Player ${player} collected speed boost.`);
        const boostMultiplier = 1.2;
        setBallVX((prev) => prev * boostMultiplier);
        setBallVY((prev) => prev * boostMultiplier);

        setTimeout(() => {
          const { vx, vy } = normalizeSpeed(ballVX, ballVY, targetBallSpeed);
          setBallVX(vx);
          setBallVY(vy);
        }, 5000);
      } else if (type === "enlargePaddle") {
        console.log(`Power-up collected by Player ${player}. Enlarging their paddle.`);
        if (player === 1) setPaddleHeight1((prev) => prev + 50);
        else if (player === 2) setPaddleHeight2((prev) => prev + 50);

        setTimeout(() => {
          if (player === 1) setPaddleHeight1(paddleHeightBase);
          else if (player === 2) setPaddleHeight2(paddleHeightBase);
        }, 5000);
      }
    },
    true
  );

  // Reset ball and paddles
  const resetBallAndPaddles = () => {
    console.log("Resetting ball and paddles...");

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      setBallX(390);
      setBallY(294);
      const { vx, vy } = normalizeSpeed(0, 0, targetBallSpeed); // Reset with zero velocity
      setBallVX(vx);
      setBallVY(vy);
      setPaused(true); // Pause the game until a key is pressed

      setPaddle1Y(250);
      setPaddle2Y(250);

      isScoringRef.current = false;
      console.log("Reset complete.");
    }, 100);
  };

  // Handle scoring
  const handleScore = (player: number) => {
    if (isScoringRef.current) {
      console.warn(`Scoring blocked for Player ${player}`);
      return;
    }

    isScoringRef.current = true;
    console.log(`Player ${player} scores! BallX: ${ballX}`);

    if (player === 1) {
      setScore1((prev) => prev + 1);
    } else if (player === 2) {
      setScore2((prev) => prev + 1);
    }

    resetBallAndPaddles();
  };

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (paused) {
        setPaused(false);
        const { vx, vy } = normalizeSpeed(5, 5, targetBallSpeed); // Ensure normalized speed
        setBallVX(vx);
        setBallVY(vy);
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

  // Ball movement and collision logic
  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      if (gameContainerRef.current && !paused) {
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
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, [ballVX, ballVY, ballY, paddle1Y, paddle2Y, collisionHandled, paused]);

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
    powerUpType,
    isPowerUpActive,
    score1,
    score2,
  };
};
