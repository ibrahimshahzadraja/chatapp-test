"use client"
import React from 'react'
import { socket } from '@/socket';

export default function AdminBoard({chatname, usernames, banned, setShowAdminBoard}) {


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
      console.log(data)

      if(data.success){
        socket.emit("kicked", {chatname, username});
        await sendSystemMessage(`Admin kicked ${username}`);
      }
  }

  async function ban(username, type) {
    console.log(type);
  const response = await fetch("/api/chat/ban", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({chatname, username}),
    });
    const data = await response.json();
    console.log(data)

    if(data.success){
      socket.emit("banned", {chatname, username, type});
      await sendSystemMessage(`Admin ${type == "Ban" ? "banned" : "unbanned"} ${username}`);
    }
  }

  return (
    <div className='w-[100vw] h-[100vh] bg-slate-50 fixed top-0 right-0 grid place-items-center z-10'>
      <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={() => setShowAdminBoard(a => !a)}>Close</button>
      <div className='min-w-[300px] w-3/4 sm:w-1/3 max-w-[600px] min-h-[400px] overflow-y-auto bg-gray-200'>
          {usernames.map((username, index) => 
            <div key={index} className='flex items-center justify-between mx-2'>
              <span className='my-2 mx-4 text-xl font-medium'>{username}</span>
              <div>
                {!banned.includes(username) && <button onClick={() => kick(username)} className='px-3 py-1 cursor-pointer m-1 bg-red-800 text-white w-20'>Kick</button>}
                <button onClick={() => ban(username, banned.includes(username) ? "Unban" : "Ban")} className='px-3 py-1 cursor-pointer m-1 bg-red-800 text-white w-20'>{banned.includes(username) ? "Unban" : "Ban"}</button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
