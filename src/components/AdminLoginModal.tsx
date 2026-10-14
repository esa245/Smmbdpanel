import React from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmailInput: string;
  setAdminEmailInput: (val: string) => void;
  adminPassInput: string;
  setAdminPassInput: (val: string) => void;
  handleAdminLoginSubmit: (e: React.FormEvent) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  adminEmailInput,
  setAdminEmailInput,
  adminPassInput,
  setAdminPassInput,
  handleAdminLoginSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-500/40 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl mx-auto flex items-center justify-center text-xl border border-red-500/30">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h3 className="text-base font-black text-slate-100">এডমিন প্যানেল লগইন</h3>
          <p className="text-[11px] text-slate-400">এডমিন একাউন্টে প্রবেশ করতে ক্রেডেনশিয়াল দিন</p>
        </div>

        <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">ইমেইল / ইউজারনেম:</label>
            <input
              type="text"
              required
              placeholder="ইমেইল"
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 focus:border-red-500 rounded-xl text-xs font-semibold text-slate-200 outline-none transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 mb-1 block">পাসওয়ার্ড:</label>
            <input
              type="password"
              required
              placeholder="পাসওয়ার্ড"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 focus:border-red-500 rounded-xl text-xs font-semibold text-slate-200 outline-none transition"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-right-to-bracket"></i> লগইন করুন
          </button>
        </form>
      </div>
    </div>
  );
};
