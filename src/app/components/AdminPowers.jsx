"use client"
import React from 'react'

export default function AdminPowers({ onKick, onBan, onMakeAdmin, isVisible, isBanned, isAdmin }) {
  return (
    <div className={`w-28 bg-[#200F2F] rounded-md absolute right-16 flex flex-col z-50 divide-y divide-gray-700 ${isVisible ? "block" : "hidden"}`}>
        {(!isBanned && !isAdmin) && <p onClick={onKick} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>Kick</p>}
        {(!isAdmin || isBanned) && <p onClick={onBan} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer hover:bg-[#2d1846] transition-colors'>{isBanned? "Unban" : "Ban"}</p>}
        {!isBanned && <p onClick={onMakeAdmin} className='text-[#6509C0] text-center rounded-sm py-3 cursor-pointer text-sm hover:bg-[#2d1846] transition-colors'>{isAdmin? "Remove Admin": "Make Admin"}</p>}
    </div>
  )
}
