import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns a singleton client-side Socket.io instance.
 * Automatically connects to the current host origin or NEXT_PUBLIC_APP_URL.
 */
export function getSocket(userId?: string): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      query: userId ? { userId } : undefined,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server:", socket?.id);
      if (userId) {
        socket?.emit("join:user", userId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.io] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket.io] Connection error:", err.message);
    });
  } else if (userId && socket.connected) {
    socket.emit("join:user", userId);
  }

  return socket;
}

/**
 * Explicitly disconnects and cleans up the active socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
