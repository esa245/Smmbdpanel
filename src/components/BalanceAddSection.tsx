import React from 'react';
import { FundRequest, PaymentNumbers } from '../types';

interface BalanceAddSectionProps {
  depositMethod: string;
  setDepositMethod: (m: string) => void;
  depositAmount: string;
  setDepositAmount: (amt: string) => void;
  depositTrx: string;
  setDepositTrx: (trx: string) => void;
  paymentNumbers: PaymentNumbers;
  myFundRequests: FundRequest[];
  handleDepositSubmit: (e: React.FormEvent) => void;
}

export const BalanceAddSection: React.FC<BalanceAddSectionProps> = ({
  depositMethod,
  setDepositMethod,
  depositAmount,
  setDepositAmount,
  depositTrx,
  setDepositTrx,
  paymentNumbers,
  myFundRequests,
  handleDepositSubmit
}) => {
  const getActivePaymentNumber = () => {
    if (depositMethod.includes('bKash')) return paymentNumbers.bkash;
    if (depositMethod.includes('Nagad')) return paymentNumbers.nagad;
    if (depositMethod.includes('Binance')) return paymentNumbers.binance;
    if (depositMethod.includes('ByBit')) return paymentNumbers.bybit;
    return paymentNumbers.bkash;
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <i className="fa-solid fa-wallet text-emerald-400"></i> ব্যালেন্স অ্যাড (ডিপোজিট)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {['বিকাশ (bKash)', 'নগদ (Nagad)', 'বাইনেন্স (Binance)', 'বাইবিট (ByBit)'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setDepositMethod(m)}
              className={`p-3 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
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
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-xs cursor-pointer shadow-md">
            ডিপোজিট রিকোয়েস্ট পাঠান
          </button>
        </form>
      </div>

      {/* My Deposit Requests Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-200">আমার ডিপোজিট রিকোয়েস্ট স্ট্যাটাস</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2">তারিখ</th>
                <th className="p-2">মেথড</th>
                <th className="p-2">পরিমাণ</th>
                <th className="p-2">TrxID</th>
                <th className="p-2">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {myFundRequests.map(r => (
                <tr key={r.id}>
                  <td className="p-2 text-[10px] text-slate-500">{r.date}</td>
                  <td className="p-2">{r.method}</td>
                  <td className="p-2 font-bold text-emerald-400">৳ {r.amount}</td>
                  <td className="p-2 font-mono text-[10px]">{r.trxId}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      r.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {myFundRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-500">কোনো ডিপোজিট রিকোয়েস্ট নেই।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
