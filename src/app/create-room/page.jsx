"use client"
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdDriveFileRenameOutline } from "react-icons/md";
import { RiKey2Line } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { socket } from "@/socket";
import Options from "../components/Options";
import { toast } from 'react-toastify';

export default function createRoom(){

    const [imageUrl, setImageUrl] = useState();

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const fileInput = watch('profilePicture');

    const router = useRouter();
    
    useEffect(() => {
        if(fileInput?.[0]){
            setImageUrl(URL.createObjectURL(fileInput[0]))
        }
    }, [fileInput])
    
    
    async function createRoom(d){
        const formData = new FormData(document.getElementById("create-room-form"));

        const res = await fetch("/api/chat/create", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        
        if(data.success){
            toast.success(data.message);
            socket.emit("joinRoom", data.data);
            router.push(`/chat/${data.data}`);
        } else{
            toast.error(data.message);
        }
    }

    return(
        <>
        <div className='sm:px-8 px-4 flex flex-col items-center'>
            <div className='flex justify-between items-center mt-5 w-full'>
                <h1 className='text-3xl font-semibold text-[#504F50]'>Secret Convos</h1>
                <IoChatbubbleEllipsesOutline className='text-[#504F50] h-8 w-8' />
            </div>
            <h1 className='text-3xl text-white font-medium my-2'>Create Your Convo</h1>
            <p className="text-[#A4A4A4]">chat with friends anytime</p>
            <form onSubmit={handleSubmit(createRoom)} id='create-room-form' className='flex flex-col mt-2 items-center gap-5 sm:w-[400px] w-[80%]'>
                <div className='text-slate-400 flex flex-col items-center w-full'>
                    <label className='text-sm font-medium text-[#A4A4A4] self-start mb-2' htmlFor="avatar">Profile Picture</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" 
                            className="flex flex-col items-center justify-center w-32 h-32 border-2 border-[#4d4d4d] hover:border-red-500 rounded-full cursor-pointer bg-gradient-to-r from-[#3A3A3A] to-[#171616] transition-all duration-300 overflow-hidden group relative">
                            <div className='w-full h-full relative' style={{backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                                {!imageUrl && (
                                    <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-[#3A3A3A] to-[#171616] group-hover:bg-opacity-90 transition-all duration-300'>
                                        <svg className="w-8 h-8 mb-2 text-[#A4A4A4] group-hover:text-red-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                        </svg>
                                        <p className="text-xs text-[#A4A4A4] group-hover:text-red-500">Click to upload</p>
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
                <div className='flex flex-col relative w-full'>
                    <label htmlFor="convo-name" className='text-[#A4A4A4] ml-2'>Convo Name</label>
                    <input type="text" placeholder='Convo Name' className='text-base text-[#A4A4A4] w-full bg-gradient-to-r from-[#3A3A3A] to-[#171616] pl-11 px-3 py-2 rounded-md border-[1px] border-[#4d4d4d]' {...register("chatname", {required: {value: true, message: "This field is required"}})} />
                    <MdDriveFileRenameOutline className='w-6 h-6 absolute top-8 text-[#A4A4A4] mx-3' />
                    {errors.chatname && <div className='text-red-600'>{errors.chatname.message}</div> }
                </div>
                <div className='flex flex-col relative w-full'>
                    <label htmlFor="convo-password" className='text-[#A4A4A4] ml-2'>Convo Password</label>
                    <input type="password" placeholder='●●●●●●●●' className='text-base text-[#A4A4A4] bg-gradient-to-r from-[#3A3A3A] to-[#171616] pl-11 px-3 py-2 rounded-md border-[1px] border-[#4d4d4d]' {...register("password", {required: {value: true, message: "This field is required"}, minLength: {value: 8, message: "Password must be atleast 8 characters"}})} />
                    <RiKey2Line className='w-6 h-6 absolute top-8 text-[#A4A4A4] mx-3' />
                    {errors.password && <div className='text-red-600'>{errors.password.message}</div> }
                </div>
                <button disabled={isSubmitting} type='submit' className="w-full rounded-lg text-white bg-red-500 hover:bg-red-600 py-2 font-semibold text-lg">
                    {isSubmitting && <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>}
                    {isSubmitting ? "Loading..." : "Create Convo"}
                </button>
            </form>
        </div>
        <Options page={"create-room"} />
        </>
    )
}