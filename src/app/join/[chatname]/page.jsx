"use client"
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socket } from '@/socket';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function Chat() {

  const { chatname } = useParams();
  const [userDetails, setUserDetails] = useState({});

  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

    useEffect(() => {
        async function getUsername(){
            const res = await fetch("/api/users/getUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const data = await res.json();

            if(data.success){
                setUserDetails(data.data);
            }
        }
        getUsername();

    }, []);

    async function sendSystemMessage(text) {
      const response = await fetch("/api/message/systemMessage", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname, text, id: "NULL"}),
      });
  
      const data = await response.json();
    }

  const joinRoom = async (d) => {
    const response = await fetch("/api/chat/join", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({chatname, password: d.password}),
    });
    const data = await response.json();
    
    if(data.success){
        socket.emit("userJoined", {chatname, username: userDetails.username, text: `${userDetails.username} joined the chat`, profilePicture: userDetails.profilePicture});
        await sendSystemMessage(`${userDetails.username} joined the chat`);
      router.push(`/chat/${chatname}`);
    } else{
      toast.error(data.message);
    }
  }

  return (
    <>
    <div className='flex justify-between items-center mt-5 px-2 absolute top-0 w-full'>
        <h1 className='text-3xl font-semibold text-[#504F50]'>Secret Convos</h1>
        <IoChatbubbleEllipsesOutline className='text-[#504F50] h-8 w-8' />
    </div>
    <div className='flex flex-col justify-center items-center h-screen'>
      <div className='md:w-[30%] sm:w-[50%] w-[90%] flex flex-col justify-center items-center gap-6'>
        <h1 className='text-3xl font-semibold'>{chatname}</h1>
        <form onSubmit={handleSubmit(joinRoom)} className='relative w-full flex flex-col justify-center items-center gap-6'>
          <div className="w-full">
            <div className="relative">
                <input type="password" placeholder=" " className='w-full bg-[#030E1E] px-3 pt-5 pb-2 rounded-md border-[1px] border-[#4d4d4d] text-[#A4A4A4] peer placeholder-transparent focus:outline-none' {...register("password", {
                        validate: (value) => {
                            if (value && value.length < 8) {
                                return "Password must be at least 8 characters";
                            }
                            return true;
                        }
                    })} 
                />
                <label className='absolute text-base left-3 top-3 text-[#A4A4A4] transition-all duration-200 peer-focus:text-xs peer-focus:top-1.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-1.5'>Password</label>
            </div>
            {errors.password && <div className='text-red-600 mt-1'>{errors.password.message}</div>}
          </div>
          <button type='submit' className='w-full rounded-lg text-white bg-[#438FFF] py-2 font-semibold text-lg'>Join Room</button>
        </form>
      </div>
    </div>
    </>
  )
}
