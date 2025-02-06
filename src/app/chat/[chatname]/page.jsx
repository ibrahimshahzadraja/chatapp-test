"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/socket';
import AdminBoard from '@/app/components/AdminBoard';

let typingTimeout;

export default function Chat() {
    const { chatname } = useParams();
    const router = useRouter();

    const [isMember, setIsMember] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [messages, setMessages] = useState([]);
	const [chatDetails, setChatDetails] = useState({});
    const [msg, setMsg] = useState("");
	const [userName, setUserName] = useState("");
	const [image, setImage] = useState(null);
	const [addUser, setAddUser] = useState("");
	const [showAdminBoard, setShowAdminBoard] = useState(false);

	const imageInputRef = useRef(null);
	const profileInputRef = useRef(null);
	const scrollRef = useRef(null);
	const backgroundImageRef = useRef(null);

    async function leaveChat() {
		const response = await fetch("/api/chat/leave", {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({chatname}),
		  });
		  const data = await response.json();
		  console.log(data)

		  if(data.success){
			socket.emit("leaveRoom", {chatname, username: userName});
			await sendSystemMessage(`${userName} left the chat`);
			router.push("/");
		  }
    }

	async function deleteChat() {
		if(isOwner){
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
					socket.emit("deleteChat", chatname);
					router.push("/");
				}
			} catch (error) {
				console.log(error);
				router.push("/");
			}
		}
	}

	async function getMessages() {
		try {
			const response = await fetch("/api/message/getAll", {
				method: 'POST',
				headers: {
				  'Content-Type': 'application/json',
				},
				body: JSON.stringify({chatname}),
			});
			const data = await response.json();

			console.log(data.data);

			if(!data.success){
				router.push("/");
			} else{
				setMessages(m => [...m, ...data.data]);
			}
		} catch (error) {
			console.log(error);
			router.push("/");
		}
	}

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

			console.log(data.data[0]);

			if(data.success){
				setChatDetails(data.data[0]);
			}
		} catch (error) {
			console.log(error);
			router.push("/");
		}
	}

    async function sendMessage() {
		if(!msg) return;
        console.log('Sending message:', msg);
        socket.emit("sendMessage", { chatname, username: userName ,message: msg });
		setMessages(m => [...m, {text: msg, image: "", isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}])
        
        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: msg,
                chatname
            })
        });
        const data = await res.json();
        setMsg("");
    }

	async function sendImage(e) {
		const file = e.target.files[0];
		const reader = new FileReader();
	
		reader.onloadend = () => {
		  const base64Image = reader.result;
		  setImage(base64Image);
		  socket.emit('sendImage', {chatname, username: userName, image: base64Image});
		  setMessages(m => [...m, {text: "", image: base64Image, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}])
		};
	
		if (file) {
		  reader.readAsDataURL(file);
		}

		const formData = new FormData()
		formData.append('image', file);
		formData.append('chatname', chatname);

        const response = await fetch("/api/message/sendImage", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if (imageInputRef.current) {
			imageInputRef.current.value = null;
		}

        console.log(data)
	}

	async function changeProfilePicture(e) {
		const file = e.target.files[0];

		const formData = new FormData()
		formData.append('profilePicture', file);
		formData.append('chatname', chatname);

        const response = await fetch("/api/chat/changeProfilePicture", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			socket.emit("profilePictureChanged", {chatname, profilePicture: data.data});
			setChatDetails({...chatDetails, profilePicture: data.data});
		}

		if (profileInputRef.current) {
			profileInputRef.current.value = null;
		}
	}

	async function adduser() {
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
			socket.emit("userJoined", {chatname, username: addUser, text: `Admin added ${addUser}`});
			await sendSystemMessage(`Admin added ${addUser}`);
			setChatDetails(cd => ({...cd, memberUsernames: [...cd.memberUsernames, addUser]}));			  
			setAddUser("");
		}
	}

	async function sendSystemMessage(text) {
		const response = await fetch("/api/message/systemMessage", {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({chatname, text}),
		});

		const data = await response.json();
	}

	async function setBackgroundImage(e) {
		const file = e.target.files[0];

		const formData = new FormData()
		formData.append('backgroundImage', file);
		formData.append('chatname', chatname);

        const response = await fetch("/api/chat/changeBackgroundImage", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			socket.emit("backgroundImageChanged", {chatname, backgroundImage: data.data});
			setChatDetails({...chatDetails, backgroundImage: data.data});
		}

		if (backgroundImageRef.current) {
			backgroundImageRef.current.value = null;
		}
	}

    useEffect(() => {
        async function auth(){
            const res = await fetch("/api/users/getUser", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const data = await res.json();
            console.log(data);
            if(!data.success){
                const res = await fetch("/api/users/tokenRefresh", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                });
                const data = await res.json();
                if(!data.success){
                    router.push("/login");
                }
                console.log(data);
            }
        }
        auth();

    }, [])

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
						console.log(data.data);
						setUserName(data.data);
					}
			}
			catch (error) {
				router.push("/");
			}
		}
		getUser();
	}, [])

    useEffect(() => {
        async function checkValid() {
            try{
				const response = await fetch("/api/chat/isMember",
						{
				    	    method: 'POST',
				            headers: {
				              'Content-Type': 'application/json',
			                },
			                body: JSON.stringify({chatname}),
		                });
				const data = await response.json();
				    
				if(!data.success){
					router.push("/");
				} else if(data.data.isOwner){
					setIsOwner(true);
				} else if(data.data.isMember){
					setIsMember(true);
				}
			} catch (error) {
				router.push("/");
			}
        }
        checkValid();
    }, [])

	useEffect(() => {
		getMessages();
		getChatDetails();
	}, [])

    useEffect(() => {
		if(userName){
			socket.emit("joinRoom", chatname);
	
			socket.on("userJoin", (username, text) => {
				setMessages(m => [...m, {text, image: "", isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
	
			socket.on("userLeft", (username) => {
				setMessages(m => [...m, {text: `${username} left the chat`, image: "", isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on("message", (username, message) => {
				console.log('Received message:', message);
				setMessages(m => [...m, {text: message, image: "", username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on('receiveImage', (username, image) => {
				setMessages(m => [...m, {text: "", image: image, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on("roomDeleted", (message) => {
				console.log(message);
				router.push("/");
			})
			
			socket.on("kicked", (username) => {
				setMessages(m => [...m, {text: `Admin kicked ${username}`, image: "", isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				setChatDetails(cd => ({...cd, memberUsernames: cd.memberUsernames.filter(uname => uname !== username)}));
				if(userName == username){
					router.push("/");
				}
			})
			
			socket.on("banned", (username, type) => {
				setMessages(m => [...m, {text: `Admin ${type == "Ban" ? "banned" : "unbanned"} ${username}`, image: "", isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				if(type == "Ban"){
					setChatDetails(cd => ({...cd, bannedUsernames: [...cd.bannedUsernames, username]}));
					if(userName == username){
						router.push("/");
					}
				} else{
					setChatDetails(cd => ({...cd, bannedUsernames: cd.bannedUsernames.filter(bannedUser => bannedUser !== username)}));
				}
			})
	
			socket.on('user-typing', () => {
				setIsTyping(true);
			});
			socket.on('user-stopped-typing', () => {
				setIsTyping(false);
			});
			socket.on("profilePictureChanged", (profilePicture) => {
				setChatDetails(cd => ({...cd, profilePicture}));
			})
			socket.on("backgroundImageChanged", (backgroundImage) => {
				setChatDetails(cd => ({...cd, backgroundImage}));
			})
		}

        return () => {
            socket.off("message");
        };
    }, [userName]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		  }
	})

	const handleTyping = () => {
		socket.emit('user-typing', chatname);
	
		clearTimeout(typingTimeout);
	
		typingTimeout = setTimeout(() => {
		  socket.emit('user-stopped-typing', chatname);
		}, 1000);
	  };

    if(!isMember && !isOwner){
        return(
            <div>Loading...</div>
        )
    }

	return (
		<>
		<button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={() => setShowAdminBoard(a => !a)}>Show Admin Board</button>
		{showAdminBoard && chatDetails.memberUsernames && isOwner && <AdminBoard setShowAdminBoard={setShowAdminBoard} chatname={chatname} usernames={chatDetails.memberUsernames} banned={chatDetails.bannedUsernames} />}
		  <div className='flex items-center'>
			<img src={chatDetails.profilePicture} alt="Chat Profile" className='w-20 h-20 rounded-full border-2 border-black' />
			<h1 className='text-xl font-semibold'>{chatname}</h1>
		  </div>
			{isOwner && <input type="file" accept='image/*' placeholder='Profile Picture' onChange={changeProfilePicture} ref={profileInputRef} />}
			{isOwner && <div className='my-2'>
				<label>Add User:</label>
				<input value={addUser} onChange={(e) => setAddUser(e.target.value)} type="text" placeholder='Enter username' className='border-2 border-black' />
				<button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={adduser}>Add</button>
			</div>}
			{isOwner && <div>
				<label>Background Image:</label>
				<input type="file" accept='image/*' onChange={setBackgroundImage} ref={backgroundImageRef} />	
			</div> }
			<div className={`w-full h-[70vh] bg-gray-200 overflow-y-auto bg-cover bg-center`} style={{backgroundImage: chatDetails.backgroundImage ? `url(${chatDetails.backgroundImage})` : 'none',}} ref={scrollRef}>
				{messages.map((message, index) => (
					<div key={index} className={`${message.isSystemMessage ? 'bg-gray-900' : message.isSentByMe ? "bg-green-400" : "bg-gray-700"} text-white min-w-28 w-fit max-w-[45%] ${message.isSystemMessage ? 'mx-auto' : message.isSentByMe ? "ml-auto" : "mr-auto"} rounded-md py-2 px-3 my-2 mx-2 relative`}>
						{message.image && <img src={message.image} alt='image' className="w-[350px] h-[200px]" />}
						{message.text && !message.isSystemMessage && <div>
											<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
											<div className='sm:my-4 my-3 sm:text-lg text-base font-sans sm:font-medium break-words'>{message.text}</div>
											<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
										</div>}
						{message.isSystemMessage && <div className='text-gray-300 text-sm'>{message.text}</div> }
					</div>
				))}
				{isTyping && <p className='bg-gray-900 text-gray-300 px-3 py-2 my-2 mx-2 rounded-md w-fit'>User is typing...</p>}
			</div>
		    <div>
                <input type="text" placeholder="Enter message" onKeyDown={handleTyping} className="border-2 border-black" value={msg} onChange={(e) => setMsg(e.target.value)} />
                <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={sendMessage}>Send</button>
				<input type="file" accept="image/*" onChange={sendImage} ref={imageInputRef} />
            </div>
			{!isOwner && <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={leaveChat}>Leave chat {chatname}</button>}
			{isOwner && <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={deleteChat}>Delete chat {chatname}</button>}
		</>
	  );
	  
}
