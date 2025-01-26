import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Function to extract user based on token from cookies
async function getUser(req, res, cookies) {
  const accessToken = cookies['accessToken'];

  if (!accessToken) {
    console.log("No access token found.");
    res.writeHead(301, { Location: '/new-route' });
    res.end();
    return;
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.headers['x-user-id'] = decodedToken?._id;
    console.log('Added userId to header:', req.headers['x-user-id']);
  } catch (error) {
    console.error("Error verifying token:", error);
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Invalid or expired token");
  }
}

// Function to parse cookies from request headers
function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  return cookies;
}

// Define Next.js app settings
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  // Socket.io server instance
  const io = new Server();

  const httpServer = createServer(async (req, res) => {
    const cookies = parseCookies(req);

    if (req.url.startsWith("/api/chat") || req.url.startsWith("/api/users/logout")) {
      await getUser(req, res, cookies);
    }

    if (req.url === "/api/chat/create" && req.method === "POST") {
      // Handle the chat creation logic (API processing)
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString(); // Convert chunk to string
      });

      req.on('end', () => {
        const roomId = JSON.parse(body).chatname;  // Assuming the POST request contains roomId
        console.log(`Chat created with room ID: ${roomId}`);

        // Send response to the client confirming the creation
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, roomId }));

        // Emit custom event for room creation *AFTER* response is sent
        io.emit('createRoom', roomId);
      });

      return; // Prevent further processing
    }

    // Handle Next.js requests
    handler(req, res);
  });

  // Handle Socket.io events
  io.attach(httpServer);  // Attach the io instance to the server

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Listen for room creation event (triggered after the API request is completed)
    io.on('createRoom', (roomId) => {
      console.log(`Creating room: ${roomId}`);
      socket.join(roomId);  // Create the room in Socket.io
      console.log(`Room created and user joined room: ${roomId}`);
    });

    // Handle standard message events
    socket.on("message", (message) => {
      console.log("Message:", message);
      io.emit("message", message);  // Broadcast message to everyone
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Start HTTP server
  httpServer.listen(port, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

