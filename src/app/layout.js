import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from 'react-toastify';
import { ServiceWorkerWrapper } from "./components/ServiceWorkerWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Convora",
  description: "Convora allows users to create chat rooms and engage in real-time conversations with others. Users can create and join rooms effortlessly, making communication easy and interactive.",
};

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative bg-[#121111] text-white`}>
        {children}
        <ServiceWorkerWrapper />
        <ToastContainer />
        <div className="fixed bottom-0 inset-x-0 -z-10 h-64 w-[100%] bg-[#29133b] rounded-t-[100px] blur-xl opacity-70 mx-auto"></div>
      </body>
    </html>
  );
}
