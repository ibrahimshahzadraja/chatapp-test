"use client"
import React, {useRef} from 'react'
import { socket } from '@/socket';
import Link from 'next/link';

export default function AdminSideMenu({setChatDetails, chatname}) {

    const backgroundImageRef = useRef(null);

    async function setBackgroundImage(e) {
        const file = e.target.files[0];

        const formData = new FormData()
        formData.append('backgroundImage', file);
        formData.append('chatname', chatname);

        const response = await fetch("/api/chat/changeBackgroundImage", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

        if(data.success){
            socket.emit("backgroundImageChanged", {chatname, backgroundImage: data.data});
            setChatDetails(p => ({...p, backgroundImage: data.data}));
        }

        if (backgroundImageRef.current) {
            backgroundImageRef.current.value = null;
        }
    }

  return (
    <div className={`w-28 bg-[#200F2F] rounded-md select-none absolute right-16 flex flex-col z-50 divide-y divide-gray-700`}>
            <Link href={`/chat/${chatname}/edit-chat`}>
                <p className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>Edit Convo</p>
            </Link>
            <div className='relative hover:bg-[#2d1846] rounded-sm transition-colors'>
                <p className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>Change Chat Background</p>
                <input 
                    type="file" 
                    accept="image/*"
                    className='absolute inset-0 opacity-0 cursor-pointer'
                    ref={backgroundImageRef}
                    onChange={setBackgroundImage}
                />
            </div>
        </div>
  )
}
