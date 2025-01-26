"use client"
import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function ChatPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [chat, setChat] = useState("");
    const [password, setPassword] = useState("");


    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            setTransport(socket.io.engine.transport.name);
            console.log('Connected:', socket.id);

            socket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });
        }

        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
            console.log('Disconnected');
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    async function createRoom(){
        const res = await fetch("/api/chat/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chatname: chat,
                password
            })
        });
        const data = await res.json();
        console.log(data);
        if(data.success){
            document.getElementById("in").textContent = "Room created: " + data.data;
            setTimeout(() => {
                document.getElementById("in").textContent = "";
            }, 10000);
            socket.emit("joinRoom", data.data);
            setChat("");
        }
    }

    return (
        <>
            <div>
                <p>Status: { isConnected ? "connected" : "disconnected" }</p>
                <p>Transport: { transport }</p>
            </div>
            <div>
                <input type="text" placeholder="Enter room name" className="border-2 border-black" value={chat} onChange={(e) => setChat(e.target.value)} />
                <br />
                <input type="text" placeholder="Enter room password" className="border-2 border-black" value={password} onChange={(e) => setPassword(e.target.value)} />
                <br />
                <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={createRoom}>Create Room</button>
                <p id='in'></p>
            </div>
        </>
    );
}