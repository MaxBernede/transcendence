// eventsHandler.ts
import { io, Socket } from "socket.io-client";

// enum EventType {
//   USER_ADDED_TO_CHAT = "USER_ADDED_TO_CHAT",
// }

class EventsHandler {
  private static instance: EventsHandler;
  private socket: Socket | null = null;

  private constructor() {
    this.socket = io("http://localhost:3000/events", {
      withCredentials: true,
    });
    // this.socket = io("http://localhost:3000/events", {
    //   withCredentials: true,
    //   reconnection: true, // Enable reconnection
    //   reconnectionAttempts: Infinity, // Try to reconnect indefinitely
    //   reconnectionDelay: 1000, // Delay between reconnection attempts (1 second)
    //   reconnectionDelayMax: 5000, // Max delay between reconnection attempts (5 seconds)
    //   randomizationFactor: 0.5, // Random factor for reconnection delay
    // });

    this.setupListeners();
  }

  public static getInstance(): EventsHandler {
    if (!EventsHandler.instance) {
      EventsHandler.instance = new EventsHandler();
    }
    return EventsHandler.instance;
  }

	public isReady(): boolean {
		return this.socket?.connected ?? false;
	}

  public getSocket(): Socket | null {
    return this.socket;
  }

  // Set up all listeners in one place
  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    //? Add any global listeners here, notifications?

    // this.socket.on(EventType.USER_ADDED_TO_CHAT, (data: any) => {
    //   console.log(`${EventType.USER_ADDED_TO_CHAT} received:`, data);
    // });

    // Add more listeners as needed
    // this.socket.on("serverToClientEvents", (data: any) => {
    //   console.log("Received event from server:", data);
    // });

    // this.socket.on("notification", (message: string) => {
    //   console.log("Notification received:", message);
    // });

    // this.socket.on("USER_ADDED_TO_CHAT", (message: string) => {
    // 	console.log("USER_ADDED_TO_CHAT received:", message);
    //   });
  }

  public emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default EventsHandler;
