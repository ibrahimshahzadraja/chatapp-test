"use client";

import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {secure: true, withCredentials: true, transports: ["websocket"]});