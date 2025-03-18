"use client"
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from 'react-toastify';

export default function Verify() {
  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(Array(6).fill(""));

  const router = useRouter();

  const handleInputChange = (e, index) => {
    const value = e.target.value;
    if (value.length === 1 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (updatedOtp.every(val => val.length === 1)) {
      verifyCode(updatedOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyCode = async(code) => {
    const response = await fetch("/api/users/verify", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({verifyCode: code}),
      });
      const data = await response.json();
      console.log(data)
      if(data.success){
        toast.success(data.message)
        router.push("/login");
      } else{
        toast.error(data.message)
      }
  };

  return (
    <>
      <div className="container h-[100vh] flex justify-center items-center">
        <div className="flex flex-col justify-between h-1/6">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">Verification Code</h1>
          <form id="otp-form" className="flex gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="shadow-xs text-gray-600 flex sm:w-[64px] w-[48px] items-center justify-center rounded-lg border border-stroke bg-white p-2 text-center text-2xl font-medium text-gray-5 outline-none sm:text-4xl dark:border-dark-3 dark:bg-white/5"
                ref={(el) => (inputRefs.current[index] = el)}
                onInput={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </form>
        </div>
      </div>
    </>
  );
}
