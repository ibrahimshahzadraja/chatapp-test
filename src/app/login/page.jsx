"use client"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from 'react-toastify';

export default function Login(){

    const router = useRouter();

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const onSubmit = async (info) => {
        const response = await fetch("/api/users/login", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(info),
          });
          const data = await response.json();
          console.log(data);
          if(data.success){
            toast.success(data.message);
            router.push("/");
          } else if(data.success && !data.data?.isVerified){
            toast.warn(data.message);
            router.push("/verify");
          } else{
            toast.error(data.message);
          }
    }

    return(
        <>
        <section className="bg-gray-50 dark:bg-gray-900 h-[100vh]">
          <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
              <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                  <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                      <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">Sign in to your account</h1>
                      <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
                          <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                              <input type="email" placeholder="name@gmail.com" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {...register("email", {required: {value: true, message: "This field is required"}})} />
                              {errors.email && <div className="text-red-600">{errors.email.message}</div> }
                          </div>
                          <div>
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                              <input type="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" {...register("password", {required: {value: true, message: "This field is required"}, minLength: {value: 8, message: "Password must be atleast 8 characters"}, maxLength: {value: 30, message: "Password cannot be longer than 30 characters"}})} />
                              {errors.password && <div className="text-red-600">{errors.password.message}</div> }
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-start">
                                  <div className="flex items-center h-5">
                                    <input id="remember" aria-describedby="remember" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required=""/>
                                  </div>
                                  <div className="ml-3 text-sm">
                                    <label className="text-gray-500 dark:text-gray-300">Remember me</label>
                                  </div>
                              </div>
                              <a href="#" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                          </div>
                          <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign in</button>
                          <p className="text-sm font-light text-gray-500 dark:text-gray-400">Don’t have an account yet? <Link href="/signup" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</Link></p>
                      </form>
                  </div>
              </div>
          </div>
        </section>
        </>
    )
}