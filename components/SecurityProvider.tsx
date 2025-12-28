
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, SecuritySession } from '../types';

interface SecurityContextType {
  session: SecuritySession | null;
  isLocked: boolean;
  tamperDetected: boolean;
  login: (role: UserRole, pin: string) => Promise<boolean>;
  logout: () => void;
  lock: () => void;
  setTamper: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const DEFAULT_PINS = {
  [UserRole.USER_A]: '0000',
  [UserRole.USER_B]: '1111'
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SecuritySession | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [tamperDetected, setTamperDetected] = useState(false);

  useEffect(() => {
    let timer: number;
    const resetTimer = () => {
      window.clearTimeout(timer);
      if (session && !isLocked) {
        timer = window.setTimeout(() => setIsLocked(true), 300000); // 5 min lock
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.clearTimeout(timer);
    };
  }, [session, isLocked]);

  const getStoredPin = (role: UserRole) => {
    return localStorage.getItem(`aegis_pin_${role}`) || DEFAULT_PINS[role];
  };

  const login = async (role: UserRole, pin: string) => {
    const storedPin = getStoredPin(role);
    if (pin === storedPin) {
      setSession({
        role,
        pinHash: 'active_session_hash',
        sessionKey: 'AES_256_GCM_HARDWARE_KEY'
      });
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const changePin = async (oldPin: string, newPin: string) => {
    if (!session) return false;
    const storedPin = getStoredPin(session.role);
    if (oldPin === storedPin && newPin.length === 4) {
      localStorage.setItem(`aegis_pin_${session.role}`, newPin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setSession(null);
    setIsLocked(false);
  };

  const lock = () => setIsLocked(true);
  const setTamper = () => setTamperDetected(true);

  return (
    <SecurityContext.Provider value={{ session, isLocked, tamperDetected, login, logout, lock, setTamper, changePin }}>
      {tamperDetected ? (
        <div className="fixed inset-0 bg-red-950 flex items-center justify-center z-[999] p-8 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">System Tamper Detected</h1>
            <p className="text-red-200">Integrity Violation. Local Vault Purged.</p>
          </div>
        </div>
      ) : (
        children
      )}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};
