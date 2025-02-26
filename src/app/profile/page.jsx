"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function Profile() {

    const router = useRouter();

    return (
        <>
            <div>Profile page under development...</div>
            <button onClick={() => router.push('/')} className='bg-red-500 p-2 rounded-md'>Go Back</button>
        </>
    )
}
