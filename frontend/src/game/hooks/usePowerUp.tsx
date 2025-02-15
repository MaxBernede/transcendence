import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

type UsePowerUpReturn = {
  powerUpX: number | null;
  powerUpY: number | null;
  powerUpType: "shrinkOpponent" | "speedBoost" | "enlargePaddle" | null;
  isPowerUpActive: boolean;
  handlePowerUpCollision: (
    paddle1Top: number,
    paddle1Bottom: number,
    paddle2Top: number,
    paddle2Bottom: number
  ) => void;
};

export const usePowerUp = (
  gameContainerRef: React.RefObject<HTMLDivElement>,
  onPowerUpCollected: (player: number, type: "shrinkOpponent" | "speedBoost" | "enlargePaddle") => void,
  enableMovement: boolean = true,
  socket: Socket // ✅ Added WebSocket as a parameter
): UsePowerUpReturn => {
  const [powerUpX, setPowerUpX] = useState<number | null>(null);
  const [powerUpY, setPowerUpY] = useState<number | null>(null);
  const [powerUpType, setPowerUpType] = useState<"shrinkOpponent" | "speedBoost" | "enlargePaddle" | null>(null);
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);
  const [powerUpVX, setPowerUpVX] = useState(3);
  const [powerUpVY, setPowerUpVY] = useState(2);

  // ✅ WebSocket: Listen for power-up events from the server
  useEffect(() => {
    socket.on("powerUpSpawned", (data) => {
      console.log("Power-up received from server:", data);
      setPowerUpX(data.x);
      setPowerUpY(data.y);
      setPowerUpType(data.type);
      setIsPowerUpActive(true);
    });

    socket.on("powerUpCleared", () => {
      setPowerUpX(null);
      setPowerUpY(null);
      setPowerUpType(null);
      setIsPowerUpActive(false);
    });

    return () => {
      socket.off("powerUpSpawned");
      socket.off("powerUpCleared");
    };
  }, [socket]);

  useEffect(() => {
    if (!enableMovement || !isPowerUpActive) return;

    const movePowerUp = () => {
      setPowerUpX((prevX) => {
        if (prevX === null || !gameContainerRef.current) return prevX;

        const rect = gameContainerRef.current.getBoundingClientRect();
        const nextX = prevX + powerUpVX;

        if (nextX <= 0 || nextX >= rect.width - 30) {
          setPowerUpVX(-powerUpVX);
        }

        return Math.max(0, Math.min(nextX, rect.width - 30));
      });

      setPowerUpY((prevY) => {
        if (prevY === null || !gameContainerRef.current) return prevY;

        const rect = gameContainerRef.current.getBoundingClientRect();
        const nextY = prevY + powerUpVY;

        if (nextY <= 0 || nextY >= rect.height - 30) {
          setPowerUpVY(-powerUpVY);
        }

        return Math.max(0, Math.min(nextY, rect.height - 30));
      });
    };

    const interval = setInterval(movePowerUp, 16);
    return () => clearInterval(interval);
  }, [enableMovement, isPowerUpActive, powerUpVX, powerUpVY, gameContainerRef]);

  const handlePowerUpCollision = (
    paddle1Top: number,
    paddle1Bottom: number,
    paddle2Top: number,
    paddle2Bottom: number
  ) => {
    if (!isPowerUpActive || powerUpX === null || powerUpY === null) return;

    if (powerUpX <= 30 && powerUpY >= paddle1Top && powerUpY <= paddle1Bottom) {
      onPowerUpCollected(1, powerUpType!);
      setIsPowerUpActive(false);
      socket.emit("powerUpCollected", { player: 1 }); // ✅ Notify server
      return;
    }

    if (
      powerUpX >= gameContainerRef.current!.getBoundingClientRect().width - 50 &&
      powerUpY >= paddle2Top &&
      powerUpY <= paddle2Bottom
    ) {
      onPowerUpCollected(2, powerUpType!);
      setIsPowerUpActive(false);
      socket.emit("powerUpCollected", { player: 2 }); // ✅ Notify server
    }
  };

  return {
    powerUpX,
    powerUpY,
    powerUpType,
    isPowerUpActive,
    handlePowerUpCollision,
  };
};
