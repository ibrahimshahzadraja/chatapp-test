"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/socket';
import { saveAs } from 'file-saver';
import ReplyIcon from '@mui/icons-material/Reply';
import { v4 as uuidv4 } from 'uuid';
import { FaArrowLeft } from "react-icons/fa6";
import Link from 'next/link';
import { IoIosAttach } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
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
	const [isRecording, setIsRecording] = useState(false);
	const [holdTime, setHoldTime] = useState(0);
	const [intervalId, setIntervalId] = useState(null);
	const [reply, setReply] = useState({replyId: "", replyUsername: "", replyText: "", replyImage: "", replyVideo: "", replyAudio: "", replyFile: {fileUrl: "", fileName: ""}});
	const [fileAttachClicked, setFileAttachClicked] = useState(false);
	const [slidePosition, setSlidePosition] = useState(0);
	const [startX, setStartX] = useState(0);
	const [isCancelled, setIsCancelled] = useState(false);
    const [showMentionMenu, setShowMentionMenu] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [isDesktopRecording, setIsDesktopRecording] = useState(false);

	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);

	const imageInputRef = useRef(null);
	const scrollRef = useRef(null);

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

	const startRecording = async (type) => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioChunksRef.current = [];
			mediaRecorderRef.current = new MediaRecorder(stream);
			
			mediaRecorderRef.current.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data);
			};
			
			mediaRecorderRef.current.start();
			startTimer();
			setHoldTime(0);
			if(type === "Desktop"){
				setIsDesktopRecording(true);
			} else{
				setIsRecording(true);
				setSlidePosition(0);
				setIsCancelled(false);
			}
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
		
			const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
			const audioURL = URL.createObjectURL(audioBlob);
			const audioFile = new File([audioBlob], 'voice.mp3', { type: 'audio/mp3' });
		
			socket.emit('send-voice', { username: userName, chatname, audioBlob, replyObj});
			setMessages((m) => [...m, {...replyObj, text: '', image: {imageUrl: "", imageName: ""},voice: audioURL,video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: false, username: userName, isSentByMe: true, createdAt: new Date().toISOString()}]);

			await sendVoice(audioFile, messageId);
			};
		}
	};

	const startDesktopRecording = () => {
		startRecording("Desktop");
	};

	const stopDesktopRecording = () => {
		setIsDesktopRecording(false);
        stopTimer();
		setHoldTime(0);
		if(holdTime >= 1){
			stopRecording();
		}
    };

	const startTimer = () => {
		const id = setInterval(() => {
			setHoldTime(prevTime => prevTime + 1);
		}, 1000);
		setIntervalId(id);
	};

	const stopTimer = () => {
		clearInterval(intervalId);
		setIntervalId(null);
	};

	const cancelDesktopRecording = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
			audioChunksRef.current = [];
			mediaRecorderRef.current = null;
		}
		setIsDesktopRecording(false);
        stopTimer();
        setHoldTime(0);
	};

	const handleTouchStart = (e) => {
		startRecording("Mobile");
		setStartX(e.touches[0].clientX);
	};

	const handleTouchMove = (e) => {
		if (isRecording) {
			const diff = startX - e.touches[0].clientX;
			const newPosition = Math.min(Math.max(diff, 0), 200);
			setSlidePosition(newPosition);
			if (newPosition >= 100) {
				setIsCancelled(true);
			}
		}
	};

	const handleTouchEnd = () => {
		setIsRecording(false);
		stopTimer();
		if (!isCancelled) {
			if(holdTime >= 1){
				stopRecording();
			}
		} else{
			audioChunksRef.current = [];
			mediaRecorderRef.current = null;
		}
		setSlidePosition(0);
		setIsCancelled(false);
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
						localStorage.setItem("username", data.data.username)
						localStorage.setItem("email", data.data.email)
						localStorage.setItem("profilePicture", data.data.profilePicture)
					}
			}
			catch (error) {
				router.push("/");
			}
		}
		if(!localStorage.getItem("username") || !localStorage.getItem("email") || !localStorage.getItem("profilePicture")){
			getUser();
		} else{
			setUserName(localStorage.getItem("username"));
		}
	}, [])

	useEffect(() => {
		getMessages();
		getChatDetails();
	}, [])

    useEffect(() => {
		if(userName){
			socket.emit("joinRoom", chatname);
	
			socket.on("userJoin", (username, text, profilePicture) => {
				setMessages(m => [...m, {text, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
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
	
			socket.on("userLeft", (username) => {
				setMessages(m => [...m, {text: `${username} left the chat`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
                }));
			});
			
			socket.on("message", (username, message, replyObj) => {
				console.log('Received message:', message, replyObj);
				setMessages(m => [...m, {...replyObj, text: message, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on('receiveImage', (username, image, imageName, replyObj) => {
				setMessages(m => [...m, {...replyObj, text: "", image: {imageUrl: image, imageName},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
			});
			
			socket.on("roomDeleted", (message) => {
				router.push("/")
			})

			socket.on("chatChanged", (text) => {
				console.log("CHATCHANGE", text)
				setMessages(m => [...m, {text, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
			})
			
			socket.on("kicked", (username, userAdmin) => {
				setMessages(m => [...m, {text: `${userAdmin} kicked ${username}`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
				setChatDetails(prevDetails => ({
                    ...prevDetails,
                    memberDetails: prevDetails.memberDetails.filter(member => member.username !== username)
                }));
				if(userName == username){
					router.push("/");
				}
			})
			
			socket.on("banned", (username, type, userAdmin) => {
				setMessages(m => [...m, {text: `${userAdmin} ${type == "Ban" ? "banned" : "unbanned"} ${username}`, image: {imageUrl: "", imageName: ""},voice: "",video: {videoUrl: "", videoName: ""},file: {fileUrl: "", fileName: ""}, isSystemMessage: true, username: "", isSentByMe: false, createdAt: new Date().toISOString()}]);
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
			socket.on("chatUpdated", (cname, profilePicture) => {
				socket.emit("joinRoom", cname);
				setChatDetails(cd => ({...cd, chatname: cname, profilePicture}));
				router.push(`/chat/${cname}`)
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

    const handleInputChange = (e) => {
        const value = e.target.value;
        const position = e.target.selectionStart;
        setMsg(value);
        setCursorPosition(position);

        const lastAtSymbolIndex = value.lastIndexOf('@', position);
        if (lastAtSymbolIndex !== -1) {
            const afterAtSymbol = value.slice(lastAtSymbolIndex + 1, position);
            setMentionFilter(afterAtSymbol);
            setShowMentionMenu(true);
        } else {
            setShowMentionMenu(false);
        }
    };

    const handleMemberSelect = (username) => {
        const lastAtSymbolIndex = msg.lastIndexOf('@', cursorPosition);
        const beforeAt = msg.slice(0, lastAtSymbolIndex);
        const afterCursor = msg.slice(cursorPosition);
        
        const newMsg = `${beforeAt}@${username}${afterCursor}`;
        setMsg(newMsg);
        setShowMentionMenu(false);
        setMentionFilter('');
    };

    const filteredMembers = chatDetails.memberDetails?.filter(member => 
        member.username !== userName && (mentionFilter === '' || member.username.toLowerCase().includes(mentionFilter.toLowerCase()))
    );

	function highlightUsernames(text) {
		const validUsernames = chatDetails.memberUsernames.filter(username => username !== userName);
	  
		if (validUsernames.length === 0) return text;
	  
		const usernamePattern = validUsernames.map(username => 
		  username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		).join("|");
	  
		const regex = new RegExp(`@(${usernamePattern})`, "g");
	  
		const parts = [];
		let lastIndex = 0;
	  
		text.replace(regex, (match, username, index) => {
		  parts.push(text.slice(lastIndex, index));
		  
		  parts.push(
			<span key={index} className='text-purple-600 font-semibold'>
			  {match}
			</span>
		  );
	  
		  lastIndex = index + match.length;
		});
	  
		parts.push(text.slice(lastIndex));
	  
		return parts;
	}
	  

    if(!chatDetails.isAuthorized){
        return(
			<div role="status" className='w-full h-screen grid place-items-center'>
				<svg aria-hidden="true" className="w-12 h-12 text-gray-200 animate-spin dark:text-gray-600 fill-purple-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
					<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
				</svg>
				<span className="sr-only">Loading...</span>
			</div>
        )
    }

	return (
		<>
		<div className='h-screen flex flex-col overflow-hidden'>
		<div className='w-full flex items-center bg-[#1F1F1F] sm:gap-4 gap-2 p-2 sticky top-0 z-10'>
			<Link href={'/'}>
				<FaArrowLeft className='sm:ml-4' />
			</Link>
			<Link className='flex items-center gap-4 w-[80%]' href={`/chat/${chatDetails.chatname}/details`}>
				<img src={chatDetails.profilePicture} alt="Chat Profile" className='w-16 h-16 rounded-full border-2 border-black' />
				<div>
					<h1 className='font-semibold text-xl'>{chatDetails.chatname}</h1>
					<p className='text-[#00FF85] sm:text-base text-xs whitespace-nowrap overflow-hidden text-ellipsis w-[50vw]'>You, {chatDetails.memberUsernames?.filter(uname => uname !== userName).join(", ")}</p>
				</div>
			</Link>
		</div>
		<div className={`w-full overflow-y-auto bg-cover bg-center flex-1`} style={{backgroundImage: chatDetails.backgroundImage ? `url(${chatDetails.backgroundImage})` : 'none',}} ref={scrollRef}>
			{messages.map((message, index) => (
				<div key={index} className={`${message.isSystemMessage ? 'bg-gray-900' : message.isSentByMe ? "bg-[#333232]" : "bg-[#171616]"} text-white min-w-44 w-fit max-w-[80%] ${message.isSystemMessage ? 'mx-auto' : message.isSentByMe ? "ml-auto" : "mr-auto"} rounded-md py-2 px-3 my-2 mx-2 relative`}>
					{message.image.imageUrl && !message.isReply && <div>
								<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyImage: message.image.imageUrl}))}></ReplyIcon>
								<img src={message.image.imageUrl} alt={message.image.imageName} className="w-[350px] h-[200px] m-2" />
							</div>}
					{message.text && !message.isSystemMessage && !message.isReply && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className='sm:my-4 my-3 sm:text-lg text-base font-sans sm:font-medium break-words'>{highlightUsernames(message.text)}</div>
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div>}
					{message.isReply && message.text && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyText: message.text}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{highlightUsernames(message.replyText)}</div>}
											{message.replyImage && <img src={message.replyImage} alt='Image' className='w-30 h-20 m-1' /> }
											{message.replyVideo && <video className="w-30 h-20 m-1 pointer-events-none" src={message.replyVideo} preload="metadata" muted></video>}
											{message.replyFile.fileUrl && <FileMessage downloadFile={downloadFile} message={message} isReply={true} />}
										</div>
										<div className='sm:text-lg mb-3 text-base font-sans sm:font-medium break-words'>{highlightUsernames(message.text)}</div>
										<div className='text-xs absolute bottom-0 right-0 m-1'>{new Date(message.createdAt).toLocaleTimeString('en-US', {hour: 'numeric',minute: 'numeric',hour12: true})}</div>
									</div> }
					{message.isReply && message.image.imageUrl && <div>
										<ReplyIcon className='text-white absolute top-0 right-0 w-4 cursor-pointer' onClick={() => setReply(p => ({...p, replyId: message.id, replyUsername: message.username, replyImage: message.image.imageUrl}))}></ReplyIcon>
										<div className='text-xs absolute top-0 left-0 m-1'>~{message.username}</div>
										<div className={`${message.isSentByMe ? "bg-[#171616]" : "bg-[#333232]"} sm:mt-5 mt-4 px-2 py-5 rounded-md sm:text-lg text-base font-sans sm:font-medium break-words relative`}>
											<div className='absolute top-0 left-0 text-[10px] px-1'>{message.replyUsername}</div>
											{message.replyText && <div>{highlightUsernames(message.replyText)}</div>}
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
											{message.replyText && <div>{highlightUsernames(message.replyText)}</div>}
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
											{message.replyText && <div>{highlightUsernames(message.replyText)}</div>}
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
		<div className="sticky bottom-0 select-none">
			<div className='w-full flex items-center bg-[#1F1F1F] gap-4 py-4 justify-center relative'>
				<div className='relative bg-[#272626] w-[60%]'>
					<div className="relative">
						<IoIosAttach className='text-[#7C01F6] w-8 h-8 cursor-pointer absolute left-[-45px] top-1' onClick={() => setFileAttachClicked(f => !f)} />
						<FileSend onImageSelect={sendImage} onVideoSelect={sendVideo} onFileSelect={sendFile} isVisible={fileAttachClicked} />
					</div>
					<input type="text" placeholder='Type your message' onKeyDown={handleTyping} value={msg} onChange={handleInputChange} className='rounded-md bg-transparent text-base pl-2 pr-7 w-full py-2 outline-none' />
					{showMentionMenu && filteredMembers?.length > 0 && (
						<div className='overflow-y-auto absolute bottom-16 max-h-[276px] bg-[#200F2F] shadow-md shadow-black w-[250px] p-2'>
							{filteredMembers.map((member, index) => (
							<div key={index} className='hover:bg-[#2d1846] transition-colors border-b-[1px] border-gray-600 cursor-pointer' onClick={() => handleMemberSelect(member.username)}>
								<div className='flex items-center gap-5 py-2 relative'>
									<img src={member.profilePicture} alt="User profile" className='rounded-full w-12 h-12 border-4 border-[#2B2B2B]' />
									<div>
										<p className='text-md font-semibold'>
											{member.username} 
											{(member.isOwner || member.isAdmin) && 
												<span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Admin</span>
											} 
											{member.isBanned && 
												<span className='bg-[#272626] p-1 rounded-lg text-xs font-light mx-2'>Banned</span>
											}
										</p>
										<p className='text-[#00FF85] text-xs'>Online</p>
									</div>
								</div>
							</div>))}
						</div>
					)}
					<FaCamera className='text-[#7C01F6] absolute right-2 top-3 cursor-pointer' />
					{isRecording && <div className='rounded-md bg-[#272626] text-slate-400 text-base pl-2 pr-7 w-full h-full py-2 outline-none absolute top-0 flex justify-between items-center'><p>{formatTime(holdTime)}</p><p>&lt; Slide to cancel</p></div>}
					{!msg && (
                        <>
                            {window.innerWidth < 600 ? (
                                <div onTouchMove={handleTouchMove}>
                                    <MdKeyboardVoice className={`${isRecording ? 'text-white w-24 h-24 bg-[#312F2F] p-6 rounded-full right-[-80px] -top-7' : 'text-[#7C01F6] w-8 h-8 right-[-45px] top-1'} absolute transition-all cursor-pointer`} style={{transform: `translateX(-${slidePosition}px)`,opacity: isCancelled ? 0.5 : 1}} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
                                </div>
                            ) : (
                                <div className="absolute right-[-45px] top-1">
                                    {isDesktopRecording ? (
                                        <BsFillSendFill className='text-[#7C01F6] w-8 h-8 cursor-pointer' onClick={stopDesktopRecording} />
                                    ) : (
                                        <MdKeyboardVoice className='text-[#7C01F6] w-8 h-8 cursor-pointer' onClick={startDesktopRecording} />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {isDesktopRecording && (
                        <div className='rounded-md bg-[#272626] text-slate-400 text-base pl-2 pr-7 w-full h-full py-2 outline-none absolute top-0 flex justify-between items-center'>
                            <p>{formatTime(holdTime)}</p>
                            <MdDeleteOutline className="text-red-500 w-6 h-6 cursor-pointer" onClick={cancelDesktopRecording}/>
                        </div>
                    )}
					{msg && <BsFillSendFill className='text-[#7C01F6] w-8 h-8 cursor-pointer absolute right-[-45px] top-1' onClick={sendMessage} />}
				</div>
			</div>
		</div>
		</div>
	</>
	);
}