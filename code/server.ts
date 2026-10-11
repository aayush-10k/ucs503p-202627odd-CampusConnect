import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const handshakeUserId = socket.handshake.query.userId as string | undefined;
    if (handshakeUserId) {
      socket.join(`user:${handshakeUserId}`);
    }

    // Join personal user notification & messaging room
    socket.on("join:user", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join 1-on-1 private chat room between two users
    socket.on("join:chat", ({ userA, userB }: { userA: string; userB: string }) => {
      if (userA && userB) {
        const roomId = [userA, userB].sort().join(":");
        socket.join(`chat:${roomId}`);
      }
    });

    // Real-time message dispatch
    socket.on(
      "message:send",
      (data: {
        id: string;
        senderId: string;
        receiverId: string;
        content: string;
        imageUrl?: string | null;
        createdAt: string;
        sender: { id: string; name: string; avatar?: string | null; role: string };
      }) => {
        if (!data || !data.senderId || !data.receiverId) return;

        const roomId = [data.senderId, data.receiverId].sort().join(":");
        // Broadcast to the conversation room (both users if active in chat)
        io.to(`chat:${roomId}`).emit("message:new", data);
        // Also emit to the receiver's personal room for badge/toast updates
        io.to(`user:${data.receiverId}`).emit("message:notification", data);
      }
    );

    // Typing presence indicators
    socket.on(
      "typing:start",
      ({
        senderId,
        receiverId,
        userName,
      }: {
        senderId: string;
        receiverId: string;
        userName: string;
      }) => {
        if (senderId && receiverId) {
          const roomId = [senderId, receiverId].sort().join(":");
          socket.to(`chat:${roomId}`).emit("typing:start", { senderId, userName });
        }
      }
    );

    socket.on(
      "typing:stop",
      ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
        if (senderId && receiverId) {
          const roomId = [senderId, receiverId].sort().join(":");
          socket.to(`chat:${roomId}`).emit("typing:stop", { senderId });
        }
      }
    );

    // Global in-app notification dispatch
    socket.on(
      "notification:emit",
      ({ userId, notification }: { userId: string; notification: unknown }) => {
        if (userId) {
          io.to(`user:${userId}`).emit("notification:new", notification);
        }
      }
    );

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  httpServer.listen(port, () => {
    console.log(`> CampusConnect HTTP + Socket.io Server active on http://${hostname}:${port}`);
  });
});
