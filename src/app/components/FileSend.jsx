"use client"
import React from 'react'
import { MdOutlineImage } from "react-icons/md";
import { FiVideo } from "react-icons/fi";
import { FaRegFile } from "react-icons/fa";

export default function FileSend({ onImageSelect, onVideoSelect, onFileSelect, isVisible }) {
  return (
    <div className={`w-28 h-36 bg-[#200F2F] rounded-md flex flex-col divide-y divide-gray-700 absolute bottom-2 sm:-left-[85px] -left-[50px] shadow-md shadow-black z-50 ${isVisible ? "block" : "hidden"}`}>
        <div className='relative hover:bg-[#2d1846] rounded-sm transition-colors'>
            <div className='flex items-center gap-2 px-3 py-3 cursor-pointer'>
                <MdOutlineImage className='text-[#6509C0] w-6 h-6' />
                <p className='text-[#6509C0] text-sm'>Photo</p>
            </div>
            <input 
                type="file" 
                accept="image/*"
                onChange={onImageSelect}
                className='absolute inset-0 opacity-0 cursor-pointer'
            />
        </div>
        <div className='relative hover:bg-[#2d1846] rounded-sm transition-colors'>
            <div className='flex items-center gap-2 px-3 py-3 cursor-pointer'>
                <FiVideo className='text-[#6509C0] w-6 h-6' />
                <p className='text-[#6509C0] text-sm'>Video</p>
            </div>
            <input 
                type="file" 
                accept="video/*"
                onChange={onVideoSelect}
                className='absolute inset-0 opacity-0 cursor-pointer'
            />
        </div>
        <div className='relative hover:bg-[#2d1846] rounded-sm transition-colors'>
            <div className='flex items-center gap-2 px-3 py-3 cursor-pointer'>
                <FaRegFile className='text-[#6509C0] w-6 h-5' />
                <p className='text-[#6509C0] text-sm'>File</p>
            </div>
            <input 
                type="file"
                onChange={onFileSelect}
                className='absolute inset-0 opacity-0 cursor-pointer'
            />
        </div>
    </div>
  )
}
