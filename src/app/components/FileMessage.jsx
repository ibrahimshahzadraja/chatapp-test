"use client"
import React from 'react'
import { FaRegFileLines } from "react-icons/fa6";
import { HiOutlineDownload } from "react-icons/hi";

export default function FileMessage({downloadFile, message, isReply}) {

    console.log(message);

  return (
    <div className='bg-[#0D0D0D] flex items-center justify-between rounded-md m-1 px-4 py-1 min-w-[250px]'>
        <div className='flex items-center'>
            <FaRegFileLines className='text-gray-300 w-7 h-8 mr-2' />
            <div>
                <p className='text-[#475569] font-semibold'>{isReply ? message.replyFile.fileName : message.file.fileName}</p>
                <p className='text-[#94A3B8] text-xs'>Nothing KB</p>
            </div>
        </div>
        <HiOutlineDownload className='text-[#132669] font-bold w-7 h-7 cursor-pointer' onClick={() => downloadFile(isReply ? message.replyFile.fileUrl : message.file.fileUrl, isReply ? message.replyFile.fileName : message.file.fileName)} />
    </div>
  )
}
