"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/socket';
import { saveAs } from 'file-saver';
import AdminBoard from '@/app/components/AdminBoard';
import ReplyIcon from '@mui/icons-material/Reply';
import { v4 as uuidv4 } from 'uuid';
import { FaArrowLeft } from "react-icons/fa6";
import { FaPencil } from "react-icons/fa6";
import Link from 'next/link';
import { IoIosAttach } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";
import { FaCamera } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";

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
	const [isRecording, setIsRecording] = useState(false);
	const [reply, setReply] = useState({replyId: "", replyUsername: "", replyText: ""});

	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);

	const imageInputRef = useRef(null);
	const fileInputRef = useRef(null);
	const videoInputRef = useRef(null);
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

		const messageId = uuidv4();

        socket.emit("sendMessage", { chatname, username: userName ,message: msg, isReply: reply.replyId ? true : false, messageId, replyText: reply.replyText, replyUsername: reply.replyUsername});
		setMessages(m => [...m, {id: messageId, replyUsername: reply.replyUsername, text: msg, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true,isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", createdAt: new Date().toISOString()}])

		setMsg("");
		setReply({replyId: "", replyUsername: "", replyText: ""});
        
        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: msg,
                chatname,
				replyId: reply.replyId,
				replyUsername: reply.replyUsername,
				id: messageId,
            })
        });
        const data = await res.json();
    }

	async function sendImage(e) {
		const file = e.target.files[0];
		const reader = new FileReader();
	
		reader.onloadend = () => {
		  const base64Image = reader.result;
		  setImage(base64Image);
		  socket.emit('sendImage', {chatname, username: userName, image: base64Image});
		  setMessages(m => [...m, {text: "", image: {imageUrl: base64Image, imageName: file.name},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}])
		};
	
		if (file) {
		  reader.readAsDataURL(file);
		}

		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('type', "image");

        const response = await fetch("/api/message/sendMedia", {
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
			body: JSON.stringify({chatname, text, id: "NULL"}),
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

	async function sendVoice(audioFile) {
		const formData = new FormData();
		formData.append('file', audioFile);
		formData.append('chatname', chatname);
		formData.append('type', "voice");

		const response = await fetch("/api/message/sendMedia", { 
			method: 'POST',
			body: formData,
		});
		const data = await response.json();
	}

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			setIsRecording(true);
			audioChunksRef.current = [];
			mediaRecorderRef.current = new MediaRecorder(stream);
		  
			mediaRecorderRef.current.ondataavailable = (event) => {
			  audioChunksRef.current.push(event.data);
			};
		  
			mediaRecorderRef.current.start();
		} catch (error) {
			if (error.name === 'NotAllowedError') {
				alert('Please enable microphone access in your browser or mobile settings.');
			} else if (error.name === 'NotFoundError') {
				alert('No microphone found on this device.');
			} else {
				console.error('Error accessing microphone:', error);
			}
		}
	  };
	  
	  const stopRecording = () => {
		if (mediaRecorderRef.current) {
		  mediaRecorderRef.current.stop();
		  mediaRecorderRef.current.onstop = async() => {
			setIsRecording(false);
	  
			const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
			const audioURL = URL.createObjectURL(audioBlob);
			const audioFile = new File([audioBlob], 'voice.mp3', { type: 'audio/mp3' });
	  
			socket.emit('send-voice', { username: userName, chatname, audioBlob });
			setMessages((m) => [...m, {text: '', image: {imageUrl: "", imageName: ""},voice: audioURL,video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);

			await sendVoice(audioFile);
		  };
		}
	  };
	
	async function sendFile(e) {
		const file = e.target.files[0];

		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('type', "file");

		
        const response = await fetch("/api/message/sendMedia", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			fileInputRef.current.value = null;
			setMessages((m) => [...m,{text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""}, file: {fileUrl: data.data.fileUrl, fileName: data.data.fileName}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);
			socket.emit("send-file", {username: userName, chatname, fileUrl: data.data.fileUrl, fileName: data.data.fileName});
		}
	}
	
	async function sendVideo(e) {
		const file = e.target.files[0];

		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('type', "video");

		
        const response = await fetch("/api/message/sendMedia", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			videoInputRef.current.value = null;
			setMessages((m) => [...m,{text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: data.data.fileUrl, videoName: data.data.fileName},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);
			socket.emit("send-video", {username: userName, chatname, videoUrl: data.data.fileUrl, videoName: data.data.fileName});
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
				setMessages(m => [...m, {text, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
	
			socket.on("userLeft", (username) => {
				setMessages(m => [...m, {text: `${username} left the chat`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on("message", (username, message, isReply, messageId, replyText, replyUsername) => {
				console.log('Received message:', message);
				setMessages(m => [...m, {id: messageId, replyUsername, text: message, isReply, replyText, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on('receiveImage', (username, image, imageName) => {
				setMessages(m => [...m, {text: "", image: {imageUrl: image, imageName},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on("roomDeleted", (message) => {
				console.log(message);
				router.push("/");
			})
			
			socket.on("kicked", (username) => {
				setMessages(m => [...m, {text: `Admin kicked ${username}`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				setChatDetails(cd => ({...cd, memberUsernames: cd.memberUsernames.filter(uname => uname !== username)}));
				if(userName == username){
					router.push("/");
				}
			})
			
			socket.on("banned", (username, type) => {
				setMessages(m => [...m, {text: `Admin ${type == "Ban" ? "banned" : "unbanned"} ${username}`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
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
			socket.on('receive-voice', (username, audioData) => {
				console.log(audioData);
				const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
				const audioURL = URL.createObjectURL(audioBlob);
				console.log(audioURL);
				setMessages((m) => [...m,{text: '',image: {imageUrl: "", imageName: ""},voice: audioURL,video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			socket.on('receive-file', (username, fileUrl, fileName) => {
				setMessages((m) => [...m,{text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl, fileName}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			socket.on('receive-video', (username, videoUrl, videoName) => {
				setMessages((m) => [...m,{text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl, videoName},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
		}

        return () => {
            socket.off("message");
        };
    }, [userName]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		  }
	});

	const handleTyping = () => {
		socket.emit('user-typing', chatname);
	
		clearTimeout(typingTimeout);
	
		typingTimeout = setTimeout(() => {
		  socket.emit('user-stopped-typing', chatname);
		}, 1000);
	};
	
	const downloadFile = async (fileUrl, fileName) => {
		const response = await fetch(fileUrl);
		const blob = await response.blob();
		saveAs(blob, fileName);
	  };

    if(!isMember && !isOwner){
        return(
            <div>Loading...</div>
        )
    }

	return (
		<>
		<div className='w-full flex items-center bg-[#1F1F1F] gap-4 p-2 sticky top-0 z-10'>
			<Link href={'/'}>
				<FaArrowLeft className='ml-4' />
			</Link>
			<div className='flex items-center gap-4 w-[80%]'>
				<img src={chatDetails.profilePicture} alt="Chat Profile" className='w-16 h-16 rounded-full border-2 border-black' />
				<div>
					<h1 className='font-semibold text-xl'>{chatname}</h1>
					<p className='text-[#00FF85]'>You, {chatDetails.memberUsernames?.join(", ").length > 20 ? chatDetails.memberUsernames?.join(", ").split(0, 20) + "..." : chatDetails.memberUsernames?.join(", ")}</p>
				</div>
			</div>
			{isOwner && <FaPencil className='absolute right-0 mr-4' />}
		</div>

		{/* <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={() => setShowAdminBoard(a => !a)}>Show Admin Board</button>
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
			</div> } */}
			<div className={`w-full overflow-y-auto bg-cover bg-center`} style={{backgroundImage: chatDetails.backgroundImage ? `url(${chatDetails.backgroundImage})` : 'none',}} ref={scrollRef}>
				{messages.map((message, index) => (
					<div key={index} className={`${message.isSystemMessage ? 'bg-gray-900' : message.isSentByMe ? "bg-green-400" : "bg-gray-700"} text-white min-w-44 w-fit max-w-[80%] ${message.isSystemMessage ? 'mx-auto' : message.isSentByMe ? "ml-auto" : "mr-auto"} rounded-md py-2 px-3 my-2 mx-2 relative`}>
						{message.image.imageUrl && <img src={message.image.imageUrl} alt={message.image.imageName} className="w-[350px] h-[200px]" />}
						{message.text && !message.isSystemMessage && !message.isReply && <div>
											<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
											<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
											<div className='sm:my-4 my-3 sm:text-lg text-base font-sans sm:font-medium break-words'>{message.text}</div>
											<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
										</div>}
						{message.isReply && <div>
											<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
											<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
											<div className={`${message.isSentByMe ? "bg-green-600" : "bg-gray-800"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
												<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
												<div>{message.replyText}</div>
											</div>
											<div className='sm:text-lg mb-3 text-base font-sans sm:font-medium break-words'>{message.text}</div>
											<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
										</div> }
						{message.isSystemMessage && <div className='text-gray-300 text-sm'>{message.text}</div> }
						{message.voice && <audio controls className='max-sm:w-[60vw]'>
												<source src={message.voice} type='audio/mp3' />
											</audio>}
						{message.file.fileUrl && <div>
											<button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={() => downloadFile(message.file.fileUrl, message.file.fileName)}>Download {message.file.fileName}</button>
										</div> }
						{message.video.videoUrl && <video className="w-[350px] h-[200px]" src={message.video.videoUrl} controls></video> }
					</div>
				))}
				{isTyping && <p className='bg-gray-900 text-gray-300 px-3 py-2 my-2 mx-2 rounded-md w-fit'>User is typing...</p>}
			</div>
			<div className='w-full flex items-center bg-[#1F1F1F] gap-4 py-4 justify-center sticky bottom-0'>
				<IoIosAttach className='text-[#7C01F6] w-8 h-8 cursor-pointer' />
				<div className='relative'>
					<input type="text" placeholder='Type your message' onKeyDown={handleTyping} value={msg} onChange={(e) => setMsg(e.target.value)} className='bg-[#272626] rounded-md text-base px-4 py-2 outline-none' />
					<FaCamera className='text-[#7C01F6] absolute right-2 top-3 cursor-pointer' />
				</div>
				{!msg && <MdKeyboardVoice className='text-[#7C01F6] w-8 h-8 cursor-pointer' />}
				{msg && <BsFillSendFill className='text-[#7C01F6] w-8 h-8 cursor-pointer' onClick={sendMessage} />}
			</div>
		    {/* <div className="flex flex-col gap-4 my-4">
			<div className="flex gap-2">
				<input type="text" placeholder="Enter message" onKeyDown={handleTyping} className="border text-black border-gray-300 rounded-md px-4 py-2 w-full" value={msg} onChange={(e) => setMsg(e.target.value)}/>
				<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300" onClick={sendMessage}>Send</button>
			</div>
			
			<input type="file" accept="image/*" className="file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 hover:file:bg-gray-100" onChange={sendImage} ref={imageInputRef} />
			
			<div className="flex gap-2">
				{!isRecording ? (
					<button onClick={startRecording} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300">Start Recording</button>
				) : (
					<button onClick={stopRecording} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300">Stop Recording</button>
				)}
			</div>

			<div>
				<label className="block text-lg font-medium text-gray-700 mb-1">Send File</label>
				<input type="file" className="file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 hover:file:bg-gray-100" onChange={sendFile} ref={fileInputRef} />
			</div>

			<div>
				<label className="block text-lg font-medium text-gray-700 mb-1">Send Video</label>
				<input type="file" className="file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 hover:file:bg-gray-100" onChange={sendVideo} ref={videoInputRef} />
			</div>
		</div>

		{!isOwner ? (
			<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300" onClick={leaveChat}>Leave chat {chatname}</button>
			) : (<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300" onClick={deleteChat}>Delete chat {chatname}</button>)} */}
		</>
	  );
	  
}
