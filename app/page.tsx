"use client";

import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";

export default function P2PAnonimChat() {
  const [peerId, setPeerId] = useState<string>(""); // Sənin ID-n
  const [remoteId, setRemoteId] = useState<string>(""); // Qoşulmaq istədiyin ID
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState("Qoşulmayıb");
  
  const peerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // mIRC Səsləri (Qorunub)
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
    // Mesajları Local Storage-dən yüklə (Hər kəsin öz lokalında qalsın)
    const savedMessages = localStorage.getItem("p2p_messages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));

    // PeerJS obyektini yarat
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      setStatus("Gözləyir (ID hazırdır)");
    });

    // Başqası sənə qoşulanda
    peer.on("connection", (connection) => {
      setupConnection(connection);
    });

    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    // Mesajları hər dəfə yenilənəndə lokala yaz
    localStorage.setItem("p2p_messages", JSON.stringify(messages));
  }, [messages]);

  const setupConnection = (connection: any) => {
    setConn(connection);
    setStatus("Qoşuldu: " + connection.peer);

    connection.on("data", (data: any) => {
      setMessages((prev) => [...prev, data]);
      playRetroSound(800); // Gələn mesaj səsi
    });
  };

  const connectToPeer = () => {
    if (!remoteId) return;
    const connection = peerRef.current.connect(remoteId);
    setupConnection(connection);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conn) return;

    const msgData = {
      id: Date.now(),
      user: "Anonim",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: "me"
    };

    conn.send({ ...msgData, sender: "other", user: "Həmkar" }); // Qarşı tərəfə göndər
    setMessages((prev) => [...prev, msgData]); // Özünə əlavə et
    playRetroSound(600); // Göndərmə səsi
    setInput("");
  };

  return (
    <div className="h-screen bg-[#f0f2f5] flex items-center justify-center font-sans p-2">
      <div className="w-full h-full max-w-[1200px] bg-white flex flex-col md:flex-row shadow-2xl overflow-hidden md:rounded-2xl border border-gray-200">
        
        {/* Sol Panel: Qoşulma Tənzimləri */}
        <aside className="w-full md:w-[350px] border-r border-gray-100 p-6 flex flex-col gap-6 bg-gray-50/50">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Sənin Anonim ID-n</h3>
            <div className="bg-white p-3 rounded-xl border border-dashed border-blue-300 text-xs font-mono break-all select-all cursor-copy" title="Kopyalamaq üçün kliklə">
              {peerId || "Yüklənir..."}
            </div>
            <p className="text-[9px] text-gray-400 mt-2 italic">Bu ID-ni dostuna göndər ki, sənə qoşulsun.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Dostuna Qoşul</h3>
            <input 
              type="text" 
              placeholder="Dostunun ID-sini bura yaz..." 
              className="w-full p-3 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 ring-blue-400"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
            />
            <button 
              onClick={connectToPeer}
              className="w-full bg-[#3390ec] text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-600 transition"
            >
              Qoşul
            </button>
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${conn ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tighter">{status}</span>
            </div>
          </div>
        </aside>

        {/* Sağ Panel: Telegram Dizaynlı Çat */}
        <section className="flex-1 flex flex-col bg-[#e6eee3] relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <header className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center z-10 border-b border-gray-100">
             <h4 className="font-bold text-sm">P2P Anonim Söhbət</h4>
             <button onClick={() => {setMessages([]); localStorage.removeItem("p2p_messages");}} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Tarixçəni sil</button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 z-10" ref={scrollRef}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[14px] shadow-sm relative ${
                  msg.sender === "me" 
                  ? "self-end bg-[#eeffde] rounded-tr-none" 
                  : "self-start bg-white rounded-tl-none"
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[9px] text-gray-400">{msg.time}</span>
                  {msg.sender === "me" && <span className="text-blue-500 text-[10px]">✓✓</span>}
                </div>
              </div>
            ))}
          </div>

          <footer className="p-4 bg-white z-10">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input 
                type="text" 
                placeholder={conn ? "Mesaj yazın..." : "Əvvəlcə qoşulun..."}
                disabled={!conn}
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 outline-none text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={!conn} className="bg-[#3390ec] text-white p-3 rounded-full disabled:opacity-30">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
}