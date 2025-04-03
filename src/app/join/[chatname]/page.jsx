"use client"
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socket } from '@/socket';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';

export default function Chat() {

  const { chatname } = useParams();
  const [userDetails, setUserDetails] = useState({});

  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        async function getUser(){
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
        if(!localStorage.getItem("username") || !localStorage.getItem("email") || !localStorage.getItem("profilePicture")){
          getUser();
        }else{
          setUserDetails({
            username: localStorage.getItem("username"),
            email: localStorage.getItem("email"),
            profilePicture: localStorage.getItem("profilePicture")
          });
        }
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
    if(!d.password) return;
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
	<div className='absolute top-0 w-full'>
		<div className='flex justify-between items-center mt-5 px-4'>
			<h1 className='text-3xl font-semibold text-[#504F50]'>Secret Convos</h1>
			<IoChatbubbleEllipsesOutline className='text-[#504F50] h-8 w-8' />
		</div>
		<div className="relative flex items-center my-3">
			<Link href={'/'}>
				<FaArrowLeft className='absolute left-4 bottom-1' />
			</Link>
			<h1 className="text-lg font-semibold mx-auto">Join Room</h1>
		</div>
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
          <button disabled={isSubmitting} type='submit' className='w-full rounded-lg text-white bg-[#438FFF] hover:bg-blue-500 py-2 font-semibold text-lg'>
            {isSubmitting && <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
            </svg>}
            {isSubmitting ? "Loading..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
    </>
  )
}
