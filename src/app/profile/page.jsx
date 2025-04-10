"use client"
import React, { useState, useEffect } from 'react'
import { FaPencil } from "react-icons/fa6";
import { RiNewsLine } from "react-icons/ri";
import { PiBellSimpleBold } from "react-icons/pi";
import { AiOutlineLock } from "react-icons/ai";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import Options from '../components/Options';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from "next/navigation";

export default function Profile() {

    const [userDetails, setUserDetails] = useState({});
    const router = useRouter();

    async function getUser() {
        try {
            const response = await fetch("/api/users/getUser",
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const data = await response.json();

                if(data.success){
                    setUserDetails(data.data);
                    localStorage.setItem("username", data.data.username)
                    localStorage.setItem("email", data.data.email)
                    localStorage.setItem("profilePicture", data.data.profilePicture)
                }
        }
        catch (error) {
            router.push("/");
        }
    }

    useEffect(() => {
        if(!localStorage.getItem("username") || !localStorage.getItem("email") || !localStorage.getItem("profilePicture")){
            getUser();
        } else{
            setUserDetails(p => ({...p, username: localStorage.getItem("username"), email: localStorage.getItem("email"), profilePicture: localStorage.getItem("profilePicture")}));
        }
    }, [])

    async function logout(){
        const response = await fetch("/api/users/logout",
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            if(data.success){
                toast.success(data.message);
                router.push("/login");
            } else{
                toast.error("Logout was unsuccessfull. Try Again!");
            }
    }

    return (
        <>
        <div className='h-screen'>
            <div className='fixed top-0 inset-x-0 -z-10 h-64 w-full bg-[#4D5151] rounded-b-[700px] blur-md opacity-50 mx-auto'></div>
            <div className='flex justify-between items-center absolute top-0 sm:px-8 px-4 mt-5 w-full'>
                <h1 className='text-3xl font-semibold text-[#7c7c7c]'>Secret Convos</h1>
                <IoChatbubbleEllipsesOutline className='text-[#7c7c7c] h-8 w-8' />
            </div>
            <div className='flex flex-col justify-center items-center h-full'>
                <div className='relative'>
                    <img src={userDetails.profilePicture} alt="User profile image" className='rounded-full w-32 h-32' />
                    <Link href={"/edit-profile"}>
                        <FaPencil className='bg-[#434343] rounded-full w-9 h-9 p-1 border-4 border-[#202020] absolute bottom-0 right-0' />
                    </Link>
                </div>
                <div className='my-3'>
                    <h2 className='text-xl font-semibold text-center my-1'>{userDetails.username}</h2>
                    <p className='text-center font-light text-sm'>{userDetails.email}</p>
                </div>
                <div className='bg-black rounded-md p-3 w-[300px]'>
                    <Link href={"/edit-profile"}>
                        <div className='flex items-center gap-3 my-2 cursor-pointer'>
                            <RiNewsLine />
                            <p>Edit profile information</p>
                        </div>
                    </Link>
                    <div className='flex items-center gap-3 my-2'>
                        <PiBellSimpleBold />
                        <p>Notifications</p>
                        <p className='text-[#438FFF]'>ON</p>
                    </div>
                    <div className='flex items-center gap-3 my-2'>
                        <AiOutlineLock />
                        <p>Privacy policy</p>
                    </div>
                </div>
            </div>
        </div>
        <div className='flex items-center gap-2 absolute right-2 bottom-20 text-xl font-semibold cursor-pointer p-2' onClick={logout}>
            <FiLogOut />
            <p>Log out</p>
        </div>
        <Options page={"profile"} />
        </>
    )
}
