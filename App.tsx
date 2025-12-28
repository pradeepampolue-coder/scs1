
import React from 'react';
import { SecurityProvider, useSecurity } from './components/SecurityProvider';
import SecureAuth from './components/SecureAuth';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { session, isLocked } = useSecurity();

  if (!session) {
    return <SecureAuth />;
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 mono text-center">
        <div className="max-w-xs space-y-6">
          <div className="w-16 h-16 border-2 border-green-900 rounded-full mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-green-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          </div>
          <h2 className="text-green-900 text-sm uppercase tracking-widest font-bold">Session Suspended</h2>
          <p className="text-green-950 text-[10px]">Application locked due to inactivity or background movement. Re-authorize to resume uplink.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-green-900/20 border border-green-900 text-green-700 text-[10px] uppercase font-bold tracking-widest hover:bg-green-900/30 transition-all"
          >
            Re-Authorize Node
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
};

export default App;
