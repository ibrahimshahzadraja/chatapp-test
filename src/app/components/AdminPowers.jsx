"use client"
import React from 'react'
import { socket } from '@/socket';

export default function AdminPowers({ isVisible, member, setChatDetails, chatname, setShowAdminSideMenu }) {

  async function sendSystemMessage(text) {
    const response = await fetch("/api/message/systemMessage", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, text, id:"NULL"}),
    });

    const data = await response.json();
}

async function kick(username) {
    const response = await fetch("/api/chat/kick", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, username}),
    });
    const data = await response.json();

    if(data.success){
        setChatDetails(prevDetails => ({
            ...prevDetails,
            memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
        }));
        socket.emit("kicked", {chatname, username, userAdmin: data.data.user});
        await sendSystemMessage(`${data.data.user} kicked ${username}`);
    }
}

async function ban(username, type) {
    const response = await fetch("/api/chat/ban", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, username}),
    });
    const data = await response.json();

    if(data.success){
        setChatDetails(prevDetails => ({
          ...prevDetails,
          memberDetails: prevDetails.memberDetails.map(member => 
              member.username === username 
                  ? {...member, isBanned: type === "Ban"}
                  : member
          )
        }));
        socket.emit("banned", {chatname, username, type, userAdmin: data.data.user});
        await sendSystemMessage(`${data.data.user} ${type == "Ban" ? "banned" : "unbanned"} ${username}`);
    }
}

async function toggleAdmin(username, type) {
    const response = await fetch("/api/chat/makeAdmin", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, username}),
    });
    const data = await response.json();

    if(data.success){
        setShowAdminSideMenu(p => !p);
        setChatDetails(prevDetails => ({
            ...prevDetails,
            memberDetails: prevDetails.memberDetails.map(member => 
                member.username === username 
                    ? {...member, isAdmin: type === "Make"}
                    : member
            )
        }));
        socket.emit("admin", {chatname, username, type});
        await sendSystemMessage(`${username} ${type == "Make" ? "is now an Admin" : "has been removed as Admin"}`);
    }
}

  return (
    <div className={`w-28 bg-[#200F2F] rounded-md absolute right-16 flex flex-col z-50 divide-y divide-gray-700 ${isVisible ? "block" : "hidden"}`}>
        {(!member.isBanned && !member.isAdmin) && <p onClick={() => kick(member.username)} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>Kick</p>}
        {(!member.isAdmin || member.isBanned) && <p onClick={() => ban(member.username, member.isBanned?"Unban":"Ban")} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>{member.isBanned? "Unban" : "Ban"}</p>}
        {!member.isBanned && <p onClick={() => toggleAdmin(member.username, member.isAdmin?"Remove":"Make")} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer text-sm hover:bg-[#2d1846] transition-colors'>{member.isAdmin? "Remove Admin": "Make Admin"}</p>}
    </div>
  )
}
