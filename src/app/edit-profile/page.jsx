"use client"
import React, {useState, useEffect} from 'react'
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";

export default function EditProfile() {

    const [imageUrl, setImageUrl] = useState();
    const [userDetails, setUserDetails] = useState({});

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const fileInput = watch('profilePicture');

    const router = useRouter();

    async function updateProfile(d) {

        if(d.username == "" && d.password == "" && d.profilePicture.length == 0){
            return;
        }

        const formData = new FormData(document.getElementById("update-profile-form"));

        try {
            const response = await fetch("/api/users/updateProfile",
                {
                    method: 'POST',
                    body: formData,
                })
            const data = await response.json();

            console.log(data)

            if(data.success && data.data.isPasswordChanged){
                router.push("/verify");
            }
            if(data.success){
                setUserDetails(data.data);
                setImageUrl(data.data.profilePicture);
            }
        }
        catch (error) {
            router.push("/");
        }
    }

    useEffect(() => {
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
                        setImageUrl(data.data.profilePicture);
                    }
            }
            catch (error) {
                router.push("/");
            }
        }
        getUser();
    }, [])
    
    useEffect(() => {
        if(fileInput?.[0]){
            setImageUrl(URL.createObjectURL(fileInput[0]))
        }
    }, [fileInput])

  return (
    <>
    <div className='flex justify-between items-center mt-5 px-4'>
        <h1 className='text-3xl font-semibold text-[#504F50]'>Secret Convos</h1>
        <IoChatbubbleEllipsesOutline className='text-[#504F50] h-8 w-8' />
    </div>
    <div className="relative flex items-center my-3">
        <Link href={'/profile'}>
            <FaArrowLeft className='absolute left-4 bottom-1' />
        </Link>
        <h1 className="text-lg font-semibold mx-auto">Edit Profile</h1>
    </div>
    <div className='w-full flex justify-center my-8'>
        <form onSubmit={handleSubmit(updateProfile)} id='update-profile-form' className='flex flex-col mt-2 items-center gap-8 sm:w-[400px] w-[80%]'>
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
                        id="update-profile-username"
                        placeholder=" "
                        defaultValue={userDetails?.username || ''}
                        className='w-full bg-[#030E1E] px-3 pt-5 pb-2 rounded-md border-[1px] border-[#4d4d4d] text-[#A4A4A4] peer placeholder-transparent focus:outline-none'
                        {...register("username")} 
                    />
                    <label 
                        htmlFor="update-profile-username" 
                        className='absolute text-base left-3 top-3 text-[#A4A4A4] transition-all duration-200
                        peer-focus:text-xs peer-focus:top-1.5
                        peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-1.5'
                    >
                        Username
                    </label>
                </div>
                {errors.username && <div className='text-red-600 mt-1'>{errors.username.message}</div>}
            </div>
            <div className='relative w-full'>
                <div className="relative">
                    <input 
                        type="update-profile-password" 
                        id="password"
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
                        htmlFor="update-profile-password" 
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
