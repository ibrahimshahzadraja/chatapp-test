"use client"
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socket } from '@/socket';

export default function Chat() {

  const { chatname } = useParams();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();

    useEffect(() => {
        async function getUsername(){
            const res = await fetch("/api/users/getUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const data = await res.json();

            if(data.success){
                setUsername(data.data);
            }
        }
        getUsername();

    }, []);

    async function sendSystemMessage(text) {
      const response = await fetch("/api/message/systemMessage", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, text, id: "NULL"}),
      });
  
      const data = await response.json();
    }

  const joinRoom = async () => {
    const response = await fetch("/api/chat/join", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({chatname, password}),
    });
    const data = await response.json();
    
    if(data.success){
        socket.emit("userJoined", {chatname, username, text: `${username} joined the chat`});
        await sendSystemMessage(`${username} joined the chat`);
      router.push(`/chat/${chatname}`);
    } else{
      console.log(data.message)
    }
    setPassword("");
  }

  return (
    <>
        <div>Chatname: {chatname}</div>
        <input type="password" placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={joinRoom} className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white">Join Room</button>
    </>
  )
}
