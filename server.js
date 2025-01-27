import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

async function getUser(req, res, cookies) {
  const accessToken = cookies['accessToken'];

  if (!accessToken) {
    console.log("No access token found.");
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Unauthorized", data: null, status: 401, success: false }));
    return;
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.headers['x-user-id'] = decodedToken?._id;
    console.log('Added userId to header:', req.headers['x-user-id']);
  } catch (error) {
    console.error("Error verifying token");
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Unauthorized", data: null, status: 401, success: false }));
  }
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  return cookies;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "chatapp-test-ashy.vercel.app";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const cookies = parseCookies(req);
    
    if (req.url.startsWith("/api/chat") || req.url.startsWith("/api/users/logout") || req.url.startsWith("/api/users/getUser") || req.url.startsWith("/api/message")) {
      await getUser(req, res, cookies);
    }

    handler(req, res);
  });

  const io = new Server(httpServer);

  global.io = io;

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinRoom", (chatname) => {
      socket.join(chatname);
      console.log(`User joined room: ${chatname}`);
    })

    socket.on("leaveRoom", (chatname) => {
      socket.leave(chatname);
      console.log(`User left room: ${chatname}`);
    });

    socket.on("sendMessage", ({ chatname, username, message }) => {
      console.log(`Message sent to room ${chatname}: ${message}`);
      socket.to(chatname).emit("message", username, message);
    });

    socket.on("deleteChat", (chatname) => {
      const socketsInRoom = io.sockets.adapter.rooms.get(chatname);

      if(socketsInRoom){
        socket.to(chatname).emit("roomDeleted", `Room ${chatname} has been deleted.`);
        for(const socketId of socketsInRoom){
          const socketToDisconnect = io.sockets.sockets.get(socketId);
          socketToDisconnect.leave(chatname);
        }
      }
    })

    socket.on("message", (message) => {
      console.log("Message:", message);
      io.emit("message", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  httpServer.listen(port, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
