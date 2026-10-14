import React from 'react';

interface HeaderSectorProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  setSidebarOpen: (open: boolean) => void;
  userCode: string;
  balance: number;
  setIsAddFundModalOpen: (open: boolean) => void;
  handleAdminAccess: () => void;
  setIsAdminLoggedIn: (logged: boolean) => void;
  showToast: (msg: string) => void;
}

export const HeaderSector: React.FC<HeaderSectorProps> = ({
  activeSection,
  setActiveSection,
  setSidebarOpen,
  userCode,
  balance,
  setIsAddFundModalOpen,
  handleAdminAccess,
  setIsAdminLoggedIn,
  showToast
}) => {
  const [clickCount, setClickCount] = React.useState(0);
  return (
    <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800 p-3 px-5 flex justify-between items-center sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-lg text-slate-300 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
        {activeSection === 'admin' ? (
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-400 font-bold text-xs px-3 py-1 rounded-xl border border-red-500/30 flex items-center gap-1.5 shadow-sm">
              <i className="fa-solid fa-shield-halved"></i> এডমিন প্যানেল মোড
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
              Romjan (Admin)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-emerald-400 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">
              ID: #{userCode}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              রিয়েল-টাইম ডাটাবেজ
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeSection === 'admin' ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveSection('dashboard')}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left"></i> ইউজার প্যানেলে ফিরে যান
            </button>
            <button 
              onClick={() => {
                setIsAdminLoggedIn(false);
                setActiveSection('dashboard');
                showToast('🔒 এডমিন থেকে লগআউট করা হয়েছে');
              }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> লগআউট
            </button>
          </div>
        ) : (
          <>
            <div 
              onClick={() => {
                const newCount = (clickCount || 0) + 1;
                setClickCount(newCount);
                if (newCount === 5) {
                  handleAdminAccess();
                  setClickCount(0);
                }
              }}
              className="cursor-pointer bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5"
            >
              <i className="fa-solid fa-wallet"></i> ৳ {(Number(balance) || 0).toFixed(2)}
            </div>
            <button 
              onClick={() => setIsAddFundModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-plus-circle"></i> ডিপোজিট
            </button>
          </>
        )}
      </div>
    </header>
  );
};
