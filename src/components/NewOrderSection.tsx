import React from 'react';
import { ServiceItem } from '../types';

interface NewOrderSectionProps {
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
}

export const NewOrderSection: React.FC<NewOrderSectionProps> = ({
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
  handlePlaceOrder
}) => {
  const categories = Array.from(new Set(services.map(s => s.category)));
  const filteredServices = selectedCategory ? services.filter(s => s.category === selectedCategory) : [];
  const currentService = services.find(s => s.id.toString() === selectedServiceId || s.service?.toString() === selectedServiceId);
  const qtyNum = parseFloat(orderQuantity) || 0;
  const totalPriceBdt = currentService ? (qtyNum / 1000) * currentService.rateBdt : 0;

  return (
    <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md p-6 space-y-4 animate-fade-in">
      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
        <i className="fa-solid fa-cart-plus text-emerald-400"></i> নতুন অর্ডার প্লেস করুন
      </h3>

      {/* Category Board - Grid Layout */}
      <div className="grid grid-cols-4 gap-2">
        {categories.map(c => {
          const getIconForCategory = (cat: string) => {
            if (cat.includes('Facebook')) return 'fa-brands fa-facebook text-blue-500';
            if (cat.includes('TikTok')) return 'fa-brands fa-tiktok text-slate-100';
            if (cat.includes('YouTube')) return 'fa-brands fa-youtube text-red-500';
            if (cat.includes('Telegram')) return 'fa-brands fa-telegram text-sky-400';
            if (cat.includes('Instagram')) return 'fa-brands fa-instagram text-pink-500';
            return 'fa-solid fa-folder text-slate-400';
          };
          const iconClass = getIconForCategory(c);

          return (
            <button
              key={c}
              onClick={() => {
                setSelectedCategory(c);
                setSelectedServiceId('');
              }}
              className={`p-4 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                selectedCategory === c
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={c}
            >
              <i className={`${iconClass} text-xl`}></i>
            </button>
          );
        })}
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-4">
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

        {currentService && (
          <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-[11px] text-emerald-200 flex justify-between items-center">
            <span>মিনিমাম: {currentService.min} | সর্বোচ্চ: {(currentService.max || 100000).toLocaleString()}</span>
            <span className="font-bold text-yellow-400">রেট: ৳ {(Number(currentService.rateBdt) || 0).toFixed(2)} / ১,০০০</span>
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
            <span className="text-slate-400">মোট খরচ:</span>
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
  );
};
