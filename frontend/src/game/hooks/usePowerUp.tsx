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
  socket: Socket,
  setPaddleHeight1: React.Dispatch<React.SetStateAction<number>>, 
  setPaddleHeight2: React.Dispatch<React.SetStateAction<number>>
): UsePowerUpReturn => {
  const [powerUpX, setPowerUpX] = useState<number | null>(null);
  const [powerUpY, setPowerUpY] = useState<number | null>(null);
  const [powerUpType, setPowerUpType] = useState<"shrinkOpponent" | "speedBoost" | "enlargePaddle" | null>(null);
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);

  // WebSocket: Listen for power-up events from the server
  useEffect(() => {
    socket.on("powerUpSpawned", (data) => {
        console.log(" Power-up received from server:", data);
        setPowerUpX(data.x);
        setPowerUpY(data.y);
        setPowerUpType(data.type);
        setIsPowerUpActive(true);
    });

    socket.on("powerUpCleared", () => {
        console.log("Power-up cleared!");
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
    socket.on("updatePowerUp", (data) => {
        console.log("Power-up movement update received:", data);
        setPowerUpX(data.x);
        setPowerUpY(data.y);
    });

    return () => {
        socket.off("updatePowerUp");
    };
  }, [socket]);


  useEffect(() => {
    socket.on("shrinkPaddle", (data) => {
        console.log(`Shrinking Player ${data.player}'s paddle`);
        
        if (data.player === 1) {
            setPaddleHeight1((h: number) => Math.max(h * 0.5, 40)); 
        } else if (data.player === 2) {
            setPaddleHeight2((h: number) => Math.max(h * 0.5, 40));
        }

        setTimeout(() => {
            console.log(`⏳ Restoring Player ${data.player}'s paddle size after 7 seconds`);
            if (data.player === 1) setPaddleHeight1(100);
            if (data.player === 2) setPaddleHeight2(100);
        }, 7000);
    });

    socket.on("enlargePaddle", (data) => {
        console.log(`Enlarging Player ${data.player}'s paddle`);

        if (data.player === 1) {
            setPaddleHeight1((h: number) => Math.min(h * 1.5, 150));
        } else if (data.player === 2) {
            setPaddleHeight2((h: number) => Math.min(h * 1.5, 150));
        }

        setTimeout(() => {
            console.log(`⏳ Restoring Player ${data.player}'s paddle size after 7 seconds`);
            if (data.player === 1) setPaddleHeight1(100);
            if (data.player === 2) setPaddleHeight2(100);
        }, 7000);
    });

    return () => {
        socket.off("shrinkPaddle");
        socket.off("enlargePaddle");
    };
  }, [socket, setPaddleHeight1, setPaddleHeight2]);

  return {
    powerUpX,
    powerUpY,
    powerUpType,
    isPowerUpActive,
    handlePowerUpCollision: (paddle1Top, paddle1Bottom, paddle2Top, paddle2Bottom) => {
      if (!isPowerUpActive || powerUpX === null || powerUpY === null) return;

      if (powerUpX <= 30 && powerUpY >= paddle1Top && powerUpY <= paddle1Bottom) {
        onPowerUpCollected(1, powerUpType!);
        setIsPowerUpActive(false);
        socket.emit("powerUpCollected", { player: 1 });
        return;
      }

      if (powerUpX >= gameContainerRef.current!.getBoundingClientRect().width - 50 &&
          powerUpY >= paddle2Top &&
          powerUpY <= paddle2Bottom) {
        onPowerUpCollected(2, powerUpType!);
        setIsPowerUpActive(false);
        socket.emit("powerUpCollected", { player: 2 });
      }
    }
  };
};
