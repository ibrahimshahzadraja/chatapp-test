"use client"
import { socket } from '@/socket';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Chat() {

  const { chatname } = useParams();
  const [password, setPassword] = useState("");

  const router = useRouter();

  const joinRoom = async () => {
    setPassword("");
    const response = await fetch("/api/chat/join", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({chatname, password}),
    });
    const data = await response.json();

    if(data.success){
      console.log("You joined the room")
      router.push(`/chat/${chatname}`);
    } else{
      console.log(data.message)
    }
  }

  return (
    <>
        <div>Chatname: {chatname}</div>
        <input type="password" placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
    </>
  )
}
