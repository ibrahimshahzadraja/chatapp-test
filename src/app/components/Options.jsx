"use effect"
import React from 'react'
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { FaCircleUser } from "react-icons/fa6";
import Link from 'next/link';

export default function Options({page}) {
  return (
    <div className='w-full fixed bottom-3'>
        <div className='bg-[#252525] sm:w-[400px] w-[85%] sm:h-20 h-14 rounded-3xl flex mx-auto justify-around items-center'>
            <Link href={'/'}>
                <IoChatbubbleEllipses className={`sm:h-10 sm:w-10 h-8 w-8 cursor-pointer ${page == "home" ? 'text-[#7C01F6]' : 'text-[#4D4C4E]'}`} />
            </Link>
            <Link href={'/create-room'}>
                <FaPlus className={`sm:h-10 sm:w-10 h-8 w-8 cursor-pointer ${page == "create-room" ? 'text-[#7C01F6]' : 'text-[#4D4C4E]'}`} />
            </Link>
            <Link href={'/profile'}>
                <FaCircleUser className={`sm:h-10 sm:w-10 h-8 w-8 cursor-pointer ${page == "profile" ? 'text-[#7C01F6]' : 'text-[#4D4C4E]'}`} />
            </Link>
        </div>
    </div>
  )
}
