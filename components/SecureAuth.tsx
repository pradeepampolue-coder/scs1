
import React, { useState } from 'react';
import { useSecurity } from './SecurityProvider';
import { UserRole } from '../types';

const SecureAuth: React.FC = () => {
  const { login } = useSecurity();
  const [role, setRole] = useState<UserRole>(UserRole.USER_A);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Simulate slow hardware decryption
    setTimeout(async () => {
      const success = await login(role, pin);
      if (!success) {
        setError(true);
        setPin('');
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 mono relative overflow-hidden">
      <div className="scanline"></div>
      
      <div className="max-w-md w-full glass border border-green-900/30 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-block p-4 border-2 border-green-500 rounded-full mb-4 animate-pulse">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-green-500">Aegis Enclave</h1>
          <p className="text-[10px] text-green-800 mt-2 uppercase tracking-[0.3em]">Encrypted Offline Messenger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-green-950/20 rounded-lg border border-green-900/30">
            <button
              type="button"
              onClick={() => setRole(UserRole.USER_A)}
              className={`py-2 text-[11px] uppercase tracking-widest rounded-md transition-all ${role === UserRole.USER_A ? 'bg-green-600 text-black font-bold' : 'text-green-800'}`}
            >
              Node A
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.USER_B)}
              className={`py-2 text-[11px] uppercase tracking-widest rounded-md transition-all ${role === UserRole.USER_B ? 'bg-green-600 text-black font-bold' : 'text-green-800'}`}
            >
              Node B
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase text-green-800 tracking-widest block ml-1">Pin Identification</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full bg-black border border-green-900/50 rounded-lg px-4 py-4 text-center text-2xl tracking-[1em] text-green-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-600 text-[10px] text-center uppercase animate-bounce font-bold">
              Invalid Credential. Access Logged.
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className={`w-full py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 ${
              pin.length === 4 ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-green-950 text-green-900 cursor-not-allowed'
            }`}
          >
            {loading ? 'Decrypting Vault...' : 'Authorize Uplink'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-green-900/10 space-y-2">
            <div className="flex justify-between text-[9px] text-green-900 font-bold">
                <span>PEER STATUS</span>
                <span className="text-green-600">STANDBY</span>
            </div>
            <div className="flex justify-between text-[9px] text-green-900 font-bold">
                <span>ENCRYPTION</span>
                <span className="text-green-600">AES-256-GCM</span>
            </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 text-[9px] text-green-900 opacity-50 uppercase tracking-widest">
        Property of Aegis Security Group / Offline-Only Protocol
      </div>
    </div>
  );
};

export default SecureAuth;
