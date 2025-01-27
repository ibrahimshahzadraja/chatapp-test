"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { socket } from '@/socket';

export default function Chat() {
    const { chatname } = useParams();
    const router = useRouter();

    const [isMember, setIsMember] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
	const [userDetails, setUserDetails] = useState({});

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
			socket.emit("leaveRoom", chatname)
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

    async function sendMessage() {
        console.log('Sending message:', msg);
        socket.emit("sendMessage", { chatname, username: userDetails.username ,message: msg });
		setMessages(m => [...m, {text: msg, username: userDetails.username, isSentByMe: true, createdAt: new Date().toISOString()}])
        
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
						setUserDetails(data.data);
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
	}, [])

    useEffect(() => {
		socket.emit("joinRoom", chatname);

        socket.on("message", (username, message) => {
            console.log('Received message:', message);
            setMessages(m => [...m, {text: message, username, isSentByMe: false, createdAt: new Date().toISOString()}]);
        });

		socket.on("roomDeleted", (message) => {
			console.log(message);
			router.push("/");
		})

        return () => {
            socket.off("message");
        };
    }, []);

    if(!isMember && !isOwner){
        return(
            <div>Loading...</div>
        )
    }

	return (
		<>
		  <div>Chat</div>
		  {messages.map((message, index) => (
			<div key={index} className={message.isSentByMe ? 'bg-green-400 text-white' : 'bg-gray-700 text-white'}>
			  {message.username}:{message.text}/{message.createdAt}
			</div>
		  ))}
		    <div>
                <input type="text" placeholder="Enter message" className="border-2 border-black" value={msg} onChange={(e) => setMsg(e.target.value)} />
                <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={sendMessage}>Send</button>
            </div>
			{!isOwner && <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={leaveChat}>Leave chat {chatname}</button>}
			{isOwner && <button className="px-3 py-1 cursor-pointer m-1 bg-red-800 text-white" onClick={deleteChat}>Delete chat {chatname}</button>}
		</>
	  );
	  
}
