"use client";

import { io } from "socket.io-client";

export const socket = io('https://chatapp-backend-production-40ec.up.railway.app', {secure: true, withCredentials: true, transports: ["websocket"]});