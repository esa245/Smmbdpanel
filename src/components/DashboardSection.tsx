import React from 'react';
import { Order, ServiceItem } from '../types';

interface DashboardSectionProps {
  balance: number;
  orders: Order[];
  services: ServiceItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  orderLink: string;
  setOrderLink: (link: string) => void;
  orderQuantity: string;
  setOrderQuantity: (qty: string) => void;
  isLoading: boolean;
  handlePlaceOrder: (e: React.FormEvent) => void;
  setIsAddFundModalOpen: (open: boolean) => void;
  userCode?: string;
  setActiveSection?: (section: string) => void;
  showToast?: (msg: string) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  balance,
  orders,
  services,
  selectedCategory,
  setSelectedCategory,
  selectedServiceId,
  setSelectedServiceId,
  orderLink,
  setOrderLink,
  orderQuantity,
  setOrderQuantity,
  isLoading,
  handlePlaceOrder,
  setIsAddFundModalOpen,
  userCode,
  setActiveSection,
  showToast
}) => {
  const completedCount = orders.filter(o => o.status === 'Completed').length;
  const totalSpent = orders.reduce((acc, o) => acc + (o.charge || 0), 0);

  const categories = Array.from(new Set(services.map(s => s.category)));
  const filteredServices = selectedCategory ? services.filter(s => s.category === selectedCategory) : [];
  const currentService = services.find(s => s.id.toString() === selectedServiceId || s.service?.toString() === selectedServiceId);
  const qtyNum = parseFloat(orderQuantity) || 0;
  const totalPriceBdt = currentService ? (qtyNum / 1000) * currentService.rateBdt : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase">বর্তমান ব্যালেন্স</p>
            <h3 className="text-xl font-black text-emerald-400 mt-1">৳ {(Number(balance) || 0).toFixed(2)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base">
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase">মোট অর্ডার</p>
            <h3 className="text-xl font-black text-slate-100 mt-1">{orders.length}টি</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-base">
            <i className="fa-solid fa-bag-shopping"></i>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase">সম্পন্ন</p>
            <h3 className="text-xl font-black text-slate-100 mt-1">{completedCount}টি</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase">মোট খরচ</p>
            <h3 className="text-xl font-black text-slate-100 mt-1">৳ {(Number(totalSpent) || 0).toFixed(0)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-base">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
        </div>
      </div>

      {/* Quick Order Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-cart-plus text-emerald-400"></i> নতুন অর্ডার করুন (ব্যালেন্স থাকতে হবে)
          </span>
          <button 
            onClick={() => setIsAddFundModalOpen(true)}
            className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
          >
            <i className="fa-solid fa-plus-circle"></i> ডিপোজিট করুন
          </button>
        </h3>

        <form onSubmit={handlePlaceOrder} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">ক্যাটাগরি</label>
              <select
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedServiceId('');
                }}
              >
                <option value="">-- ক্যাটাগরি সিলেক্ট করুন --</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">সার্ভিস</label>
              <select
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">-- সার্ভিস সিলেক্ট করুন --</option>
                {filteredServices.map(s => (
                  <option key={s.id} value={s.id}>
                    [#{s.id}] {s.name} (৳{s.rateBdt}/1K)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentService && (
            <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-[11px] text-emerald-200 flex flex-wrap justify-between items-center gap-2">
              <span>মিনিমাম: {currentService.min} | সর্বোচ্চ: {(currentService.max || 100000).toLocaleString()}</span>
              <span className="font-bold text-yellow-400">রেট: ৳ {(Number(currentService.rateBdt) || 0).toFixed(2)} প্রতি ১,০০০</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">লিংক</label>
            <input
              type="url"
              required
              placeholder="https://..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              value={orderLink}
              onChange={(e) => setOrderLink(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">পরিমাণ</label>
            <input
              type="number"
              required
              placeholder="1000"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value)}
            />
          </div>

          {currentService && qtyNum > 0 && (
            <div className="bg-slate-800/80 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-700/50">
              <span className="text-slate-400">মোট খরচ হবে:</span>
              <span className="text-emerald-400 font-black text-sm">৳ {(Number(totalPriceBdt) || 0).toFixed(2)}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
            <span>অর্ডার সাবমিট করুন</span>
          </button>
        </form>
      </div>

      {/* 🎁 QUICK REFERRAL DIRECT SHARE BANNER */}
      {userCode && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                <i className="fa-solid fa-share-nodes"></i>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-100 flex items-center gap-2">
                  বন্ধুকে রেফার করুন ও ক্যাশ বোনাস আয় করুন!
                </h4>
                <p className="text-[11px] text-slate-400">
                  প্রতি রেফারে আপনি পাবেন কমিশন, আপনার বন্ধু পাবে ফ্রি ওয়েলকাম ব্যালেন্স
                </p>
              </div>
            </div>
            {setActiveSection && (
              <button
                onClick={() => setActiveSection('referral')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                সব ডিটেইলস দেখুন <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                const link = `${window.location.origin}/?ref=${userCode}`;
                const msg = `🔥 SMM BD Pro তে জয়েন করলেই ফ্রি বোনাস পাবেন! বেস্ট সোশ্যাল মিডিয়া প্যানেল: ${link}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                if (showToast) showToast('🚀 হোয়াটসঅ্যাপে রেফার ওপেন হচ্ছে...');
              }}
              className="px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp text-sm"></i> WhatsApp শেয়ার
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/?ref=${userCode}`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
                if (showToast) showToast('🚀 ফেসবুকে শেয়ার ওপেন হচ্ছে...');
              }}
              className="px-3 py-2 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-[#1877F2] text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-brands fa-facebook-f text-sm"></i> Facebook শেয়ার
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/?ref=${userCode}`;
                const msg = `🔥 SMM BD Pro - সোশ্যাল মিডিয়া ফলোয়ার ও লাইক প্যানেল! ফ্রি বোনাস লিংক: ${link}`;
                window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`, '_blank');
                if (showToast) showToast('🚀 টেলিগ্রামে শেয়ার ওপেন হচ্ছে...');
              }}
              className="px-3 py-2 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-[#229ED9] text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-brands fa-telegram text-sm"></i> Telegram শেয়ার
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/?ref=${userCode}`;
                navigator.clipboard.writeText(link);
                if (showToast) showToast('📋 রেফার লিংক কপি হয়েছে!');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto"
            >
              <i className="fa-solid fa-copy"></i> লিংক কপি
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
