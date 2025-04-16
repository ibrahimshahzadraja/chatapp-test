"use client"
import React, {useState, useEffect} from 'react'
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from "next/navigation";
import { toast } from 'react-toastify';

export default function EditProfile() {

    const [imageUrl, setImageUrl] = useState();
    const [chatDetails, setChatDetails] = useState({});

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const fileInput = watch('profilePicture');

    let { chatname } = useParams();
    chatname = decodeURIComponent(chatname);

    const router = useRouter();

    async function sendSystemMessage(text, chatname) {
		const response = await fetch("/api/message/systemMessage", {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({chatname, text, id: "NULL"}),
		});

		const data = await response.json();
	}

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

    async function updateChat(d){
      if((d.convoname == "" || d.convoname == chatDetails.chatname) && d.password == "" && d.profilePicture.length == 0){
        return;
    }

      const formData = new FormData(document.getElementById('update-chat-form'));
      formData.append("convoname", d.convoname == chatname ? "" : d.convoname);
      formData.append("password", d.password);
      formData.append("chatname", chatname);

      try {
        const response = await fetch("/api/chat/updateChat",
            {
                method: 'POST',
                body: formData,
            })
        const data = await response.json();


        if(!data.success && data.isAuthorized == false){
            toast.warn(data.message);
            router.push("/");
        }
        if(data.success){
            toast.success(data.message);
            if(data.data.isChatnameChanged && !data.data.isProfilePictureChanged){
                await sendSystemMessage(`${data.data.user} changed chat name from ${chatname} to ${data.data.chatname}`, data.data.chatname);
                socket.emit("chatChanged", {chatname: data.data.chatname, text: `${data.data.user} changed chat name from ${chatname} to ${data.data.chatname}`})
            }
            if(data.data.isProfilePictureChanged){
                await sendSystemMessage(`${data.data.user} updated chat profile`, data.data.chatname);
                socket.emit("chatUpdated", {chatname: data.data.chatname, profilePicture: data.data.profilePicture, prevChatname: chatname})
            }
            router.push(`/chat/${d.convoname ? d.convoname : chatname }/details`);
            setChatDetails(data.data);
            setImageUrl(data.data.profilePicture);
        } else{
            toast.error(data.message);
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
        <Link href={`/chat/${encodeURIComponent(chatname)}/details`}>
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
                              if (value && value.length < 6) {
                                  return "Chatname must be at least 6 characters";
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
            <button type='submit' disabled={isSubmitting} className="text-white bg-[#438FFF] hover:bg-blue-500 font-semibold focus:ring-4 w-full rounded-lg text-lg focus:ring-blue-300 px-5 py-2.5 text-center">
                {isSubmitting && <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                </svg>}
                {isSubmitting ? "Loading..." : "Done" }
            </button>
        </form>
    </div>
    </>
  )
}
