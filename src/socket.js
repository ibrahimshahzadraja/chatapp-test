"use client";

import { io } from "socket.io-client";

export const socket = io(process.env.SOCKET_BACKEND_URL, {secure: true, withCredentials: true, transports: ["websocket"]});