import React, { useState } from 'react';
import { SITE_CONFIG } from '../config';

interface ReferralSectionProps {
  userCode: string;
  refText: string;
  refBonusUser: number;
  refBonusNew: number;
  copyRefLink: () => void;
  showToast?: (msg: string) => void;
  referredCount?: number;
  refEarnings?: number;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  userCode,
  refText,
  refBonusUser,
  refBonusNew,
  copyRefLink,
  showToast,
  referredCount = 0,
  refEarnings = 0
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedMsg, setCopiedMsg] = useState<boolean>(false);

  const refLink = `${SITE_CONFIG.domain || window.location.origin}/?ref=${userCode}`;
  const shareMessage = `🔥 SMM BD Pro - বাংলাদেশের ১ নম্বর বিশ্বস্ত সোশ্যাল মিডিয়া সার্ভিস প্যানেল!

এখানে ফেসবুক, টিকটক, ইউটিউব, ইনস্টাগ্রামের ফলোয়ার, ভিউ ও লাইক পাওয়া যায় সবচেয়ে দ্রুত ও কম খরচে।

🎁 আমার এই রেফারেল লিংকে জয়েন করলেই আপনি পাবেন ইনস্ট্যান্ট ৳${refBonusNew} ফ্রি ওয়েলকাম বোনাস!
👉 জয়েন লিংক: ${refLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (showToast) {
      showToast(`📋 রেফারেল লিংক কপি হয়েছে! (রেফারকারী পাবেন ৳${refBonusUser}, নতুন ইউজার ৳${refBonusNew})`);
    } else {
      copyRefLink();
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
    if (showToast) {
      showToast('📋 রেডিমেড শেয়ার মেসেজ কপি হয়েছে! যেকোনো সোশ্যাল মিডিয়ায় পেস্ট করুন।');
    }
  };

  // Direct Share Handlers
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SMM BD Pro Referral',
          text: `🎁 আমার রেফারে জয়েন করে ৳${refBonusNew} বোনাস নিন! SMM BD Pro - বাংলাদেশের ১ নম্বর SMM প্যানেল`,
          url: refLink,
        });
        if (showToast) showToast('✅ সফলভাবে শেয়ার করা হয়েছে!');
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) showToast('🚀 হোয়াটসঅ্যাপে শেয়ার ওপেন হচ্ছে...');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}&quote=${encodeURIComponent(`🎁 SMM BD Pro তে জয়েন করলেই ফ্রি ৳${refBonusNew} বোনাস!`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) showToast('🚀 ফেসবুকে শেয়ার ওপেন হচ্ছে...');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) showToast('🚀 টেলিগ্রামে শেয়ার ওপেন হচ্ছে...');
  };

  const shareToMessenger = () => {
    // Attempt messenger dialog or fallback to web
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(refLink)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(refLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (showToast) showToast('🚀 মেসেঞ্জারে শেয়ার ওপেন হচ্ছে...');
  };

  const shareToSms = () => {
    const url = `sms:?body=${encodeURIComponent(`🎁 SMM BD Pro তে জয়েন করে ৳${refBonusNew} বোনাস নিন: ${refLink}`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      
      {/* 🌟 Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20">
            <i className="fa-solid fa-share-nodes"></i>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-100 flex items-center gap-2">
              রেফার ও আনলিমিটেড ইনকাম
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ইনস্ট্যান্ট কমিশন
              </span>
            </h3>
            <p className="text-xs text-slate-400">{refText || 'বন্ধুদের ইনভাইট করে জিতে নিন আকর্ষণীয় বোনাস!'}</p>
          </div>
        </div>

        {/* Bonus Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-950/70 border border-emerald-500/30 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">আপনার লাভ (রেফারার)</span>
            <span className="text-xl font-black text-emerald-400">৳ {refBonusUser}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">প্রতি সফল রেফারে</span>
          </div>
          <div className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-semibold">নতুন ফ্রেন্ডের বোনাস</span>
            <span className="text-xl font-black text-amber-400">৳ {refBonusNew}</span>
            <span className="text-[10px] text-amber-500/80 block mt-0.5">অ্যাকাউন্ট খুললেই ফ্রি</span>
          </div>
        </div>
      </div>

      {/* 🚀 DIRECT SHARE BUTTONS (ডাইরেক্ট শিয়ার বাটনসমূহ) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-paper-plane text-emerald-400"></i> ১-ক্লিকে ডাইরেক্ট শেয়ার করুন
          </h4>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            সরাসরি বন্ধুদের পাঠান
          </span>
        </div>

        {/* Big Native Share Button (Mobile & Desktop) */}
        <button
          onClick={handleNativeShare}
          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black p-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition transform active:scale-98"
        >
          <i className="fa-solid fa-share-nodes text-base"></i>
          <span>ফোনের অ্যাপে ডাইরেক্ট শেয়ার করুন (All Apps)</span>
        </button>

        {/* Social Direct Share Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* WhatsApp Direct */}
          <button
            onClick={shareToWhatsApp}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-slate-100 transition cursor-pointer group hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center text-lg font-bold shadow-md shadow-[#25D366]/30 group-hover:scale-110 transition">
              <i className="fa-brands fa-whatsapp text-white"></i>
            </div>
            <span className="text-xs font-black text-[#25D366] mt-2">WhatsApp</span>
            <span className="text-[10px] text-slate-400">ডাইরেক্ট মেসেজ</span>
          </button>

          {/* Facebook Direct */}
          <button
            onClick={shareToFacebook}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-slate-100 transition cursor-pointer group hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-[#1877F2]/30 group-hover:scale-110 transition">
              <i className="fa-brands fa-facebook-f"></i>
            </div>
            <span className="text-xs font-black text-[#1877F2] mt-2">Facebook</span>
            <span className="text-[10px] text-slate-400">টাইমলাইনে শেয়ার</span>
          </button>

          {/* Telegram Direct */}
          <button
            onClick={shareToTelegram}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-slate-100 transition cursor-pointer group hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-[#229ED9]/30 group-hover:scale-110 transition">
              <i className="fa-brands fa-telegram"></i>
            </div>
            <span className="text-xs font-black text-[#229ED9] mt-2">Telegram</span>
            <span className="text-[10px] text-slate-400">গ্রুপ ও চ্যাটে</span>
          </button>

          {/* Messenger / SMS */}
          <button
            onClick={shareToMessenger}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#00B2FF]/15 hover:bg-[#00B2FF]/25 border border-[#00B2FF]/30 text-slate-100 transition cursor-pointer group hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-full bg-[#00B2FF] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-[#00B2FF]/30 group-hover:scale-110 transition">
              <i className="fa-brands fa-facebook-messenger"></i>
            </div>
            <span className="text-xs font-black text-[#00B2FF] mt-2">Messenger</span>
            <span className="text-[10px] text-slate-400">ইনবক্সে পাঠান</span>
          </button>
        </div>

        {/* SMS / Messaging Quick Action */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={shareToSms}
            className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 flex items-center gap-1.5 transition cursor-pointer"
          >
            <i className="fa-solid fa-comment-sms text-emerald-400"></i> সাধারণ SMS দিয়ে পাঠান
          </button>
          <span className="text-[11px] text-slate-500">
            রেফার কোড: <strong className="text-emerald-400 font-mono">{userCode}</strong>
          </span>
        </div>
      </div>

      {/* 🔗 Referral Link & Copy Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <span className="text-xs font-bold text-slate-300 block flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-link text-emerald-400"></i> আপনার পারসোনাল রেফারেল লিংক:
          </span>
          <span className="text-[10px] font-mono text-slate-500">ID: {userCode}</span>
        </span>
        
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={refLink}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-emerald-400 select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 cursor-pointer transition flex items-center gap-1.5 ${
              copied
                ? 'bg-teal-500 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            {copied ? 'কপি হয়েছে!' : 'কপি লিংক'}
          </button>
        </div>

        {/* Ready-made promo message box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-bullhorn text-amber-400"></i> রেডিমেড প্রমো মেসেজ (ফেসবুক/গ্রুপে পোস্টের জন্য):
            </span>
            <button
              onClick={handleCopyMessage}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 cursor-pointer transition flex items-center gap-1"
            >
              <i className={`fa-solid ${copiedMsg ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
              {copiedMsg ? 'মেসেজ কপি হয়েছে!' : 'মেসেজ কপি করুন'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 font-mono">
            {shareMessage}
          </p>
        </div>
      </div>

      {/* 📊 Referral Stats */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1 text-sm">
            <i className="fa-solid fa-users"></i>
          </div>
          <span className="text-[11px] text-slate-400 block font-semibold">মোট সফল রেফার</span>
          <span className="text-xl font-black text-emerald-400 mt-0.5 block">{referredCount} জন</span>
        </div>
        
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-1 text-sm">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <span className="text-[11px] text-slate-400 block font-semibold">রেফার থেকে মোট আয়</span>
          <span className="text-xl font-black text-yellow-400 mt-0.5 block">৳ {(Number(refEarnings) || 0).toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
};

