"use client";




import { AlertCircle, Bot, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

interface ChatBotMetadata {
    id: string;
    color: string;
    welcome_message:string;
}

interface Section {
    id:string;
    name:string;
    source_ids: string[];

}

const EmbedPage = () => {

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

     const [metadata, setMetadata] = useState<ChatBotMetadata | null>(null);
     const [sections, setSections] = useState<Section[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState("");
     const [isOpen, setIsOpen] = useState(false) ; // Default closed (toggle button)

     // chat states

     const [messages, setMessages] = useState<any[]>([]);
     const [input, setInput] = useState("");
     const [isTyping, setIsTyping] = useState(false);
     const [activeSection, setActiveSection] = useState<string | null>(null);
     const scrollViewportRef = useRef<HTMLDivElement>(null);




     useEffect(()=>{
        document.body.style.backgroundColor = "transparent";
        document.documentElement.style.backgroundColor = "transparent";

        if(typeof window !== undefined){
            window.parent.postMessage({
                type: "resize",
                width: "60px",
                height: "60px",
                borderRadius: "30px"
            },"*" )
        }


     },[]);

     const toggleOpen = ()=>{
        const newState = !isOpen;
        setIsOpen(newState)

        if(newState){
            window.parent.postMessage({
                type: "resize",
                width: "380px",
                height: "520px",
                borderRadius: "12px"
            },"*");
        }else {

            window.parent.postMessage(
                {type: "resize", width: "60px",
                    height: "60px",
                    borderRadius: "30px"
                },
                "*"
            );




        }


     };



     useEffect(()=>{
        if(!token){
            setError("Missing session token");
            setLoading(false);
            return;
        }

        const fetchConfig = async ()=>{
            try {
                const res = await fetch(`/api/widget/config?token=${token}`);

                if(!res.ok) throw new Error("Failed to load widget configuration");

                const data = await res.json();

                setMetadata(data.metadata);
                setSections(data.sections || []);

                // Initialize Chat

                setMessages([{
                    role: "assistant",
                    content: data.metadata.welcome_message || "Hi! How can I help you?",
                    isWelcome:true,
                    section: null,
                }])
                
            } catch (error) {
                console.error(error);
                setError("Unable to load chat. Please try again later.")
                
            }finally{
                setLoading(false)
            }
        }

        fetchConfig();


     },[]);

     useEffect(()=>{
        if(scrollViewportRef.current){
            scrollViewportRef.current.scrollIntoView({behavior: "smooth"})
        }
     },[messages, isTyping,isOpen]); // Scroll when opened too




const handleSend = async()=>{

}


const handleKeyDown = (e:React.KeyboardEvent)=>{
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();

        handleSend();

    }
}


const primaryColor = metadata?.color || "#4f46e5";

if(loading) return null;

if(error && isOpen){
    return(
        <div className='flex flex-col items-center justify-center h-full bg-[#0e0e0e]'>
            <AlertCircle className='w-10 h-10 mb-2' />
            <p>{error}</p>
        </div>
    )
}

if(!isOpen){
    return (
        <button
        onClick={toggleOpen}
        className='w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all text-white'
        style={{backgroundColor: primaryColor}}
        >
            <MessageCircle  className='w-8 h-8' />

        </button>
    )
}


  return (
    <div className='flex flex-col h-screen bg-[#0A0A0E] overflow-hidden rounded-xl border border-white/10 shadow-2xl'>
        <div className='h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#0E0E12] shadow-sm shrink-0 z-20'>
        <div className='flex items-center gap-3'>
            <div className='relative'>
                <div className='w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/5 overflow-hidden'>
                                    <Image
                                    src={"/happy-customer-service-agent.jpg"}
                                    alt='Support Agent'
                                    className='w-full h-full rounded-md object-cover'
                                    width={40}
                                    height={40}
                                     />
                
                                    </div>
                <div className='absolute -bottom-0.5 -right-0.5 w-3 bg-emerald-500 border-2'>

                </div>

            </div>

        </div>


        </div>
     
    </div>
  )
}

export default EmbedPage;