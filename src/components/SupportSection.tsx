import React, { useState } from 'react';
import { SupportMessage } from '../types';

interface SupportSectionProps {
  userCode: string;
  showToast: (msg: string) => void;
  saveMessage: (msg: SupportMessage) => Promise<void>;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ userCode, showToast, saveMessage }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const msg: SupportMessage = {
      id: Date.now().toString(),
      userCode,
      date: new Date().toISOString(),
      message: message.trim(),
      status: 'Pending'
    };

    try {
      await saveMessage(msg);
      setMessage('');
      showToast('✅ আপনার মেসেজটি এডমিনের কাছে পাঠানো হয়েছে!');
    } catch (error) {
      showToast('❌ মেসেজ পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-5 space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
      <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
        <i className="fa-solid fa-headset text-emerald-400"></i> এডমিন সাপোর্ট
      </h3>
      <p className="text-xs text-slate-400">আপনার যেকোনো সমস্যা বা প্রশ্ন থাকলে এখানে মেসেজ করুন, আমরা দ্রুত সমাধান দেব।</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="আপনার মেসেজ লিখুন..."
          className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 h-32"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl hover:bg-emerald-400 transition"
        >
          {loading ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}
        </button>
      </form>
    </div>
  );
};
