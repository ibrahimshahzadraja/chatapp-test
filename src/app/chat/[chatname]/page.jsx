"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/socket';
import { saveAs } from 'file-saver';
import ReplyIcon from '@mui/icons-material/Reply';
import { v4 as uuidv4 } from 'uuid';
import { FaArrowLeft } from "react-icons/fa6";
import { FaPencil } from "react-icons/fa6";
import Link from 'next/link';
import { IoIosAttach } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";
import { FaCamera } from "react-icons/fa";
import { BsFillSendFill } from "react-icons/bs";
import FileSend from '@/app/components/FileSend';
import FileMessage from '@/app/components/FileMessage';

let typingTimeout;

export default function Chat() {
    const { chatname } = useParams();
    const router = useRouter();

	const [isTyping, setIsTyping] = useState(false);
	const [messages, setMessages] = useState([]);
	const [chatDetails, setChatDetails] = useState({});
    const [msg, setMsg] = useState("");
	const [userName, setUserName] = useState("");
	const [image, setImage] = useState(null);
	const [addUser, setAddUser] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [reply, setReply] = useState({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});
	const [fileAttachClicked, setFileAttachClicked] = useState(false);

	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);

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

    async function sendMessage() {
		if(!msg) return;

		const messageId = uuidv4();

		const replyObj = {id: messageId, isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", replyImage: reply.replyImage, replyVideo: reply.replyVideo, replyAudio: reply.replyAudio, replyFile: {fileUrl: reply.replyFile.fileUrl, fileName: reply.replyFile.fileName}, replyUsername: reply.replyUsername}

		console.log(replyObj)

        socket.emit("sendMessage", { chatname, username: userName ,message: msg, replyObj });
		setMessages(m => [...m, {...replyObj, text: msg, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}])

		setMsg("");
		setReply({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});
        
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

		setFileAttachClicked(false);
		const messageId = uuidv4();
		const replyObj = {id: messageId, isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", replyImage: reply.replyImage, replyVideo: reply.replyVideo, replyAudio: reply.replyAudio, replyFile: {fileUrl: reply.replyFile.fileUrl, fileName: reply.replyFile.fileName}, replyUsername: reply.replyUsername}
	
		reader.onloadend = () => {
		  const base64Image = reader.result;
		  setImage(base64Image);
		  socket.emit('sendImage', {chatname, username: userName, image: base64Image, imageName: file.name, replyObj});
		  setMessages(m => [...m, {...replyObj, text: "", image: {imageUrl: base64Image, imageName: file.name},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}])
		};
	
		if (file) {
		  reader.readAsDataURL(file);
		}


		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('id', messageId);
		formData.append('replyId', reply.replyId);
		formData.append("replyUsername", reply.replyUsername);
		formData.append('type', "image");

		setReply({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});

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

	async function sendVoice(audioFile, messageId) {

		const formData = new FormData();
		formData.append('file', audioFile);
		formData.append('chatname', chatname);
		formData.append('id', messageId);
		formData.append('replyId', reply.replyId);
		formData.append('replyUsername', reply.replyUsername);
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
			const messageId = uuidv4();

			const replyObj = {id: messageId, isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", replyImage: reply.replyImage, replyVideo: reply.replyVideo, replyAudio: reply.replyAudio, replyFile: {fileUrl: reply.replyFile.fileUrl, fileName: reply.replyFile.fileName}, replyUsername: reply.replyUsername}

			setIsRecording(false);
	  
			const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
			const audioURL = URL.createObjectURL(audioBlob);
			const audioFile = new File([audioBlob], 'voice.mp3', { type: 'audio/mp3' });
	  
			socket.emit('send-voice', { username: userName, chatname, audioBlob, replyObj});
			setMessages((m) => [...m, {...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: audioURL,video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);

			await sendVoice(audioFile, messageId);
		  };
		}
	  };
	
	async function sendFile(e) {
		const file = e.target.files[0];

		const messageId = uuidv4();

		const replyObj = {id: messageId, isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", replyImage: reply.replyImage, replyVideo: reply.replyVideo, replyAudio: reply.replyAudio, replyFile: {fileUrl: reply.replyFile.fileUrl, fileName: reply.replyFile.fileName}, replyUsername: reply.replyUsername}

		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('id', messageId);
		formData.append('replyId', reply.replyId);
		formData.append('replyUsername', reply.replyUsername);
		formData.append('type', "file");
		setFileAttachClicked(false);

		setReply({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});
		
        const response = await fetch("/api/message/sendMedia", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			setMessages((m) => [...m,{...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""}, file: {fileUrl: data.data.fileUrl, fileName: data.data.fileName}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);
			socket.emit("send-file", {username: userName, chatname, fileUrl: data.data.fileUrl, fileName: data.data.fileName, replyObj});
		}
	}
	
	async function sendVideo(e) {
		const file = e.target.files[0];

		setFileAttachClicked(false);
		const messageId = uuidv4();

		const replyObj = {id: messageId, isReply: reply.replyId ? true : false, replyText: reply.replyText ? reply.replyText : "", replyImage: reply.replyImage, replyVideo: reply.replyVideo, replyAudio: reply.replyAudio, replyFile: {fileUrl: reply.replyFile.fileUrl, fileName: reply.replyFile.fileName}, replyUsername: reply.replyUsername}

		const formData = new FormData()
		formData.append('file', file);
		formData.append('chatname', chatname);
		formData.append('id', messageId);
		formData.append('replyId', reply.replyId);
		formData.append("replyUsername", reply.replyUsername);
		formData.append('type', "video");

		
        const response = await fetch("/api/message/sendMedia", {
            method: 'POST',
            body: formData,
        });
    
        const data = await response.json();

		if(data.success){
			setMessages((m) => [...m,{...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: data.data.fileUrl, videoName: data.data.fileName},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);
			socket.emit("send-video", {username: userName, chatname, videoUrl: data.data.fileUrl, videoName: data.data.fileName, replyObj});
			setReply({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});
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
						setUserName(data.data.username);
					}
			}
			catch (error) {
				router.push("/");
			}
		}
		getUser();
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
			
			socket.on("message", (username, message, replyObj) => {
				console.log('Received message:', message, replyObj);
				setMessages(m => [...m, {...replyObj, text: message, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on('receiveImage', (username, image, imageName, replyObj) => {
				setMessages(m => [...m, {...replyObj, text: "", image: {imageUrl: image, imageName},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
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
				setMessages(m => [...m, {text: `${username} ${type == "Make" ? "is now an Admin" : "has been removed as Admin"}`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				setChatDetails(prevDetails => ({
					...prevDetails,
					memberDetails: prevDetails.memberDetails.map(member => 
						member.username === username 
							? {...member, isAdmin: type === "Make"}
							: member
					)
				}));
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
			socket.on('receive-voice', (username, audioData, replyObj) => {
				const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
				const audioURL = URL.createObjectURL(audioBlob);
				setMessages((m) => [...m,{...replyObj, text: '',image: {imageUrl: "", imageName: ""},voice: audioURL,video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			socket.on('receive-file', (username, fileUrl, fileName, replyObj) => {
				setMessages((m) => [...m,{...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl, fileName}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			socket.on('receive-video', (username, videoUrl, videoName, replyObj) => {
				setMessages((m) => [...m,{...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl, videoName},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
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

    if(!chatDetails.isAuthorized){
        return(
            <div>Loading...</div>
        )
    }

	return (
		<>
		<div className='w-full flex items-center bg-[#1F1F1F] sm:gap-4 gap-2 p-2 sticky top-0 z-10'>
			<Link href={'/'}>
				<FaArrowLeft className='sm:ml-4' />
			</Link>
			<Link className='flex items-center gap-4 w-[80%]' href={`/chat/${chatname}/details`}>
				<img src={chatDetails.profilePicture} alt="Chat Profile" className='w-16 h-16 rounded-full border-2 border-black' />
				<div>
					<h1 className='font-semibold text-xl'>{chatname}</h1>
					<p className='text-[#00FF85]'>You, {chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ").length > 20 ? chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ").split(0, 20) + "..." : chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ")}</p>
				</div>
			</Link>
		</div>
		<div className={`w-full overflow-y-auto bg-cover bg-center`} style={{backgroundImage: chatDetails.backgroundImage ? `url(${chatDetails.backgroundImage})` : 'none',}} ref={scrollRef}>
			{messages.map((message, index) => (
				<div key={index} className={`${message.isSystemMessage ? 'bg-gray-900' : message.isSentByMe ? "bg-[#333232]" : "bg-[#171616]"} text-white min-w-44 w-fit max-w-[80%] ${message.isSystemMessage ? 'mx-auto' : message.isSentByMe ? "ml-auto" : "mr-auto"} rounded-md py-2 px-3 my-2 mx-2 relative`}>
					{message.image.imageUrl && !message.isReply && <div>
								<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyImage: message.image.imageUrl}))}></ReplyIcon>
								<img src={message.image.imageUrl} alt={message.image.imageName} className="w-[350px] h-[200px] m-2" />
							</div>}
					{message.text && !message.isSystemMessage && !message.isReply && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className='sm:my-4 my-3 sm:text-lg text-base font-sans sm:font-medium break-words'>{message.text}</div>
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div>}
					{message.isReply && message.text && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{message.replyText}</div>}
											{message.replyImage && <img src={message.replyImage} alt='Image' className='w-30 h-20 m-1' /> }
											{message.replyVideo && <video className="w-30 h-20 m-1 pointer-events-none" src={message.replyVideo} preload="metadata" muted></video>}
											{message.replyFile.fileUrl && <FileMessage downloadFile={downloadFile} message={message} isReply={true} />}
										</div>
										<div className='sm:text-lg mb-3 text-base font-sans sm:font-medium break-words'>{message.text}</div>
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div> }
					{message.isReply && message.image.imageUrl && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyImage: message.image.imageUrl}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{message.replyText}</div>}
											{message.replyImage && <img src={message.replyImage} alt='Image' className='w-30 h-20 m-1' /> }
											{message.replyVideo && <video className="w-30 h-20 m-1 pointer-events-none" src={message.replyVideo} preload="metadata" muted></video>}
											{message.replyFile.fileUrl && <FileMessage downloadFile={downloadFile} message={message} isReply={true} />}
										</div>
										<img src={message.image.imageUrl} alt={message.image.imageName} className="w-[350px] h-[200px] m-2" />
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div> }
					{message.isSystemMessage && <div className='text-gray-300 text-sm'>{message.text}</div> }
					{message.voice && <audio controls className='max-sm:w-[60vw]'>
											<source src={message.voice} type='audio/mp3' />
										</audio>}
					{message.file.fileUrl && !message.isReply && <div>
						<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyFile: {fileUrl: message.file.fileUrl, fileName: message.file.fileName}}))}></ReplyIcon>
						<FileMessage downloadFile={downloadFile} message={message} isReply={false} />
					</div>}
					{message.isReply && message.file.fileUrl && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyVideo: message.video.videoUrl}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{message.replyText}</div>}
											{message.replyImage && <img src={message.replyImage} alt='Image' className='w-30 h-20 m-1' />}
											{message.replyVideo && <video className="w-30 h-20 m-1 pointer-events-none" src={message.replyVideo} preload="metadata" muted></video>}
											{message.replyFile.fileUrl && <FileMessage downloadFile={downloadFile} message={message} isReply={true} />}
										</div>
										<FileMessage downloadFile={downloadFile} message={message} isReply={false} />
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div> }
					{message.video.videoUrl && !message.isReply && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyVideo: message.video.videoUrl}))}></ReplyIcon>
										<video className="w-[350px] h-[200px]" src={message.video.videoUrl} controls></video>
									</div>}
					{message.isReply && message.video.videoUrl && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyVideo: message.video.videoUrl}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{message.replyText}</div>}
											{message.replyImage && <img src={message.replyImage} alt='Image' className='w-30 h-20 m-1' />}
											{message.replyVideo && <video className="w-30 h-20 m-1 pointer-events-none" src={message.replyVideo} preload="metadata" muted></video>}
											{message.replyFile.fileUrl && <FileMessage downloadFile={downloadFile} message={message} isReply={true} />}
										</div>
										<video className="w-[350px] h-[200px]" src={message.video.videoUrl} controls></video>
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div> }
				</div>
			))}
			{isTyping && <p className='bg-gray-900 text-gray-300 px-3 py-2 my-2 mx-2 rounded-md w-fit'>User is typing...</p>}
		</div>
		<div className="sticky bottom-0">
			<div className='w-full flex items-center bg-[#1F1F1F] gap-4 py-4 justify-center relative'>
				<FileSend onImageSelect={sendImage} onVideoSelect={sendVideo} onFileSelect={sendFile} isVisible={fileAttachClicked} />
				<IoIosAttach className='text-[#7C01F6] w-8 h-8 cursor-pointer' onClick={() => setFileAttachClicked(f => !f)} />
				<div className='relative bg-[#272626] sm:w-auto w-[60%]'>
					<input type="text" placeholder='Type your message' onKeyDown={handleTyping} value={msg} onChange={(e) => setMsg(e.target.value)} className='rounded-md bg-transparent text-base pl-2 pr-7 w-full py-2 outline-none' />
					<FaCamera className='text-[#7C01F6] absolute right-2 top-3 cursor-pointer' />
				</div>
				{!msg && <MdKeyboardVoice className='text-[#7C01F6] w-8 h-8 cursor-pointer' />}
				{msg && <BsFillSendFill className='text-[#7C01F6] w-8 h-8 cursor-pointer' onClick={sendMessage} />}
			</div>
		</div>
	</>
	  );
}
