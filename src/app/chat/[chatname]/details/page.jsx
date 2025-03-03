"use client"
import React, {useState, useEffect} from 'react'
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { IoMdMore } from "react-icons/io";
import { FaPencil } from "react-icons/fa6";
import { BsSearch } from "react-icons/bs";
import AdminPowers from '@/app/components/AdminPowers';
import { socket } from '@/socket';

export default function Details() {

    const { chatname } = useParams();

    const router = useRouter();

    const [chatDetails, setChatDetails] = useState({});
    const [userName, setUserName] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    
	async function getChatDetails() {
		try {
			const response = await fetch("/api/chat/get", {
				method: 'POST',
				headers: {
				  'Content-Type': 'application/json',
				},
				body: JSON.stringify({chatname}),
			});
			const data = await response.json();

			console.log(data.data);

            if(!data.data.isAuthorized){
                router.push("/");
            }
			if(data.success){
				setChatDetails(data.data);
			}
		} catch (error) {
			console.log(error);
			router.push("/");
		}
	}

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
                    setUserName(data.data.username);
                }
        }
        catch (error) {
            router.push("/");
        }
    }

    async function sendSystemMessage(text) {
        const response = await fetch("/api/message/systemMessage", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({chatname, text, id:"NULL"}),
        });

        const data = await response.json();
    }
  
    async function kick(username) {
        const response = await fetch("/api/chat/kick", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chatname, username}),
        });
        const data = await response.json();
        console.log(data)

        if(data.success){
            setChatDetails(prevDetails => ({
                ...prevDetails,
                memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
            }));
            socket.emit("kicked", {chatname, username});
            await sendSystemMessage(`Admin kicked ${username}`);
        }
    }

    async function ban(username, type) {
        console.log(type);
        const response = await fetch("/api/chat/ban", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chatname, username}),
        });
        const data = await response.json();

        if(data.success){
            setChatDetails(prevDetails => ({
                ...prevDetails,
                memberDetails: prevDetails.memberDetails.map(member => 
                    member.username === username 
                        ? {...member, isBanned: type === "Ban"}
                        : member
                )
            }));
            socket.emit("banned", {chatname, username, type});
            await sendSystemMessage(`Admin ${type == "Ban" ? "banned" : "unbanned"} ${username}`);
        }
    }

    async function toggleAdmin(username, type) {
        const response = await fetch("/api/chat/makeAdmin", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chatname, username}),
        });
        const data = await response.json();

        if(data.success){
            setChatDetails(prevDetails => ({
                ...prevDetails,
                memberDetails: prevDetails.memberDetails.map(member => 
                    member.username === username 
                        ? {...member, isAdmin: type === "Make"}
                        : member
                )
            }));
            socket.emit("admin", {chatname, username, type});
            await sendSystemMessage(`${username} ${type == "Make" ? "is now an Admin" : "has been removed as Admin"}`);
        }
    }

    useEffect(() => {
        getUser();
        getChatDetails();
    }, [])

    useEffect(() => {
        if(userName){
            socket.emit("joinRoom", chatname);
            socket.on("kicked", (username) => {
                setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
                }));
                if(userName == username){
                    router.push("/");
                }
            })
            
            socket.on("banned", (username, type) => {
                setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: prevDetails.memberDetails.map(member => 
                        member.username === username 
                            ? {...member, isBanned: type === "Ban"}
                            : member
                    )
                }));
                if(type == "Ban" && userName == username){
                    router.push("/");
                }
            })
            
            socket.on("admin", (username, type) => {
                console.log(type === "Make" && username === userName)
                setChatDetails(prevDetails => {
                    const isCurrentUserTargeted = username === userName;
                    
                    return {
                        ...prevDetails,
                        isAdmin: isCurrentUserTargeted ? type === "Make" : prevDetails.isAdmin,
                        memberDetails: prevDetails.memberDetails.map(member => 
                            member.username === username 
                                ? {...member, isAdmin: type === "Make"}
                                : member
                        )
                    };
                });
            });
        }
    }, [userName])

    const handleMoreClick = (index) => {
        setSelectedMember(selectedMember === index ? null : index);
    };

  return (
    <>
    <div className='h-[40vh] bg-[#1F1F1F] relative px-6 py-4'>
        <Link href={`/chat/${chatname}`}>
            <FaArrowLeft className='absolute top-4 left-6' />
        </Link>
        {chatDetails.isOwner && <IoMdMore className='absolute top-4 right-6 h-7 w-7' />}
        <div className='flex flex-col justify-center items-center my-8'>
            <div className='relative'>
                <img src={chatDetails.profilePicture || "/images/default-icon.jpeg"} alt="User profile image" className='rounded-full w-28 h-28' />
                <Link href={"/edit-chat"}>
                    <FaPencil className='bg-[#434343] rounded-full w-9 h-9 p-1 border-4 border-[#202020] absolute bottom-0 right-0' />
                </Link>
            </div>
            <div className='my-3'>
                <h2 className='text-xl font-semibold text-center my-1'>{chatname}</h2>
                <p className='text-center font-light text-sm text-[#00FF85]'>{chatDetails.memberDetails?.map((member) => (member.username === userName ? 'You' : member.username)).join(', ')}</p>
            </div>
        </div>
    </div>
    <div className='px-6'>
        <div className='flex justify-between items-center my-5'>
            <p className='text-2xl font-thin'>Members ({chatDetails.memberDetails?.length})</p>
            <BsSearch className='h-6 w-6 mx-4 cursor-pointer' />
        </div>
        {chatDetails.memberDetails?.map((member, index) => (
            <div key={index}>
                <div className='flex items-center gap-5 my-2 relative'>
                    <img src={member.profilePicture} alt="User profile" className='rounded-full w-16 h-16 border-4 border-[#2B2B2B]' />
                    <div>
                        <p className='text-lg font-semibold'>
                            {member.username} 
                            {(member.isOwner || member.isAdmin) && 
                                <span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Admin</span>
                            } 
                            {member.isBanned && 
                                <span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Banned</span>
                            }
                        </p>
                        <p className='text-[#00FF85]'>Online</p>
                    </div>
                    {(chatDetails.isOwner || chatDetails.isAdmin) && 
                     !member.isOwner && 
                     member.username !== userName && 
                        <AdminPowers 
                            onKick={() => kick(member.username)} 
                            onBan={() => ban(member.username, member.isBanned?"Unban":"Ban")} 
                            onMakeAdmin={() => toggleAdmin(member.username, member.isAdmin?"Remove":"Make")} 
                            isVisible={selectedMember === index} 
                            isBanned={member.isBanned} 
                            isAdmin={member.isAdmin}
                        />
                    }
                    {(chatDetails.isOwner || chatDetails.isAdmin) && 
                     !member.isOwner && 
                     member.username !== userName && 
                        <IoMdMore 
                            className='absolute top-4 right-6 h-7 w-7 cursor-pointer' 
                            onClick={() => handleMoreClick(index)} 
                        />
                    }
                </div>
                <div className='bg-[#434343] sm:h-[2px] h-[1px]'></div>
            </div>
        ))}
    </div>
    </>
  )
}
