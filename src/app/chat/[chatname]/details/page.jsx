"use client"
import React, {useState, useEffect, useRef} from 'react'
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { IoMdMore } from "react-icons/io";
import { FiPlus } from "react-icons/fi";
import { FaPencil } from "react-icons/fa6";
import { BsSearch } from "react-icons/bs";
import AdminPowers from '@/app/components/AdminPowers';
import { socket } from '@/socket';
import { FiLogOut } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import AdminSideMenu from '@/app/components/AdminSideMenu';
import { toast } from 'react-toastify';
import { IoClose } from "react-icons/io5";
import { IoPersonAdd } from "react-icons/io5";

export default function Details() {

    const { chatname } = useParams();

    const router = useRouter();

    const [chatDetails, setChatDetails] = useState({});
    const [userName, setUserName] = useState("");
    const [addUser, setAddUser] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [showAdminSideMenu, setShowAdminSideMenu] = useState(false);
    const [showAdminPowers, setShowAdminPowers] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddUser, setShowAddUser] = useState(false);
    const addUserRef = useRef(null);
    
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
                    localStorage.setItem("username", data.data.username);
                    localStorage.setItem("email", data.data.email);
                    localStorage.setItem("profilePicture", data.data.profilePicture);
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
			body: JSON.stringify({chatname, text, id: "NULL"}),
		});

		const data = await response.json();
	}

    async function leaveChat() {
		const response = await fetch("/api/chat/leave", {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({chatname}),
		  });
		  const data = await response.json();

		  if(data.success){
            toast.success(data.message);
			socket.emit("leaveRoom", {chatname, username: userName});
			await sendSystemMessage(`${userName} left the chat`);
			router.push("/");
        } else{
              toast.error(data.message);
            }
        }
        
	async function deleteChat() {
		try {
			const response = await fetch("/api/chat/delete", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({chatname}),
			});
			const data = await response.json();
	
			if(data.success){
                toast.success(data.message);
				socket.emit("deleteChat", chatname);
				router.push("/");
			} else{
                toast.error(data.message);
            }
		} catch (error) {
			console.log(error);
			router.push("/");
		}
	}

    async function adduser() {
        setShowAddUser(p => !p);
        setSelectedMember(null);
        if(!addUser) return;
        setAddUser("");
        const response = await fetch("/api/chat/addUser", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({chatname, username: addUser}),
        });

        const data = await response.json();

        console.log(data);

        if(data.success){
            toast.success(data.message);
            socket.emit("userJoined", {chatname, username: data.data.username, text: `${userName} added ${data.data.username}`, profilePicture: data.data.profilePicture});
            await sendSystemMessage(`Admin added ${data.data.username}`);
        } else{
            toast.error(data.message);
        }
    }

    useEffect(() => {
        if(!localStorage.getItem("username") || !localStorage.getItem("email") || !localStorage.getItem("profilePicture")){
			getUser();
		} else{
			setUserName(localStorage.getItem("username"));
		}
        getChatDetails();
    }, [])

    useEffect(() => {
        if(userName){
            socket.emit("joinRoom", chatname);

            socket.on("userJoin", (username, text, profilePicture) => {
                setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: [...prevDetails.memberDetails, {
                        isAdmin: false, 
                        isBanned: false, 
                        isOwner: false, 
                        username, 
                        profilePicture
                    }],
                    memberUsernames: [...prevDetails.memberUsernames, username]
                }));
            });

            socket.on("kicked", (username) => {
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

            socket.on("userLeft", (username) => {
                setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
                }));
			});

            socket.on("roomDeleted", (message) => {
				router.push("/");
			})
        }
    }, [userName])

    useEffect(() => {
        function handleClickOutside(event) {
            if (addUserRef.current && !addUserRef.current.contains(event.target)) {
                setShowAddUser(false);
                setAddUser("");
            }
        }

        if (showAddUser) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showAddUser]);

    const handleSearchClose = () => {
        setShowSearch(false);
        setSearchQuery("");
    };

    const handleMoreClick = (index) => {
        setSelectedMember(index);
        setShowAdminPowers(p => !p);
    };

  return (
    <>
    <div className='min-h-[35vh] bg-[#1F1F1F] relative px-6 py-4 select-none'>
        <Link href={`/chat/${chatname}`}>
            <FaArrowLeft className='absolute top-4 left-6' />
        </Link>
        {chatDetails.isOwner && <IoMdMore className='absolute top-4 right-6 h-7 w-7 cursor-pointer' onClick={() => setShowAdminSideMenu(p => !p)} />}
        {showAdminSideMenu && <AdminSideMenu setChatDetails={setChatDetails} chatname={chatname} /> }
        {(chatDetails.isAdmin || chatDetails.isOwner) && (
            showAddUser ? (
                <div ref={addUserRef} className={`absolute top-[15px] ${!chatDetails.isOwner ? 'right-14' : 'right-6'} flex items-center gap-2`}>
                    <input type="text" value={addUser} onChange={(e) => setAddUser(e.target.value)} placeholder="Enter username" className="bg-[#272626] rounded-lg px-2 py-1 sm:text-base text-sm outline-none"/>
                    <IoPersonAdd className='h-5 w-5 cursor-pointer' onClick={adduser}/>
                </div>
            ) : (<FiPlus className='absolute top-4 right-14 h-7 w-7 cursor-pointer' onClick={() => setShowAddUser(true)}/>)
        )}
        <div className='flex flex-col justify-center items-center sm:my-3 mt-9'>
            <div className='relative'>
                <img src={chatDetails.profilePicture || "/images/default-icon.jpeg"} alt="User profile image" className='rounded-full w-24 h-24' />
                {(chatDetails.isOwner || chatDetails.isAdmin) && <Link href={`/chat/${chatname}/edit-chat`}>
                    <FaPencil className='bg-[#434343] rounded-full w-9 h-9 p-1 border-4 border-[#202020] absolute bottom-0 right-0' />
                </Link>}
            </div>
            <div className='my-3'>
                <h2 className='text-xl font-semibold text-center my-1'>{chatname}</h2>
                <p className='text-center font-light text-sm text-[#00FF85]'>You, {chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ").length > 20 ? chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ").split(0, 20) + "..." : chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ")}</p>
            </div>
        </div>
    </div>
    <div className='px-6 h-[60vh]'>
        <div className='flex justify-between items-center my-5 relative'>
            <p className='sm:text-2xl text-lg font-thin'>Members ({chatDetails.memberDetails?.length})</p>
            <div className="relative">
                <input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`bg-[#272626] rounded-lg sm:px-5 px-2 py-1 sm:text-base text-sm outline-none ${showSearch ? 'block' : 'hidden'}`}/>
                {showSearch ? (
                    <IoClose className='sm:h-6 sm:w-6 sm:mx-4 cursor-pointer absolute sm:top-1 sm:-right-3 right-1 top-[6px]' onClick={handleSearchClose}/>
                ) : (<BsSearch className='sm:h-6 sm:w-6 sm:mx-4 cursor-pointer' onClick={() => setShowSearch(true)}/>)}
            </div>
        </div>
        <div className='h-[80%] overflow-y-auto'>
            {chatDetails.memberDetails
                ?.filter(member => member.username.toLowerCase().includes(searchQuery.toLowerCase()))
                ?.map((member, index) => (
                    <div key={index}>
                        <div className='flex items-center gap-5 my-2 relative'>
                            <img src={member.profilePicture} alt="User profile" className='rounded-full w-16 h-16 border-4 border-[#2B2B2B]' />
                            <div>
                                <p className='text-lg font-semibold'>
                                    {member.username === userName ? "You" : member.username}
                                    {(member.isOwner || member.isAdmin) && 
                                        <span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Admin</span>
                                    } 
                                    {member.isBanned && 
                                        <span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Banned</span>
                                    }
                                </p>
                                <p className='text-[#00FF85]'>Online</p>
                            </div>
                            {showAdminPowers && <AdminPowers isVisible={selectedMember === index} member={member} chatname={chatname} setChatDetails={setChatDetails} setShowAdminPowers={setShowAdminPowers} />}
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
        <div className='absolute bottom-0 left-5 text-lg font-semibold cursor-pointer select-none'>
            {!chatDetails.isOwner && <div className='flex items-center gap-2' onClick={leaveChat}>
                <FiLogOut />
                <p>Leave Convo</p>
            </div> }
            {chatDetails.isOwner && <div className='flex items-center gap-2' onClick={deleteChat}>
                <MdDeleteOutline />
                <p>Delete Convo</p>
            </div> }
        </div>
    </div>
    </>
  )
}
