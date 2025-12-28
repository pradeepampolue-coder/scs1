
import React, { useState, useEffect, useRef } from 'react';
import { useSecurity } from './SecurityProvider';
import { CommsChannel, Message, UserRole, LocationData } from '../types';
import { P2PService } from '../services/p2pService';
import TacticalMap from './TacticalMap';

const Dashboard: React.FC = () => {
  const { session, logout, lock, changePin } = useSecurity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sharingLocation, setSharingLocation] = useState(false);
  const [peerLocation, setPeerLocation] = useState<LocationData | null>(null);
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'map'>('chat');
  
  // Call State
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [pinChange, setPinChange] = useState({ old: '', new: '' });
  const [settingsStatus, setSettingsStatus] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const p2pRef = useRef<P2PService | null>(null);

  useEffect(() => {
    p2pRef.current = new P2PService((payload) => {
      if (payload.type === 'MESSAGE') {
        setMessages(prev => [...prev, payload.data]);
      } else if (payload.type === 'LOCATION') {
        setPeerLocation(payload.data);
      } else if (payload.type === 'CALL_REQUEST') {
        if (confirm(`Incoming Secure Video Link from ${payload.sender}. Accept?`)) {
          startCall(false);
        }
      } else if (payload.type === 'CALL_END') {
        stopCall();
      }
    });
    return () => {
      p2pRef.current?.close();
      stopCall();
    };
  }, []);

  // Location Tracking Effect
  useEffect(() => {
    let watchId: number;
    if (sharingLocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const loc: LocationData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          accuracy: pos.coords.accuracy
        };
        setMyLocation(loc);
        p2pRef.current?.broadcast({ type: 'LOCATION', data: loc, sender: session?.role });
      }, (err) => console.error(err), { enableHighAccuracy: true });
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharingLocation, session?.role]);

  const startCall = async (broadcast = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsInCall(true);
      if (broadcast) {
        p2pRef.current?.broadcast({ type: 'CALL_REQUEST', sender: session?.role });
      }
    } catch (err) {
      alert("Encryption failure: Camera access denied.");
    }
  };

  const stopCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setIsInCall(false);
    p2pRef.current?.broadcast({ type: 'CALL_END', sender: session?.role });
  };

  const handleSend = async () => {
    if (!input.trim() || !session) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: session.role,
      content: input,
      timestamp: Date.now(),
      type: 'text',
      isEncrypted: true
    };
    setMessages(prev => [...prev, newMessage]);
    p2pRef.current?.broadcast({ type: 'MESSAGE', data: newMessage });
    setInput('');
  };

  const handlePinChange = async () => {
    const success = await changePin(pinChange.old, pinChange.new);
    if (success) {
      setSettingsStatus('Vault PIN Updated Successfully.');
      setPinChange({ old: '', new: '' });
      setTimeout(() => setShowSettings(false), 2000);
    } else {
      setSettingsStatus('Integrity Error: Invalid Current PIN.');
    }
  };

  const getOtherUser = () => session?.role === UserRole.USER_A ? 'USER_B' : 'USER_A';

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-green-500 mono overflow-hidden relative">
      <div className="scanline"></div>
      
      {/* HUD HEADER */}
      <div className="h-16 glass border-b border-green-900/30 flex items-center justify-between px-6 z-40">
        <div className="flex items-center space-x-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <div>
            <h1 className="text-xs font-bold tracking-[0.3em] uppercase">AEGIS-SATELLITE v2.0</h1>
            <p className="text-[9px] text-green-800">UPLINK: ACTIVE | ENCRYPTION: 256-GCM</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView(activeView === 'chat' ? 'map' : 'chat')}
            className={`px-4 py-1.5 border rounded text-[10px] uppercase font-bold transition-all ${activeView === 'map' ? 'bg-green-500 text-black border-green-500' : 'bg-green-900/20 border-green-900 text-green-500 hover:bg-green-900/40'}`}
          >
            {activeView === 'chat' ? 'Tactical Map' : 'Secure Chat'}
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 border border-green-900/50 rounded hover:bg-green-900/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={() => startCall()} className="px-4 py-1.5 bg-green-900/20 border border-green-500 rounded text-[10px] uppercase font-bold hover:bg-green-500 hover:text-black transition-all">
            Secure Video
          </button>
          <button onClick={logout} className="px-4 py-1.5 bg-red-950 text-red-500 border border-red-900 rounded text-[10px] uppercase font-bold">
            Kill
          </button>
        </div>
      </div>

      {/* VIDEO HUD OVERLAY */}
      {isInCall && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="absolute top-8 left-8 text-[10px] text-green-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> REC_OFF | ENCRYPTED_LINK_ACTIVE
          </div>
          <video 
            ref={(el) => { if (el && localStream) el.srcObject = localStream; }} 
            autoPlay 
            muted 
            className="h-3/4 aspect-video border-2 border-green-500 rounded-xl shadow-[0_0_50px_rgba(34,197,94,0.3)] bg-green-950/20 grayscale sepia hue-rotate-[100deg]"
          />
          <div className="mt-8 flex gap-6">
            <button onClick={stopCall} className="px-8 py-3 bg-red-600 text-black font-bold uppercase rounded-lg hover:bg-red-500 transition-all">
              End Secure Link
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 z-50 glass flex items-center justify-center">
          <div className="w-full max-w-sm bg-black border border-green-900 p-8 rounded-xl space-y-6">
            <div className="flex justify-between items-center border-b border-green-900 pb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest">Vault Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-green-900 hover:text-green-500">ESC</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-green-900 block mb-1">Current Pin</label>
                <input type="password" value={pinChange.old} onChange={e => setPinChange({...pinChange, old: e.target.value})} maxLength={4} className="w-full bg-black border border-green-900 rounded px-3 py-2 focus:border-green-500 outline-none text-center" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-green-900 block mb-1">New Pin</label>
                <input type="password" value={pinChange.new} onChange={e => setPinChange({...pinChange, new: e.target.value})} maxLength={4} className="w-full bg-black border border-green-900 rounded px-3 py-2 focus:border-green-500 outline-none text-center" />
              </div>
              {settingsStatus && <p className="text-[9px] text-center text-red-500 uppercase">{settingsStatus}</p>}
              <button onClick={handlePinChange} className="w-full py-3 bg-green-600 text-black font-bold text-[10px] uppercase tracking-widest rounded">Commit Updates</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-72 glass border-r border-green-900/30 flex flex-col p-4 z-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-[10px] text-green-800 uppercase tracking-[0.2em] mb-3">Satellite Tracking</h2>
              <div className="p-3 bg-green-950/20 border border-green-900 rounded space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span>GPS BROADCAST</span>
                  <button onClick={() => setSharingLocation(!sharingLocation)} className={`px-2 py-0.5 rounded text-[9px] border ${sharingLocation ? 'bg-green-600 text-black border-green-500' : 'bg-transparent text-green-900 border-green-900'}`}>
                    {sharingLocation ? 'ACTIVE' : 'OFFLINE'}
                  </button>
                </div>
                {myLocation && (
                  <div className="text-[9px] text-green-700">
                    LOC: {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}
                  </div>
                )}
                {peerLocation ? (
                  <div className="pt-2 border-t border-green-900/30">
                    <p className="text-[10px] uppercase mb-1">Peer Node ({getOtherUser()})</p>
                    <div className="text-[9px] text-green-500">POS: {peerLocation.lat.toFixed(4)}, {peerLocation.lng.toFixed(4)}</div>
                    <div className="text-[8px] text-green-900 mt-1 uppercase">Updated: {new Date(peerLocation.timestamp).toLocaleTimeString()}</div>
                  </div>
                ) : (
                  <div className="text-[9px] text-green-900 uppercase">Waiting for peer location signal...</div>
                )}
              </div>
            </div>

            <div className="p-3 border border-green-900/50 rounded bg-green-950/10">
              <h3 className="text-[9px] uppercase mb-2">Comms Stability</h3>
              <div className="h-1 bg-green-900 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[92%] animate-pulse"></div>
              </div>
              <p className="text-[8px] mt-2 text-green-900">LEO SATELLITE: IRIDIUM-NEXT-824</p>
            </div>

            {/* QUICK PREVIEW IF IN CHAT MODE */}
            {activeView === 'chat' && peerLocation && (
              <div 
                className="h-32 bg-black border border-green-900/50 rounded overflow-hidden relative cursor-pointer"
                onClick={() => setActiveView('map')}
              >
                <div className="absolute inset-0 opacity-40 grayscale sepia hue-rotate-[100deg]">
                  {/* Miniature Map Preview Mock */}
                  <div className="w-full h-full bg-[#111] flex items-center justify-center text-[8px] text-green-950">MINI_MAP_HUD</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] uppercase tracking-widest text-green-500 bg-black/80 px-2 py-1 border border-green-500/20">Expand Map</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-green-900/10 text-[9px] text-green-900 uppercase tracking-widest text-center">
            Zero Internet Dependency Enforced
          </div>
        </div>

        {/* MAIN VIEW AREA */}
        <div className="flex-1 flex flex-col relative z-0 bg-black/40">
          {activeView === 'chat' ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-green-900">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <div className="w-16 h-16 border-2 border-green-900 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <p className="text-xs uppercase tracking-[0.5em]">Secure Vault Ready</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === session?.role ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-green-900 uppercase font-bold">{msg.sender}</span>
                      <span className="text-[9px] text-green-900">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-sm border ${msg.sender === session?.role ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-green-900/10 border-green-900/50 text-green-600'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 glass border-t border-green-900/30">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Secure transmission..."
                    className="flex-1 bg-black/40 border border-green-900/50 rounded px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 text-green-400"
                  />
                  <button onClick={handleSend} className="bg-green-600 text-black px-6 rounded font-bold uppercase text-[10px] tracking-widest hover:bg-green-500 transition-all">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-green-500">Global Tactical View</h2>
                <div className="flex items-center gap-4 text-[9px] text-green-800">
                  <span>LAT: {myLocation?.lat.toFixed(6) || 'N/A'}</span>
                  <span>LNG: {myLocation?.lng.toFixed(6) || 'N/A'}</span>
                </div>
              </div>
              <div className="flex-1">
                <TacticalMap 
                  myLocation={myLocation} 
                  peerLocation={peerLocation} 
                  myRole={session?.role || UserRole.USER_A} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
