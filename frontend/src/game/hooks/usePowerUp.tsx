import { useState, useEffect, useCallback } from "react";

export const usePowerUp = (
  gameContainerRef: React.RefObject<HTMLDivElement>,
  onPowerUpHit: (player: number) => void,
  updatePaddleSize: (player: number) => void,
  enablePowerUps = true
) => {
  const powerUpSize = 20;
  const [powerUp, setPowerUp] = useState({
    x: null as number | null,
    y: null as number | null,
    vx: 2,
    vy: 2,
    isActive: false,
  });

  // Function to spawn a power-up
  const spawnPowerUp = useCallback(() => {
    if (!enablePowerUps || powerUp.isActive) return;

    const rect = gameContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const spawnX = Math.random() * (rect.width - powerUpSize);
    const spawnY = Math.random() * (rect.height - powerUpSize);

    setPowerUp({
      x: spawnX,
      y: spawnY,
      vx: (Math.random() > 0.5 ? 1 : -1) * 2,
      vy: (Math.random() > 0.5 ? 1 : -1) * 2,
      isActive: true,
    });

    // Power-up disappears after 10 seconds if not collected
    setTimeout(() => {
      setPowerUp((prev) => ({ ...prev, isActive: false }));
    }, 10000);
  }, [enablePowerUps, powerUp.isActive, gameContainerRef]);

  // Spawn power-ups periodically
  useEffect(() => {
    const interval = setInterval(spawnPowerUp, 15000); // Spawn every 15 seconds
    return () => clearInterval(interval);
  }, [spawnPowerUp]);

  // Move the power-up
  useEffect(() => {
    if (!powerUp.isActive || powerUp.x === null || powerUp.y === null) return;

    const movePowerUp = () => {
      const rect = gameContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setPowerUp((prev) => {
        if (prev.x === null || prev.y === null) return prev;

        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVX = prev.vx;
        let newVY = prev.vy;

        // Bounce off the walls
        if (newX <= 0 || newX >= rect.width - powerUpSize) {
          newVX = -newVX;
          newX = Math.max(0, Math.min(rect.width - powerUpSize, newX));
        }
        if (newY <= 0 || newY >= rect.height - powerUpSize) {
          newVY = -newVY;
          newY = Math.max(0, Math.min(rect.height - powerUpSize, newY));
        }

        return { ...prev, x: newX, y: newY, vx: newVX, vy: newVY };
      });
    };

    const animationFrame = requestAnimationFrame(movePowerUp);
    return () => cancelAnimationFrame(animationFrame);
  }, [powerUp.isActive, powerUp.x, powerUp.y, gameContainerRef]);

  // Handle collision with paddles
  const handlePowerUpCollision = useCallback(
	(
	  paddle1Top: number,
	  paddle1Bottom: number,
	  paddle2Top: number,
	  paddle2Bottom: number
	) => {
	  if (!powerUp.isActive || powerUp.x === null || powerUp.y === null) return;
  
	  console.log("Collision check initiated for power-up");
  
	  const rect = gameContainerRef.current?.getBoundingClientRect();
	  if (!rect) return;
  
	  const paddle1Left = 0;
	  const paddle1Right = 30;
	  const paddle2Left = rect.width - 50;
	  const paddle2Right = rect.width;
  
	  const checkCollision = (
		powerUpX: number,
		powerUpY: number,
		paddleLeft: number,
		paddleRight: number,
		paddleTop: number,
		paddleBottom: number
	  ) =>
		powerUpX + powerUpSize >= paddleLeft &&
		powerUpX <= paddleRight &&
		powerUpY + powerUpSize >= paddleTop &&
		powerUpY <= paddleBottom;
  
	  if (
		checkCollision(
		  powerUp.x,
		  powerUp.y,
		  paddle1Left,
		  paddle1Right,
		  paddle1Top,
		  paddle1Bottom
		)
	  ) {
		console.log("Power-up collected by Player 1");
		onPowerUpHit(1);
		updatePaddleSize(1);
		setPowerUp((prev) => ({ ...prev, isActive: false }));
	  } else if (
		checkCollision(
		  powerUp.x,
		  powerUp.y,
		  paddle2Left,
		  paddle2Right,
		  paddle2Top,
		  paddle2Bottom
		)
	  ) {
		console.log("Power-up collected by Player 2");
		onPowerUpHit(2);
		updatePaddleSize(2);
		setPowerUp((prev) => ({ ...prev, isActive: false }));
	  }
	},
	[powerUp, onPowerUpHit, updatePaddleSize, gameContainerRef]
  );  
  

  return {
    powerUpX: powerUp.x,
    powerUpY: powerUp.y,
    isPowerUpActive: powerUp.isActive,
    handlePowerUpCollision,
  };
};
