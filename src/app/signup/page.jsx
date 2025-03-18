"use client"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';

export default function Signup() {

    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const router = useRouter();
    const [imageUrl, setImageUrl] = useState();

    const fileInput = watch('profilePicture')

    useEffect(() => {
      if(fileInput?.[0]){
        setImageUrl(URL.createObjectURL(fileInput[0]))
      }
    }, [fileInput])

    const onSubmit = async (info) => {
        const formData = new FormData(document.getElementById('signup-form'));
    
        console.log(formData);
    
        const response = await fetch("/api/users/signup", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

        console.log(data)
        if (data.success) {
            toast.success(data.message);
            router.push("/verify");
        } else{
            toast.error(data.message);
        }
    };
    

    return (
        <>
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">Create an account</h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)} id="signup-form">
                            <div className='text-slate-400 flex flex-col'>
                                <label className='block mb-2 text-sm font-medium text-gray-900 dark:text-white' htmlFor="avatar">Profile Picture</label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center overflow-hidden justify-center w-32 h-32 border-2 rounded-full cursor-pointer bg-gradient-to-r from-lightGray to-black">
                                        <div className='w-full h-full' style={{backgroundImage : `url(${imageUrl})`, backgroundSize: 'cover'}}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 my-3">
                                            {!imageUrl &&
                                            <div className='flex flex-col items-center justify-center'>
                                            <div className='text-slate-400'>Upload an</div>                     
                                            <div className='text-slate-400'>image</div>
                                            </div>
                                            }
                                        </div>
                                        <input id="dropzone-file" type="file" className="hidden" {...register("profilePicture")} />
                                        </div>
                                    </label>
                                </div> 
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your username</label>
                                <input type="text" placeholder="Enter username" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {...register("username", {required: {value: true, message: "This field is required"}, minLength: {value: 5, message: "Username must be atleast 5 characters"}, maxLength: {value: 20, message: "Username should not be longer than 20 characters"}})} />
                                {errors.username && <div className="text-red-600">{errors.username.message}</div> }
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                                <input type="email" placeholder="name@gmail.com" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {...register("email", {required: {value: true, message: "This field is required"}})} />
                                {errors.email && <div className="text-red-600">{errors.email.message}</div> }
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                <input type="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {...register("password", {required: {value: true, message: "This field is required"}, minLength: {value: 8, message: "Password must be atleast 8 characters"}})} />
                                {errors.password && <div className="text-red-600">{errors.password.message}</div> }
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="terms" aria-describedby="terms" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required="" />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="font-light text-gray-500 dark:text-gray-300">I accept the <Link className="font-medium text-primary-600 hover:underline dark:text-primary-500" href="/terms-and-conditions">Terms and Conditions</Link></label>
                                </div>
                            </div>
                            <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Create an account</button>
                            <p className="text-sm font-light text-gray-500 dark:text-gray-400">Already have an account? <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Login here</Link></p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}