import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

export const usePongGame = (
    socket: Socket,
    playerNumber: number,
    roomId: string | null,
    setRoomId: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
  

  const [paddle1Y, setPaddle1Y] = useState(250);
  const [paddle2Y, setPaddle2Y] = useState(250);
  const [paddleHeight1, setPaddleHeight1] = useState(100); 
  const [paddleHeight2, setPaddleHeight2] = useState(100); 
  const [ballPosition, setBallPosition] = useState({ x: 380, y: 294 });
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [powerUpX, setPowerUpX] = useState<number | null>(null);
  const [powerUpY, setPowerUpY] = useState<number | null>(null);
  const [powerUpType, setPowerUpType] = useState<"shrinkOpponent" | "speedBoost" | "enlargePaddle" | null>(null);
  const [isPowerUpActive, setIsPowerUpActive] = useState(false);
  const [ballStarted, setBallStarted] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
      socket.on("powerUpSpawned", (data) => {
          //console.log("Power-up received from server:", data);
          setPowerUpX(data.x);
          setPowerUpY(data.y);
          setPowerUpType(data.type);
          setIsPowerUpActive(true);
      });

      socket.on("powerUpCleared", () => {
          //console.log("Power-up cleared!");
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
          setPowerUpX(data.x);
          setPowerUpY(data.y);
      });

      return () => {
          socket.off("updatePowerUp");
      };
  }, [socket]);

  useEffect(() => {
    socket.on("bothPlayersReady", () => {
        //console.log("Both players are ready! Waiting for confirmation...");
        setWinner(null); // remove pop-up and prepare for new game
    });

    return () => {
        socket.off("bothPlayersReady");
    };
	}, [socket]);
	

	const handleStartGame = () => {
		//console.log("User clicked 'Start Game'");
	
		if (!roomId) {
			console.warn("No room assigned to this player.");
			return;
		}
	
		socket.emit("startGame", { roomId }); // Include room ID
		setWinner(null); // Hide popup
	};
	
    
    useEffect(() => {
        const handleGameRoomUpdate = ({ roomId }: { roomId: string }) => {
          //console.log("received roomId:", roomId);
          setRoomId(roomId);
        };
      
        socket.on("gameRoomUpdate", handleGameRoomUpdate);
      
        return () => {
          socket.off("gameRoomUpdate", handleGameRoomUpdate);
        };
      }, []);
      
	

  // Listen for Paddle Size Change Power-ups
  useEffect(() => {
      socket.on("shrinkPaddle", (data) => {
          if (data.player === 1) setPaddleHeight1((h) => Math.max(h * 0.5, 40));
          if (data.player === 2) setPaddleHeight2((h) => Math.max(h * 0.5, 40));

          setTimeout(() => {
              if (data.player === 1) setPaddleHeight1(100);
              if (data.player === 2) setPaddleHeight2(100);
          }, 7000); //  Restore paddle size after 7 seconds
      });

      socket.on("enlargePaddle", (data) => {
          if (data.player === 1) setPaddleHeight1((h) => Math.min(h * 1.5, 150));
          if (data.player === 2) setPaddleHeight2((h) => Math.min(h * 1.5, 150));

          setTimeout(() => {
              if (data.player === 1) setPaddleHeight1(100);
              if (data.player === 2) setPaddleHeight2(100);
          }, 7000);
      });

      return () => {
          socket.off("shrinkPaddle");
          socket.off("enlargePaddle");
      };
  }, [socket]);

  return {
      gameContainerRef,
      paddle1Y,
      paddle2Y,
      paddleHeight1,
      paddleHeight2,
      ballPosition,
      score1,
      score2,
      winner,
      powerUpX, 
      powerUpY, 
      powerUpType,
      isPowerUpActive,
      ballStarted,
      setBallStarted,
      setPaddle1Y,
      setPaddle2Y,
      setPaddleHeight1,
      setPaddleHeight2,
  };
};