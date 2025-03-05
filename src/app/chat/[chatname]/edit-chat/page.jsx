"use client"
import React, {useState, useEffect} from 'react'
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from "next/navigation";
import { socket } from '@/socket';

export default function EditProfile() {

    const [imageUrl, setImageUrl] = useState();
    const [chatDetails, setChatDetails] = useState({});

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const fileInput = watch('profilePicture');

    const { chatname } = useParams();

    const router = useRouter();

    async function getChat() {
        try {
            const response = await fetch("/api/chat/get",
                {
                    method: 'POST',
                    body: JSON.stringify({chatname}),
                })
            const data = await response.json();

            if(!data.data.isAuthorized){
              router.push("/");
            }
            if(data.success){
                setChatDetails(data.data);
                setImageUrl(data.data.profilePicture);
            }
        }
        catch (error) {
            router.push("/");
        }
    }

    async function sendSystemMessage(newChatname, text) {
      const response = await fetch("/api/message/systemMessage", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatname: newChatname, text, id: "NULL"}),
      });
  
      const data = await response.json();
    }

    async function updateChat(d){
      console.log(d);
      if(d.convoname == chatname && d.password == "" && d.profilePicture.length == 0){
        return;
    }

      const formData = new FormData();

      formData.append("convoname", d.convoname == chatname ? "" : d.convoname);
      formData.append("password", d.password);
      formData.append("profilePicture", d.profilePicture[0] || '');
      formData.append("chatname", chatname);

      try {
        const response = await fetch("/api/chat/updateChat",
            {
                method: 'POST',
                body: formData,
            })
        const data = await response.json();

        console.log(data);

        if(!data.success && data.isAuthorized == false){
          router.push("/");
        }
        if(data.success){
            socket.emit("chatUpdated", {...data.data, prevChatname: chatname});
            if(data.data.isProfilePictureChanged){
              socket.emit("chatChanged", {chatname: data.data.chatname, text: `${data.data.user} updated chat profile picture`})
              await sendSystemMessage(data.data.chatname, `${data.data.user} updated chat profile picture`)
            }
            if(data.data.isChatnameChanged){
              socket.emit("chatChanged", {chatname: data.data.chatname, text: `${data.data.user} changed the chat name from ${chatname} to ${data.data.chatname}`})
              await sendSystemMessage(data.data.chatname, `${data.data.user} changed the chat name from ${chatname} to ${data.data.chatname}`)
            }
            setTimeout(() => {router.push(`/chat/${data.data.chatname}/details`);}, 2500)
        }
    }
    catch (error) {
        router.push("/");
    }
    }

    useEffect(() => {
      getChat();
    }, [])
    
    useEffect(() => {
        if(fileInput?.[0]){
            setImageUrl(URL.createObjectURL(fileInput[0]))
        }
    }, [fileInput])

  return (
    <>
    <div className="relative flex items-center my-7">
        <Link href={`/chat/${chatname}/details`}>
            <FaArrowLeft className='absolute left-4 bottom-1' />
        </Link>
        <h1 className="text-lg font-semibold mx-auto">Edit Convo</h1>
    </div>
    <div className='w-full flex justify-center my-8'>
        <form onSubmit={handleSubmit(updateChat)} id='update-chat-form' className='flex flex-col mt-2 items-center gap-8 sm:w-[400px] w-[80%]'>
            <div className='text-slate-400 flex flex-col items-center w-full'>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" 
                        className="flex flex-col items-center justify-center w-32 h-32 border-2 border-[#4d4d4d] hover:border-[#438FFF] rounded-full cursor-pointer bg-[#030E1E] transition-all duration-300 overflow-hidden group relative">
                        <div className='w-full h-full relative' style={{backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                            {!imageUrl && (
                                <div className='absolute inset-0 flex flex-col items-center justify-center bg-[#030E1E] group-hover:bg-opacity-90 transition-all duration-300'>
                                    <svg className="w-8 h-8 mb-2 text-[#A4A4A4] group-hover:text-[#438FFF]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="text-xs text-[#A4A4A4] group-hover:text-[#438FFF]">Profile Picture</p>
                                </div>
                            )}
                            {imageUrl && (
                                <div className='absolute inset-0 bg-black opacity-0 group-hover:opacity-50 flex items-center justify-center transition-all duration-300'>
                                    <p className="text-white text-sm">Change photo</p>
                                </div>
                            )}
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" accept="image/*" {...register("profilePicture")} />
                    </label>
                </div>
            </div>
            <div className='relative w-full'>
                <div className="relative">
                    <input 
                        type="text" 
                        id="update-chatname"
                        placeholder=" "
                        defaultValue={chatDetails?.chatname || ''}
                        className='w-full bg-[#030E1E] px-3 pt-5 pb-2 rounded-md border-[1px] border-[#4d4d4d] text-[#A4A4A4] peer placeholder-transparent focus:outline-none'
                        {...register("convoname", {
                          validate: (value) => {
                              if (value && value.length < 5) {
                                  return "Chatname must be at least 5 characters";
                              }
                              return true;
                          }
                      })}
                    />
                    <label 
                        htmlFor="update-chatname" 
                        className='absolute text-base left-3 top-3 text-[#A4A4A4] transition-all duration-200
                        peer-focus:text-xs peer-focus:top-1.5
                        peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-1.5'
                    >
                        Convo Name
                    </label>
                </div>
                {errors.convoname && <div className='text-red-600 mt-1'>{errors.convoname.message}</div>}
            </div>
            <div className='relative w-full'>
                <div className="relative">
                    <input 
                        type="password" 
                        id="update-chat-password"
                        placeholder=" "
                        className='w-full bg-[#030E1E] px-3 pt-5 pb-2 rounded-md border-[1px] border-[#4d4d4d] text-[#A4A4A4] peer placeholder-transparent focus:outline-none'
                        {...register("password", {
                            validate: (value) => {
                                if (value && value.length < 8) {
                                    return "Password must be at least 8 characters";
                                }
                                return true;
                            }
                        })} 
                    />
                    <label 
                        htmlFor="update-chat-password" 
                        className='absolute text-base left-3 top-3 text-[#A4A4A4] transition-all duration-200
                        peer-focus:text-xs peer-focus:top-1.5
                        peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-1.5'
                    >
                        Password
                    </label>
                </div>
                {errors.password && <div className='text-red-600 mt-1'>{errors.password.message}</div>}
            </div>
            <button type='submit' className='w-full rounded-lg text-white bg-[#438FFF] py-2 font-semibold text-lg'>Done</button>
        </form>
    </div>
    </>
  )
}
