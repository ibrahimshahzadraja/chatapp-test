"use client"
import { useEffect, useState } from 'react';
import { socket } from '../socket';
import Link from 'next/link';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { BsSearch } from "react-icons/bs";

export default function ChatPage() {
    const [chatname, setChatname] = useState("");
    const [password, setPassword] = useState("");
    const [rooms, setRooms] = useState([]);


    async function createRoom(){
        const formData = new FormData(document.getElementById('create-room-form'));

        const res = await fetch("/api/chat/create", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        
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
        
        if(data.success){
            setRooms(data.data);
        }
    }

    useEffect(() => {
        getRooms();
    }, [])

    return (
        <>
            <div className='sm:px-8 px-4'>
                <div className='flex justify-between items-center mt-10'>
                    <h1 className='text-3xl font-semibold text-[#504F50]'>Secret Convos</h1>
                    <IoChatbubbleEllipsesOutline className='text-[#504F50] h-8 w-8' />
                </div>
                <div className='relative'>
                    <input type="text" placeholder='Join a Convo...' value={chatname} onChange={(e) => setChatname(e.target.value)} className='bg-[#1F1F1F] my-4 rounded-2xl px-2 py-2 sm:text-lg w-full text-[#919191] placeholder:text-[#504F50] font-semibold' />
                    <Link href={chatname === "" ? "" : `/join/${chatname}`}>
                        <BsSearch className='text-[#504F50] h-6 w-6 absolute right-0 top-6 mx-4 cursor-pointer' />
                    </Link>
                </div>
                <div className='my-4 flex flex-col items-center'>
                    {rooms.map((r, index) => {
                        return(
                            <Link href={`/chat/${r.chatname}`} className='w-full' key={index}>
                                <div className='sm:h-32 h-20 bg-[#1F1F1F] sm:px-3 px-1 sm:py-5 py-2 sm:w-[600px] w-full rounded-3xl border-[1px] border-[#3b3b3b] flex items-center mx-auto'>
                                    <img src={r.profilePicture} alt="image" className='h-full rounded-full sm:ml-4 ml-2' />
                                    <div className='sm:ml-8 ml-3'>
                                        <p className='text-[#C8C8C8] font-medium sm:text-lg text-sm'>{r.chatname}</p>
                                        <p><span className='text-[#4A494C] sm:text-base text-sm font-medium'>{r.sendByUsername ? `${r.sendByUsername}:` : ""}</span><span className='text-white sm:font-semibold sm:text-base text-sm mx-2'>{r.messageText ? r.messageText.slice(0, 20) + "..." : r.image ? "image" : r.voice ? "voice" : ""}</span></p>
                                    </div>
                                </div>
                            </Link>
                            )
                        })
                    }
                </div>
            </div>
        </>
    );
}