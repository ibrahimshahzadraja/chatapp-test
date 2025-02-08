"use client"
import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [chat, setChat] = useState("");
    const [password, setPassword] = useState("");
    const [rooms, setRooms] = useState([]);

    const router = useRouter();

    async function createRoom(){
        const formData = new FormData(document.getElementById('create-room-form'));

        const res = await fetch("/api/chat/create", {
            method: "POST",
            body: formData
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
            setPassword("");
        }
    }

    async function getRooms() {
        const res = await fetch("/api/chat/getAll", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        console.log(data);
        if(data.success){
            setRooms(data.data);
        }
    }


    useEffect(() => {
        async function auth(){
            const res = await fetch("/api/users/getUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const data = await res.json();
            if(!data.success){
                const res = await fetch("/api/users/tokenRefresh", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                });
                const data = await res.json();
                if(!data.success){
                    router.push("/login");
                    return false;
                }
            }
            return true;
        }
        auth().then((val) => {
            if(val){
                getRooms();
            }
        });

    }, [])

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

    return (
        <>
            <div>
                <p>Status: { isConnected ? "connected" : "disconnected" }</p>
                <p>Transport: { transport }</p>
            </div>
            <div>
                <form id='create-room-form'>
                    <input type="text" id='chatname' name='chatname' placeholder="Enter room name" className="border-2 border-black" value={chat} onChange={(e) => setChat(e.target.value)} />
                    <br />
                    <input type="text" id='password' name='password' placeholder="Enter room password" className="border-2 border-black" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <br />
                    <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={createRoom}>Create Room</button>
                </form>
                <p id='in'></p>
                {
                    rooms.map((r, index) => {
                        return(
                            <div key={index} className='cursor-pointer border-2 border-black m-1 p-1 sm:w-[250px] w-5/6 box-border h-20' >
                                <Link href={`/chat/${r.chatname}`}>
                                    <div className='flex h-full'>
                                        <img src={r.profilePicture} alt="image" className='h-full w-20 rounded-full' />
                                        <div className='ml-2'>
                                            <p>{r.chatname}</p>
                                            <p>{r.sendByUsername ? `${r.sendByUsername}:` : ""}{r.messageText ? r.messageText : r.image ? "image" : r.voice ? "voice" : ""}</p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )
                    })
                }
            </div>
        </>
    );
}