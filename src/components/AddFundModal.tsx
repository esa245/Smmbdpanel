import React from 'react';
import { PaymentNumbers } from '../types';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositMethod: string;
  setDepositMethod: (m: string) => void;
  depositAmount: string;
  setDepositAmount: (amt: string) => void;
  depositTrx: string;
  setDepositTrx: (trx: string) => void;
  paymentNumbers: PaymentNumbers;
  handleDepositSubmit: (e: React.FormEvent) => void;
}

export const AddFundModal: React.FC<AddFundModalProps> = ({
  isOpen,
  onClose,
  depositMethod,
  setDepositMethod,
  depositAmount,
  setDepositAmount,
  depositTrx,
  setDepositTrx,
  paymentNumbers,
  handleDepositSubmit
}) => {
  if (!isOpen) return null;

  const getActivePaymentNumber = () => {
    if (depositMethod.includes('bKash')) return paymentNumbers.bkash;
    if (depositMethod.includes('Nagad')) return paymentNumbers.nagad;
    if (depositMethod.includes('Binance')) return paymentNumbers.binance;
    if (depositMethod.includes('ByBit')) return paymentNumbers.bybit;
    return paymentNumbers.bkash;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <i className="fa-solid fa-wallet text-emerald-400"></i> টাকা অ্যাড করুন (Add Fund)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {['বিকাশ (bKash)', 'নগদ (Nagad)', 'বাইনেন্স (Binance)', 'বাইবিট (ByBit)'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setDepositMethod(m)}
              className={`p-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                depositMethod === m ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl text-[11px] text-slate-300 space-y-1">
          <p className="font-bold text-emerald-400">{depositMethod} নাম্বার / একাউন্ট:</p>
          <p className="font-mono text-emerald-400 font-bold text-sm select-all">{getActivePaymentNumber()}</p>
        </div>

        <form onSubmit={handleDepositSubmit} className="space-y-3">
          <input
            type="number"
            required
            placeholder="টাকার পরিমাণ (যেমন: 500)"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <input
            type="text"
            required
            placeholder="Transaction ID / TrxID"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-200"
            value={depositTrx}
            onChange={(e) => setDepositTrx(e.target.value)}
          />
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-md cursor-pointer">
            ডিপোজিট রিকোয়েস্ট পাঠান
          </button>
        </form>
      </div>
    </div>
  );
};
