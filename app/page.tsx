"use client";

import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";

export default function P2PAnonimChat() {
  const [peerId, setPeerId] = useState<string>("");
  const [remoteId, setRemoteId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState("Yüklənir...");
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  
  const peerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const playRetroSound = (freq = 800) => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.frequency.value = freq;
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
      osc.start();
      osc.stop(context.currentTime + 0.1);
    } catch (e) { console.warn("Səs işləmədi."); }
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("p2p_messages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));

    let savedId = localStorage.getItem("my_stable_peer_id");
    if (!savedId) {
      savedId = "user-" + Math.random().toString(36).substr(2, 6);
      localStorage.setItem("my_stable_peer_id", savedId);
    }

    const peer = new Peer(savedId);
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      setStatus("Onlayn (Gözləyir)");
    });

    peer.on("connection", (connection) => {
      setupConnection(connection);
    });

    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    localStorage.setItem("p2p_messages", JSON.stringify(messages));
  }, [messages]);

  const setupConnection = (connection: any) => {
    setStatus("Bağlantı qurulur...");

    connection.on("open", () => {
      setConn(connection);
      setStatus("Qoşuldu: " + connection.peer);
      playRetroSound(1000);
    });

    connection.on("data", (data: any) => {
      // Əgər gələn data TYPING siqnalıdırsa
      if (data.type === "TYPING") {
        setRemoteIsTyping(data.status);
        return;
      }

      // Normal mesajdırsa
      setMessages((prev) => [...prev, data]);
      setRemoteIsTyping(false); // Mesaj gəldisə yazmağı dayandırıb
      playRetroSound(800);
    });

    connection.on("close", () => {
      setStatus("Bağlantı kəsildi.");
      setConn(null);
      setRemoteIsTyping(false);
    });
  };

  // Mesaj yazarkən typing statusunu göndər
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (conn) {
      // Qarşı tərəfə "Yazıram" siqnalı göndər
      conn.send({ type: "TYPING", status: true });

      // 2 saniyə heç nə yazmasa "typing" statusunu söndür
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (conn) conn.send({ type: "TYPING", status: false });
      }, 2000);
    }
  };

  const connectToPeer = () => {
    if (!remoteId || remoteId === peerId) return;
    if (conn) conn.close();
    const connection = peerRef.current.connect(remoteId);
    setupConnection(connection);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conn) return;

    const msgData = {
      id: Date.now(),
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: "me"
    };

    conn.send({ type: "MESSAGE", ...msgData, sender: "other" });
    // Mesaj göndəriləndə typing statusunu dərhal söndür
    conn.send({ type: "TYPING", status: false });
    
    setMessages((prev) => [...prev, msgData]);
    playRetroSound(600);
    setInput("");
  };

  return (
    <div className="h-screen bg-[#f0f2f5] flex items-center justify-center font-sans p-2">
      <div className="w-full h-full max-w-[1200px] bg-white flex flex-col md:flex-row shadow-2xl overflow-hidden md:rounded-2xl border border-gray-200">
        
        <aside className="w-full md:w-[350px] border-r border-gray-100 p-6 flex flex-col gap-6 bg-gray-50/50">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Sənin Sabit ID-n</h3>
            <div className="bg-white p-3 rounded-xl border border-dashed border-blue-300 text-xs font-mono break-all select-all cursor-copy">
              {peerId || "Yüklənir..."}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Dostuna Qoşul</h3>
            <input 
              type="text" 
              placeholder="ID-ni bura yaz..." 
              className="w-full p-3 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 ring-blue-400"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
            />
            <button 
              onClick={connectToPeer}
              className="w-full bg-[#3390ec] text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-600 transition"
            >
              Bağlan
            </button>
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${conn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500 animate-pulse'}`}></span>
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tighter">{status}</span>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-[#e6eee3] relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <header className="bg-white/90 backdrop-blur-md p-4 flex justify-between items-center z-10 border-b border-gray-100 shadow-sm">
             <div>
               <h4 className="font-bold text-sm flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                 Anonim P2P Chat
               </h4>
               {remoteIsTyping ? (
                 <p className="text-[11px] text-blue-500 italic animate-pulse">Həmkarınız yazır...</p>
               ) : (
                 <p className="text-[11px] text-green-500 font-medium">{conn ? 'online' : 'gözlənilir'}</p>
               )}
             </div>
             <button onClick={() => {if(confirm("Tarixçə silinsin?")) {setMessages([]); localStorage.removeItem("p2p_messages");}}} className="text-[9px] font-bold text-gray-400 uppercase hover:text-red-500 transition-colors">Tarixçəni təmizlə</button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 z-10" ref={scrollRef}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[14px] shadow-sm relative ${
                  msg.sender === "me" 
                  ? "self-end bg-[#eeffde] rounded-tr-none border border-green-100" 
                  : "self-start bg-white rounded-tl-none border border-gray-100"
                }`}
              >
                <p className="leading-relaxed text-slate-800">{msg.text}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[9px] text-gray-400">{msg.time}</span>
                  {msg.sender === "me" && <span className="text-blue-500 text-[10px] font-bold">✓✓</span>}
                </div>
              </div>
            ))}
          </div>

          <footer className="p-4 bg-white z-10 border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input 
                type="text" 
                placeholder={conn ? "Mesaj yazın..." : "Əvvəlcə dostuna bağlan..."}
                disabled={!conn}
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 outline-none text-sm focus:bg-white focus:ring-1 ring-blue-100 transition-all"
                value={input}
                onChange={handleInputChange}
              />
              <button type="submit" disabled={!conn} className="bg-[#3390ec] text-white p-3 rounded-full disabled:opacity-30 hover:bg-blue-600 transition-transform active:scale-90">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
}