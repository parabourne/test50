"use client";

import { useState, useEffect, useRef } from "react";

export default function RetroChatPro() {
  const [messages, setMessages] = useState<{user: string, text: string, time: string, color: string, type?: string}[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("User" + Math.floor(Math.random() * 1000));
  const [status, setStatus] = useState("Qoşulub");
  const scrollRef = useRef<HTMLDivElement>(null);

  const colors = ["text-blue-700", "text-red-600", "text-green-700", "text-purple-600", "text-orange-600"];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Səs effekti simulyasiyası
  const playPing = () => {
    const context = new AudioContext();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.frequency.value = 800;
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
    osc.start();
    osc.stop(context.currentTime + 0.1);
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.split(" ");
    const action = parts[0].toLowerCase();

    switch (action) {
      case "/nick":
        if (parts[1]) {
          const oldNick = username;
          setUsername(parts[1]);
          setMessages(prev => [...prev, { user: "System", text: `${oldNick} adını ${parts[1]} olaraq dəyişdi.`, time: "", color: "text-gray-500", type: "system" }]);
        }
        break;
      case "/clear":
        setMessages([]);
        break;
      case "/me":
        const actionText = parts.slice(1).join(" ");
        setMessages(prev => [...prev, { user: "*", text: `${username} ${actionText}`, time: "", color: "text-purple-600", type: "action" }]);
        break;
      case "/help":
        setMessages(prev => [...prev, { user: "Help", text: "Komandalar: /nick, /clear, /me, /exit", time: "", color: "text-blue-500", type: "system" }]);
        break;
      default:
        setMessages(prev => [...prev, { user: "Error", text: "Naməlum komanda. /help yazın.", time: "", color: "text-red-500", type: "system" }]);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith("/")) {
      handleCommand(input);
    } else {
      const newMessage = {
        user: username,
        text: input,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      setMessages([...messages, newMessage]);
      playPing();
    }
    setInput("");
  };

  return (
    <div className="h-screen bg-[#c0c0c0] font-mono text-black flex flex-col p-1 overflow-hidden">
      
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex justify-between items-center text-sm font-bold shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#dfdfdf]">
        <div className="flex items-center gap-2 italic">
          <img src="https://mirc.com/favicon.ico" className="w-4 h-4" alt="mirc-icon" />
          <span>mIRC32 - [#Azerbaycan: mIRC Web Edition]</span>
        </div>
        <div className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-2 shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#ffffff]">_</button>
          <button className="bg-[#c0c0c0] text-black px-2 shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#ffffff]">X</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 p-1 bg-[#c0c0c0] border-b border-gray-400">
         {['Connect', 'Options', 'Channels', 'Files'].map(item => (
           <button key={item} className="px-2 py-1 text-[10px] border border-gray-500 bg-[#c0c0c0] shadow-[1px_1px_0px_white_inset,-1px_-1px_0px_gray_inset] active:shadow-inner">
             {item}
           </button>
         ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex gap-1 p-1 overflow-hidden min-h-0">
        {/* Chat Window */}
        <div className="flex-1 bg-white border-2 border-gray-500 overflow-y-auto p-4 flex flex-col gap-1 shadow-inner scroll-smooth" ref={scrollRef}>
          <div className="text-blue-800 text-xs mb-4">
            <pre className="leading-tight font-black">
{`   _   _  ____  ____   ____  
  | \\ | ||  _ \\|  _ \\ / ___| 
  |  \\| || |_) | |_) | |     
  | |\\  ||  _ <|  _ <| |___  
  |_| \\_||_| \\_\\_| \\_\\\\____| 
                             `}
            </pre>
            <p className="mt-2">*** Local time: {new Date().toLocaleString()}</p>
            <p>*** Your IP: 127.0.0.1 (Web-Proxy)</p>
          </div>
          
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.type === 'system' ? 'italic' : ''}`}>
              {msg.time && <span className="text-gray-400">[{msg.time}]</span>}{" "}
              {msg.type === 'action' ? (
                <span className={msg.color}>{msg.text}</span>
              ) : (
                <>
                  <span className={`font-bold ${msg.color}`}>{msg.user === 'System' ? '*' : `<${msg.user}>`}</span>{" "}
                  <span className="text-black">{msg.text}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* User List */}
        <div className="w-44 bg-white border-2 border-gray-500 overflow-y-auto hidden md:block">
          <div className="bg-[#e0e0e0] text-[10px] font-bold p-1 border-b border-gray-400 uppercase tracking-widest">3 Users</div>
          <ul className="text-xs p-1 space-y-1">
            <li className="text-red-700 font-bold">@ Admin_Bot</li>
            <li className="text-blue-700 font-bold font-italic">~ {username}</li>
            <li className="hover:bg-blue-800 hover:text-white px-1">Guest_22</li>
          </ul>
        </div>
      </div>

      {/* Input & Status Bar */}
      <div className="p-1 bg-[#c0c0c0]">
        <form onSubmit={sendMessage} className="flex gap-1 mb-1">
          <input 
            type="text" 
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white border-2 border-gray-600 px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-800"
            placeholder="Type command or message..."
          />
        </form>
        
        {/* Status Bar */}
        <div className="flex gap-0.5 text-[9px] font-bold uppercase">
          <div className="bg-[#c0c0c0] border border-gray-500 px-2 py-0.5 flex-1 shadow-inner">Status: {status}</div>
          <div className="bg-[#c0c0c0] border border-gray-500 px-2 py-0.5 w-32 shadow-inner">Baku: {new Date().getHours()}:{new Date().getMinutes()}</div>
          <div className="bg-[#c0c0c0] border border-gray-500 px-2 py-0.5 w-24 shadow-inner text-green-700">64ms</div>
        </div>
      </div>
    </div>
  );
}