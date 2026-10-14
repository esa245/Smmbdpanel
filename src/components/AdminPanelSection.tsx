import React, { useState } from 'react';
import { AdminUserItem, FundRequest, PaymentNumbers, Order, ServiceItem, SupportMessage } from '../types';

interface AdminPanelSectionProps {
  apiKey: string;
  setApiKey?: (key: string) => void;
  adminTab: 'users' | 'deposits' | 'api' | 'pricing' | 'orders' | 'payment' | 'referral' | 'support';
  setAdminTab: (tab: 'users' | 'deposits' | 'api' | 'pricing' | 'orders' | 'payment' | 'referral' | 'support') => void;
  adminUsersList: AdminUserItem[];
  setAdminUsersList?: React.Dispatch<React.SetStateAction<AdminUserItem[]>>;
  handleAdjustUserBalance: (code: string, delta: number) => void;
  apiStatusResult: { checked: boolean; success: boolean; data?: any; error?: string };
  checkApiStatus: () => void;
  isLoading: boolean;
  fundRequests: FundRequest[];
  acceptDeposit: (id: string) => void;
  rejectDeposit: (id: string) => void;
  paymentNumbers: PaymentNumbers;
  setPaymentNumbers: React.Dispatch<React.SetStateAction<PaymentNumbers>>;
  refBonusUser: number;
  setRefBonusUser: (val: number) => void;
  refBonusNew: number;
  setRefBonusNew: (val: number) => void;
  refText: string;
  setRefText: (val: string) => void;
  setActiveSection: (sec: string) => void;
  setIsAdminLoggedIn: (logged: boolean) => void;
  showToast: (msg: string) => void;
  orders?: Order[];
  supportMessages?: SupportMessage[];
  profitMarginPer1k: number;
  setProfitMarginPer1k: (val: number) => void;
  services?: ServiceItem[];
  onUpdateOrderStatus?: (orderId: string, newStatus: string) => void;
  checkStatus?: (order: Order) => void;
  refreshAllStatuses?: () => void;
  onDeleteUser?: (code: string) => void;
  onAddUser?: (name: string, initialBalance: number) => void;
  onClearDemoData?: () => void;
}

export const AdminPanelSection: React.FC<AdminPanelSectionProps> = ({
  apiKey,
  setApiKey,
  adminTab,
  setAdminTab,
  adminUsersList,
  handleAdjustUserBalance,
  apiStatusResult,
  checkApiStatus,
  isLoading,
  fundRequests,
  acceptDeposit,
  rejectDeposit,
  paymentNumbers,
  setPaymentNumbers,
  refBonusUser,
  setRefBonusUser,
  refBonusNew,
  setRefBonusNew,
  refText,
  setRefText,
  setActiveSection,
  setIsAdminLoggedIn,
  showToast,
  orders = [],
  supportMessages = [],
  profitMarginPer1k,
  setProfitMarginPer1k,
  services = [],
  onUpdateOrderStatus,
  checkStatus,
  refreshAllStatuses,
  onDeleteUser,
  onAddUser,
  onClearDemoData
}) => {
  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'Online' | 'Active'>('all');

  // Add User Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserNameInput, setNewUserNameInput] = useState('');
  const [newUserBalanceInput, setNewUserBalanceInput] = useState('0');

  // Custom Balance Modal state (avoids window.prompt)
  const [balanceModalUser, setBalanceModalUser] = useState<AdminUserItem | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  // Editable API Key local state
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  // Profit Margin local state & simulator state
  const [tempProfitMargin, setTempProfitMargin] = useState<number>(profitMarginPer1k);
  const [simulatorQty, setSimulatorQty] = useState<number>(1000);

  // Deposit filter state
  const [depositFilter, setDepositFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  // 3-Part Order Filter & Tracking (ইউজার যে ওডার করলো সেটা এডমিনে ৩ ভাগে দেখা ও ট্র্যাক করা)
  const [orderSubTab, setOrderSubTab] = useState<'all' | 'processing' | 'completed' | 'canceled'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  // Calculations
  const pendingRequests = (fundRequests || []).filter(r => r.status === 'Pending');
  const totalUserBalance = (adminUsersList || []).reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
  const totalApprovedDeposits = (fundRequests || [])
    .filter(r => r.status === 'Approved')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  // Total Net Profit calculation from orders
  const effectiveMargin = Number(profitMarginPer1k) || 10;
  const totalNetProfit = (orders || []).reduce((acc, o) => {
    if (o.profit !== undefined && o.profit !== null) return acc + (Number(o.profit) || 0);
    const q = Number(o.quantity) || 1000;
    return acc + (q / 1000) * effectiveMargin;
  }, 0);

  const totalUserOrdersCharged = (orders || []).reduce((acc, o) => acc + (Number(o.charge) || 0), 0);
  const totalProviderCost = (orders || []).reduce((acc, o) => {
    if (o.providerCost !== undefined && o.providerCost !== null) return acc + (Number(o.providerCost) || 0);
    const chargeVal = Number(o.charge) || 0;
    const q = Number(o.quantity) || 1000;
    return acc + Math.max(0, chargeVal - ((q / 1000) * effectiveMargin));
  }, 0);

  // 🏷️ ৩ ভাগে ভাগ করা অর্ডার ক্যাটাগরি ও হিসাব:
  // ভাগ ১: চলমান / প্রক্রিয়াধীন (Processing, In progress, Pending)
  const processingOrdersList = (orders || []).filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'processing' || s === 'in progress' || s === 'pending';
  });

  // ভাগ ২: সফল ও সম্পূর্ণ (Completed)
  const completedOrdersList = (orders || []).filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'completed';
  });

  // ভাগ ৩: বাতিল ও আংশিক রিফান্ড (Canceled, Partial, Refunded)
  const canceledOrdersList = (orders || []).filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'canceled' || s === 'partial' || s === 'refunded';
  });

  // ৩ ভাগের আর্থিক মেট্রিক্স
  const processingTotalCharge = processingOrdersList.reduce((acc, o) => acc + (Number(o.charge) || 0), 0);
  const processingTotalProfit = processingOrdersList.reduce((acc, o) => {
    if (o.profit !== undefined && o.profit !== null) return acc + (Number(o.profit) || 0);
    const q = Number(o.quantity) || 1000;
    return acc + (q / 1000) * effectiveMargin;
  }, 0);

  const completedTotalCharge = completedOrdersList.reduce((acc, o) => acc + (Number(o.charge) || 0), 0);
  const completedTotalProfit = completedOrdersList.reduce((acc, o) => {
    if (o.profit !== undefined && o.profit !== null) return acc + (Number(o.profit) || 0);
    const q = Number(o.quantity) || 1000;
    return acc + (q / 1000) * effectiveMargin;
  }, 0);

  const canceledTotalCharge = canceledOrdersList.reduce((acc, o) => acc + (Number(o.charge) || 0), 0);

  // ৩ ভাগ ও সার্চ অনুযায়ী ফিল্টার করা অর্ডার লিস্ট
  const filteredOrders = (orders || []).filter(o => {
    const s = (o.status || '').toLowerCase();
    const matchesTab =
      orderSubTab === 'all' ? true :
      orderSubTab === 'processing' ? (s === 'processing' || s === 'in progress' || s === 'pending') :
      orderSubTab === 'completed' ? (s === 'completed') :
      (s === 'canceled' || s === 'partial' || s === 'refunded');

    const searchLower = orderSearch.toLowerCase();
    const matchesSearch =
      !orderSearch ||
      (o.id || '').toLowerCase().includes(searchLower) ||
      (o.upstreamId || '').toLowerCase().includes(searchLower) ||
      (o.serviceName || '').toLowerCase().includes(searchLower) ||
      (o.link || '').toLowerCase().includes(searchLower) ||
      (o.category || '').toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    } else {
      showToast(`✅ অর্ডার #${orderId} এর স্ট্যাটাস '${newStatus}' আপডেট হয়েছে`);
    }
  };

  const handleCheckOrderLive = (order: Order) => {
    if (checkStatus) {
      checkStatus(order);
    } else {
      showToast(`🔄 অর্ডার #${order.id} স্ট্যাটাস চেক করা হচ্ছে...`);
    }
  };

  const filteredUsers = adminUsersList.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.code.includes(userSearch);
    const matchesFilter = userFilter === 'all' || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredDeposits = fundRequests.filter(r => {
    if (depositFilter === 'all') return true;
    return r.status === depositFilter;
  });

  const handleOpenBalanceModal = (user: AdminUserItem) => {
    setBalanceModalUser(user);
    setCustomAmountInput('100');
    setAdjustType('add');
  };

  const handleApplyCustomBalance = () => {
    if (!balanceModalUser) return;
    const amount = parseFloat(customAmountInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('⚠️ সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }
    const delta = adjustType === 'add' ? amount : -amount;
    handleAdjustUserBalance(balanceModalUser.code, delta);
    setBalanceModalUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      
      {/* 👑 1. TOP DEDICATED ADMIN NAVBAR (100% SEPARATE FROM USER PANEL) */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3.5 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Branding & Super Admin Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 text-lg font-black">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
                  SMM BD PRO • SUPER ADMIN
                </span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                  LIVE PANEL
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <i className="fa-solid fa-circle-check text-[10px]"></i> Romjan (মাস্টার এক্সেস)
                </span>
                <span>•</span>
                <span className="text-slate-400">সম্পূর্ণ আলাদা কন্ট্রোল পেজ</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons (Back to User Panel & Logout) */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => setActiveSection('dashboard')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>ইউজার প্যানেলে ফিরে যান</span>
            </button>
            <button
              onClick={() => {
                setIsAdminLoggedIn(false);
                setActiveSection('dashboard');
                showToast('🔒 এডমিন থেকে সফলভাবে লগআউট করা হয়েছে');
              }}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 hover:border-red-500/50 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="এডমিন লগআউট"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>

        </div>
      </header>

      {/* 📊 2. MAIN ADMIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* 🌟 3. TOP EXECUTIVE STATS CARDS (খোপ খোপ আকারে সাজানো) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Users */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 p-4 rounded-2xl shadow-xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold">মোট ইউজার</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-100">
              {adminUsersList.length} <span className="text-xs text-slate-400 font-normal">জন</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {adminUsersList.filter(u => u.status === 'Online').length} জন অনলাইন
            </div>
          </div>

          {/* Card 2: Total User Balance */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl shadow-xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold">ইউজার মোট ব্যালেন্স</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <i className="fa-solid fa-wallet"></i>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ৳ {(totalUserBalance || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ওয়ালেটে জমা
            </div>
          </div>

          {/* Card 3: Total Approved Deposits */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-2xl shadow-xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold">অনুমোদিত ডিপোজিট</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400">
              ৳ {(totalApprovedDeposits || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              সফল ট্রানজেকশন
            </div>
          </div>

          {/* Card 4: Pending Deposits */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-4 rounded-2xl shadow-xl transition relative overflow-hidden">
            {pendingRequests.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            )}
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold">পেন্ডিং ডিপোজিট</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <i className="fa-solid fa-hourglass-half"></i>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {pendingRequests.length} <span className="text-xs text-slate-400 font-normal">টি</span>
            </div>
            <div className="text-[11px] text-amber-300 font-bold mt-1">
              {pendingRequests.length > 0 ? 'অনুমোদনের অপেক্ষায়' : 'কোনো পেন্ডিং নেই'}
            </div>
          </div>

          {/* Card 5: API Motherpanel Status */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 p-4 rounded-2xl shadow-xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold">API স্ট্যাটাস</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <i className="fa-solid fa-server"></i>
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              একসেপ্টেড
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {apiStatusResult?.data?.balance ? `$${apiStatusResult.data.balance} USD` : 'সরাসরি অর্ডার পাঠানো'}
            </div>
          </div>

          {/* Card 6: Total Net Profit (আমাদের মোট লাভ) */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 border border-amber-500/30 hover:border-amber-400 p-4 rounded-2xl shadow-xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-bold text-amber-300">আমাদের মোট লাভ</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <i className="fa-solid fa-coins"></i>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              ৳ {(totalNetProfit || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <i className="fa-solid fa-arrow-trend-up text-[10px]"></i>
              মার্জিন: +৳{(effectiveMargin).toFixed(0)}/১,০০০
            </div>
          </div>
        </div>

        {/* 📑 4. ADMIN LAYER TABS NAVIGATION (লেয়ার সিস্টেম) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {[
            { id: 'users', label: 'ইউজার তালিকা ও ব্যালেন্স', icon: 'fa-users', badge: adminUsersList.length },
            { id: 'deposits', label: 'ডিপোজিট অনুমোদন', icon: 'fa-money-bill-transfer', badge: pendingRequests.length, alert: pendingRequests.length > 0 },
            { id: 'api', label: 'মাদারপ্যানেল API ও স্ট্যাটাস', icon: 'fa-network-wired' },
            { id: 'pricing', label: 'প্রাইসিং ও লাভ (১০৳/১K মার্জিন)', icon: 'fa-hand-holding-dollar', badge: `+৳${profitMarginPer1k}` },
            { id: 'orders', label: 'ইউজার অর্ডার মনিটরিং (৩ ভাগ)', icon: 'fa-boxes-stacked', badge: `${orders.length} টি`, alert: processingOrdersList.length > 0 },
            { id: 'payment', label: 'পেমেন্ট নাম্বার সেটআপ', icon: 'fa-mobile-screen-button' },
            { id: 'referral', label: 'রেফারেল অফার ও ব্যানার', icon: 'fa-gift' },
            { id: 'support', label: 'সাপোর্ট মেসেজ', icon: 'fa-headset' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminTab === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800/80'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  tab.alert 
                    ? 'bg-amber-400 text-slate-950 animate-bounce' 
                    : adminTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 👥 LAYER 1: USERS DETAILS BOARD (ওপর দিয়ে সারি সারি ও খোপ আকারে সাজানো) */}
        {adminTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            {/* Header & Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-users-gear text-blue-400"></i> ইউজারদের সম্পূর্ণ ডিটেইলস ও ব্যালেন্স বোর্ড
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  প্রতিটি ইউজারের ব্যালেন্স, ডিপোজিট হিস্টোরি, অর্ডার এবং রেফারেল দেখতে ও সরাসরি ব্যালেন্স পরিবর্তন করতে পারবেন
                </p>
              </div>

              {/* Search & Filter pills & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="নাম বা কোড (#ID) খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white text-xs">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${userFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    সব ({adminUsersList.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('Online')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${userFilter === 'Online' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    অনলাইন
                  </button>
                </div>

                {onAddUser && (
                  <button
                    onClick={() => {
                      setNewUserNameInput('');
                      setNewUserBalanceInput('0');
                      setIsAddUserModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <i className="fa-solid fa-user-plus text-[11px]"></i> নতুন ইউজার
                  </button>
                )}

                {onClearDemoData && (
                  <button
                    onClick={() => onClearDemoData()}
                    title="সকল ডেমো ডেটা মুছে ফ্রেশ ও সম্পূর্ণ নতুন স্টেট তৈরি করুন"
                    className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-broom text-[11px]"></i> ডেমো মুছুন
                  </button>
                )}
              </div>
            </div>

            {/* User Row Cards (খোপ খোপ ও সারি সারি স্টাইল) */}
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                >
                  {/* Left Column: Avatar & Basic Information */}
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 text-xl font-black shrink-0 shadow-inner">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-100">{user.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          user.status === 'Online'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                          {user.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          ID: #{user.code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          জয়েন: {user.joinedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Stats Grid (ব্যালেন্স, ডিপোজিট, অর্ডার, রেফার) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs flex-1">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">বর্তমান ব্যালেন্স</span>
                      <span className="text-base font-black text-emerald-400">৳ {(Number(user.balance) || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">মোট ডিপোজিট</span>
                      <span className="text-base font-black text-cyan-400">৳ {(Number(user.totalDeposit) || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">অর্ডার সংখ্যা</span>
                      <span className="text-base font-black text-slate-200">{user.ordersCount || 0} টি</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">রেফার / আয়</span>
                      <div className="text-xs text-slate-300 font-bold mt-0.5">
                        <span className="text-amber-400">{user.referredCount || 0} জন</span> • 
                        <span className="text-emerald-400 ml-1">৳{user.refEarnings || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick Balance Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end xl:self-center">
                    <button
                      onClick={() => handleAdjustUserBalance(user.code, 50)}
                      title="৳ ৫০ যোগ করুন"
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i> ৫০
                    </button>
                    <button
                      onClick={() => handleAdjustUserBalance(user.code, 100)}
                      title="৳ ১০০ যোগ করুন"
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i> ১০০
                    </button>
                    <button
                      onClick={() => handleAdjustUserBalance(user.code, -50)}
                      title="৳ ৫০ কর্তন করুন"
                      className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-minus text-[10px]"></i> ৫০
                    </button>
                    <button
                      onClick={() => handleOpenBalanceModal(user)}
                      title="কাস্টম ব্যালেন্স পরিবর্তন"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-pen-to-square text-blue-400"></i> কাস্টম
                    </button>
                    {onDeleteUser && (
                      <button
                        onClick={() => onDeleteUser(user.code)}
                        title="ইউজার অ্যাকাউন্ট মুছে ফেলুন"
                        className="bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 p-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  <i className="fa-solid fa-user-slash text-3xl mb-2 text-slate-600 block"></i>
                  কোনো ডেমো ইউজার নেই। নতুন কোনো ভিজিটর বা ইউজার সাইটে আসলে এখানে স্বয়ংক্রিয়ভাবে রিয়েল ইউজার যুক্ত হবে।
                </div>
              )}
            </div>
          </div>
        )}

        {/* 💳 LAYER 2: DEPOSIT REQUESTS MANAGEMENT */}
        {adminTab === 'deposits' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-wallet text-emerald-400"></i> ডিপোজিট রিকোয়েস্ট অনুমোদন তালিকা
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ইউজারদের পাঠানো বিকাশ, নগদ, বাইনেন্স ইত্যাদির ট্রানজেকশন আইডি (TrxID) মিলিয়ে এক ক্লিকে অনুমোদন বা বাতিল করুন
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                {(['all', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDepositFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      depositFilter === tab ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    {tab === 'all' ? `সব (${fundRequests.length})` : 
                     tab === 'Pending' ? `পেন্ডিং (${pendingRequests.length})` : 
                     tab === 'Approved' ? 'অনুমোদিত' : 'বাতিল'}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposits Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">ইউজার কোড</th>
                      <th className="p-3.5">তারিখ ও সময়</th>
                      <th className="p-3.5">পেমেন্ট মেথড</th>
                      <th className="p-3.5">টাকার পরিমাণ</th>
                      <th className="p-3.5">TrxID / ট্রানজেকশন</th>
                      <th className="p-3.5">বর্তমান স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">একশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredDeposits.map(req => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          #{req.userCode}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {req.date}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 ${
                            req.method.toLowerCase().includes('bkash') 
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                            req.method.toLowerCase().includes('nagad')
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            req.method.toLowerCase().includes('binance')
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            <i className="fa-solid fa-circle text-[6px]"></i>
                            {req.method}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-sm text-emerald-400 whitespace-nowrap">
                          ৳ {(Number(req.amount) || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono uppercase text-xs text-slate-200">
                          <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800 select-all font-bold">
                            {req.trxId}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            req.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'Approved' ? 'bg-emerald-400' :
                              req.status === 'Rejected' ? 'bg-rose-400' : 'bg-amber-400'
                            }`}></span>
                            {req.status === 'Approved' ? 'অনুমোদিত' : req.status === 'Rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => acceptDeposit(req.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-md cursor-pointer"
                              >
                                <i className="fa-solid fa-check"></i> অ্যাপ্রুভ
                              </button>
                              <button
                                onClick={() => rejectDeposit(req.id)}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-md cursor-pointer"
                              >
                                <i className="fa-solid fa-xmark"></i> রিজেক্ট
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">কার্যসম্পন্ন</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredDeposits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500">
                          <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-700 block"></i>
                          কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ⚡ LAYER 3: MOTHERPANEL API INTEGRATION & STATUS */}
        {adminTab === 'api' && (
          <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-network-wired text-red-400"></i> মাদারপ্যানেল API কানেকশন ও লাইভ স্ট্যাটাস চেকার
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    মাদারপ্যানেল API শুধুমাত্র সার্ভিসের তালিকা ফেচ এবং অর্ডার পাঠানোর জন্য কার্যকর থাকে
                  </p>
                </div>
                <button
                  onClick={checkApiStatus}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/25 disabled:opacity-50"
                >
                  <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'animate-spin' : ''}`}></i>
                  <span>API স্ট্যাটাস টেস্ট করুন</span>
                </button>
              </div>

              {/* API Key Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  বর্তমান ব্যবহৃত মাদারপ্যানেল API KEY:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-emerald-400 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  {setApiKey && (
                    <button
                      onClick={() => {
                        setApiKey(tempApiKey);
                        showToast('✅ API Key সফলভাবে আপডেট করা হয়েছে!');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      সেভ
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  🔒 নির্দেশনা অনুযায়ী এই API Key দিয়েই সকল অর্ডার মাদারপ্যানেলে রাউট করা হবে। ইউজার ব্যালেন্স ও ডিপোজিট এডমিন প্যানেলেই নিয়ন্ত্রিত থাকবে।
                </p>
              </div>

              {/* Status Verification Card */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                  লাইভ সার্ভার রেসপন্স স্ট্যাটাস:
                </span>

                {apiStatusResult.checked ? (
                  <div className={`p-4 rounded-xl border text-xs ${
                    apiStatusResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 text-sm font-black mb-1.5">
                      <i className={`fa-solid ${apiStatusResult.success ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-rose-400'}`}></i>
                      <span>{apiStatusResult.success ? 'API KEY গৃহীত ও সক্রিয় (Accepted & Connected)' : 'API KEY সমস্যা (Error / Not Accepted)'}</span>
                    </div>
                    {apiStatusResult.data && (
                      <div className="space-y-1 font-mono text-xs mt-2 text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <div>মাদারপ্যানেল ব্যালেন্স: <strong className="text-emerald-400">${apiStatusResult.data.balance || 'Active'} {apiStatusResult.data.currency || 'USD'}</strong></div>
                        <div className="text-[11px] text-slate-400">সার্ভার স্ট্যাটাস: রেসপন্ডিং ও অর্ডার পাঠানোর জন্য সম্পূর্ণ প্রস্তুত</div>
                      </div>
                    )}
                    {apiStatusResult.error && (
                      <div className="text-xs text-rose-300 mt-2 font-mono">
                        Error: {apiStatusResult.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-circle-info text-blue-400"></i>
                      <span>কানেকশন ভেরিফাই করতে উপরের বাটনটিতে ক্লিক করে টেস্ট করুন।</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      রেডি মোড
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 💰 LAYER: DYNAMIC PRICING & PROFIT MARGIN (১০৳/১০০০ অর্ডার লাভ) */}
        {adminTab === 'pricing' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            
            {/* 1. Header & Policy Rule Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-bolt text-amber-400"></i> ডাইনামিক প্রাইসিং ফর্মুলা
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      ১০০% অটো-সিঙ্কড
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-hand-holding-dollar text-amber-400"></i> প্রতি ১,০০০ অর্ডারে লাভ ও অটোমেটিক রেট কন্ট্রোল
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    "ওদের চাইতে ১০০০ অর্ডার করলে ১০ টাকা করে লাভ থাকবে আমাদের, তারা রেট বাড়ালে আমাদেরও স্বয়ংক্রিয়ভাবে দাম বাড়বে।"
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-amber-500/40 p-4 rounded-xl text-center shadow-lg min-w-[200px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">বর্তমান সক্রিয় মার্জিন</span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">
                    +৳ {(effectiveMargin).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                    প্রতি ১,০০০ কোয়ান্টিটিতে
                  </span>
                </div>
              </div>

              {/* Formula Explanation box */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">১. মাদার প্যানেল রেট (ওদের খরচ):</span>
                  <p className="text-slate-300 font-mono">Provider Rate per 1,000</p>
                  <p className="text-[11px] text-slate-400 mt-1">মাদার API এর লাইভ বেস মূল্য</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/30">
                  <span className="text-amber-400 font-bold block mb-1">২. আমাদের ফিক্সড লাভ মার্জিন:</span>
                  <p className="text-amber-300 font-mono">+৳ {profitMarginPer1k} / 1,000 Order</p>
                  <p className="text-[11px] text-slate-400 mt-1">সব সার্ভিসের ওপর সরাসরি যুক্ত</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block mb-1">৩. ইউজারদের বিক্রয় রেট:</span>
                  <p className="text-emerald-300 font-mono">ওদের রেট + ৳ {profitMarginPer1k}</p>
                  <p className="text-[11px] text-slate-400 mt-1">তারা বাড়ালে আমাদেরও স্বয়ংক্রিয় বৃদ্ধি</p>
                </div>
              </div>
            </div>

            {/* 2. Margin Editor & Quick Preset Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Margin Settings Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="font-black text-sm text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-sliders text-emerald-400"></i> মার্জিন পরিবর্তন ও সেভ করুন
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    প্রতি ১০০০ কোয়ান্টিটিতে আপনার কত টাকা লাভ থাকবে নির্ধারণ করুন
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    প্রতি ১,০০০ অর্ডারে আমাদের লাভ (টাকা):
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">৳</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={tempProfitMargin}
                        onChange={(e) => setTempProfitMargin(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-black text-emerald-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setProfitMarginPer1k(tempProfitMargin);
                        showToast(`✅ লাভ মার্জিন প্রতি ১,০০০ অর্ডারে ৳ ${tempProfitMargin} সফলভাবে সেভ করা হয়েছে!`);
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <i className="fa-solid fa-check"></i> সেভ করুন
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">কুইক প্রিসেট মার্জিন:</span>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20, 25, 30].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          setTempProfitMargin(val);
                          setProfitMarginPer1k(val);
                          showToast(`✅ মার্জিন প্রতি ১,০০০ এ ৳${val} সেট করা হয়েছে!`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          profitMarginPer1k === val
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        +{val} ৳ {val === 10 ? '(ডিফল্ট)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  <i className="fa-solid fa-circle-info text-blue-400 mr-1.5"></i>
                  আপনি মার্জিন পরিবর্তন করলে সাথে সাথে সমস্ত সার্ভিসের বিক্রয় রেট এবং ইউজারদের অর্ডার কস্ট স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।
                </div>
              </div>

              {/* 3. Live Profit Simulator & Calculator */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-sm text-slate-100 flex items-center gap-2">
                      <i className="fa-solid fa-calculator text-amber-400"></i> লাইভ লাভ ক্যালকুলেটর ও সিমুলেটর
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      অর্ডারের পরিমাণের ওপর আপনার ক্যাশ লাভ দেখুন
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    সিমুলেশন পরিমাণ (কোয়ান্টিটি):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {[500, 1000, 2000, 5000].map(q => (
                      <button
                        key={q}
                        onClick={() => setSimulatorQty(q)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          simulatorQty === q
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {q.toLocaleString()} টি
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={simulatorQty}
                    onChange={(e) => setSimulatorQty(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                    placeholder="কাস্টম কোয়ান্টিটি লিখুন"
                  />
                </div>

                {/* Simulator Breakdown */}
                {(() => {
                  const margin = Number(profitMarginPer1k) || 10;
                  const sampleProviderRate = 50; // 50 Tk per 1k demo base
                  const sampleUserRate = sampleProviderRate + margin;
                  const qty = Number(simulatorQty) || 1000;
                  const simCost = (qty / 1000) * sampleProviderRate;
                  const simCharge = (qty / 1000) * sampleUserRate;
                  const simProfit = (qty / 1000) * margin;
                  return (
                    <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>মাদার প্যানেল খরচ (আনুমানিক):</span>
                        <span className="font-mono text-slate-300">৳ {(simCost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>ইউজার ব্যালেন্স থেকে কাটা হবে:</span>
                        <span className="font-mono text-slate-200 font-bold">৳ {(simCharge || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-trophy text-amber-400"></i> আপনার নিশ্চিত নিট লাভ:
                        </span>
                        <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                          +৳ {(simProfit || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

            {/* 4. Full Services Dynamic Rate Breakdown Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h4 className="font-black text-sm text-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-blue-400"></i> সার্ভিসের তালিকা ও ডাইনামিক রেট চার্ট
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    মাদারপ্যানেল রেট পরিবর্তন হলে এখানে ও ইউজার প্যানেলে স্বয়ংক্রিয়ভাবে দাম অ্যাডজাস্ট হয়
                  </p>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl font-bold self-start sm:self-auto">
                  মোট সার্ভিস: {services.length} টি
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">ID</th>
                      <th className="p-3.5">সার্ভিস নাম</th>
                      <th className="p-3.5">ক্যাটাগরি</th>
                      <th className="p-3.5 text-right">মাদার রেট / ১K</th>
                      <th className="p-3.5 text-right">আমাদের লাভ / ১K</th>
                      <th className="p-3.5 text-right">ইউজার বিক্রয় রেট</th>
                      <th className="p-3.5 text-center">ডাইনামিক স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {(services || []).map(s => {
                      const pCost = Number(s.providerRateBdt) || 0;
                      const margin = Number(profitMarginPer1k) || 10;
                      const finalRate = Number(s.rateBdt) || (pCost + margin);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-400">#{s.id}</td>
                          <td className="p-3.5 font-semibold text-slate-100 max-w-xs">{s.name || '-'}</td>
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-[11px]">
                              {s.category || 'General'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                            ৳ {pCost.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                            +৳ {margin.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                            ৳ {finalRate.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              অটো-লিঙ্কড
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 📦 LAYER 4: ORDERS MONITORING & STATUS TRACKER (৩ ভাগে বিভক্ত সেকশন) */}
        {adminTab === 'orders' && (
          <div className="space-y-5 animate-fade-in">
            {/* Top Overview & Action Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                    <i className="fa-solid fa-boxes-stacked"></i>
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-100">
                    ইউজার অর্ডার মনিটরিং ও স্ট্যাটাস ট্র্যাকার (৩ ভাগে বিভক্ত)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ইউজারদের প্লেস করা প্রতিটি অর্ডারের বর্তমান অবস্থা মনিটর করুন, আপস্ট্রিম API থেকে লাইভ স্ট্যাটাস আনুন এবং ৩ ভাগে নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {refreshAllStatuses && (
                  <button
                    onClick={refreshAllStatuses}
                    disabled={isLoading}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'animate-spin' : ''}`}></i>
                    <span>মাদারপ্যানেল লাইভ সিঙ্ক</span>
                  </button>
                )}
                <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-coins text-amber-400"></i>
                  মোট লাভ: ৳ {(totalNetProfit || 0).toFixed(2)}
                </span>
                <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-xl font-bold">
                  মোট অর্ডার: {(orders || []).length} টি
                </span>
              </div>
            </div>

            {/* 🎯 ৩ ভাগে ভাগ করা প্রধান সেকশন কার্ডস (৩টি স্পষ্ট ভাগ) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* ভাগ ১: চলমান ও প্রক্রিয়াধীন অর্ডার */}
              <div 
                onClick={() => setOrderSubTab('processing')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  orderSubTab === 'processing'
                    ? 'bg-blue-950/50 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black">
                      ১
                    </span>
                    <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                      ভাগ ১: চলমান ও প্রক্রিয়াধীন
                    </span>
                  </div>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-2xl font-black text-slate-100">
                    {processingOrdersList.length} <span className="text-xs text-slate-400 font-bold">টি অর্ডার</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/20">
                    চলমান কাজ
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>চলমান ভ্যালু: <strong className="text-slate-200">৳ {processingTotalCharge.toFixed(2)}</strong></span>
                  <span>প্রত্যাশিত লাভ: <strong className="text-amber-400">+৳ {processingTotalProfit.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* ভাগ ২: সফল ও সম্পন্ন ডেলিভারি */}
              <div 
                onClick={() => setOrderSubTab('completed')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  orderSubTab === 'completed'
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                      ২
                    </span>
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      ভাগ ২: সফল ও সম্পন্ন অর্ডার
                    </span>
                  </div>
                  <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-2xl font-black text-slate-100">
                    {completedOrdersList.length} <span className="text-xs text-slate-400 font-bold">টি সম্পন্ন</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    সফল ডেলিভারি
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ডেলিভার্ড ভ্যালু: <strong className="text-slate-200">৳ {completedTotalCharge.toFixed(2)}</strong></span>
                  <span>অর্জিত লাভ: <strong className="text-emerald-400 font-black">+৳ {completedTotalProfit.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* ভাগ ৩: বাতিল ও আংশিক রিফান্ড */}
              <div 
                onClick={() => setOrderSubTab('canceled')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  orderSubTab === 'canceled'
                    ? 'bg-rose-950/50 border-rose-500 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-black">
                      ৩
                    </span>
                    <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
                      ভাগ ৩: বাতিল ও আংশিক রিফান্ড
                    </span>
                  </div>
                  <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-2xl font-black text-slate-100">
                    {canceledOrdersList.length} <span className="text-xs text-slate-400 font-bold">টি অর্ডার</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/20">
                    ব্যর্থ / বাতিল
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>বাতিল/আংশিক মূল্য: <strong className="text-slate-200">৳ {canceledTotalCharge.toFixed(2)}</strong></span>
                  <span className="text-rose-400 font-medium">রিফান্ড/পুনর্বিবেচ্য</span>
                </div>
              </div>

            </div>

            {/* ফিল্টার সুইচ ও সার্চ টুলবার */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              
              {/* ৩ ভাগ সিলেকশন বাটনস */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderSubTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === 'all'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-list-check"></i>
                  <span>সকল অর্ডার</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {(orders || []).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderSubTab('processing')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === 'processing'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-blue-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>ভাগ ১: চলমান/প্রসেসিং</span>
                  <span className="bg-blue-500/30 text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {processingOrdersList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderSubTab('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === 'completed'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 text-emerald-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>ভাগ ২: সফল সম্পন্ন</span>
                  <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {completedOrdersList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderSubTab('canceled')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === 'canceled'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800/80 text-rose-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-ban"></i>
                  <span>ভাগ ৩: বাতিল/আংশিক</span>
                  <span className="bg-rose-500/30 text-rose-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {canceledOrdersList.length}
                  </span>
                </button>
              </div>

              {/* সার্চ ইনপুট */}
              <div className="relative min-w-[260px]">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  placeholder="অর্ডার ID, আপস্ট্রিম ID, সার্ভিস বা লিংক..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

            </div>

            {/* 📋 অর্ডার হিস্টোরি ও স্ট্যাটাস টেবিল */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">অর্ডার ID</th>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">সার্ভিস ক্যাটাগরি ও নাম</th>
                      <th className="p-3.5">লিংক</th>
                      <th className="p-3.5">পরিমাণ</th>
                      <th className="p-3.5">ইউজার চার্জ (৳)</th>
                      <th className="p-3.5">মাদার খরচ (৳)</th>
                      <th className="p-3.5">আমাদের লাভ (৳)</th>
                      <th className="p-3.5">বর্তমান অবস্থা (স্ট্যাটাস)</th>
                      <th className="p-3.5 text-center">অ্যাডমিন অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredOrders.map(o => {
                      const chargeVal = typeof o.charge === 'number' ? o.charge : (parseFloat(String(o.charge || 0)) || 0);
                      const qtyVal = typeof o.quantity === 'number' ? o.quantity : (parseFloat(String(o.quantity || 1000)) || 1000);
                      const margin = Number(profitMarginPer1k) || 10;
                      const orderProfit = o.profit !== undefined && o.profit !== null 
                        ? (typeof o.profit === 'number' ? o.profit : (parseFloat(String(o.profit)) || 0))
                        : parseFloat(((qtyVal / 1000) * margin).toFixed(2));
                      const orderCost = o.providerCost !== undefined && o.providerCost !== null
                        ? (typeof o.providerCost === 'number' ? o.providerCost : (parseFloat(String(o.providerCost)) || 0))
                        : Math.max(0, chargeVal - orderProfit);

                      const statusLower = (o.status || '').toLowerCase();
                      const isProcessing = statusLower === 'processing' || statusLower === 'in progress' || statusLower === 'pending';
                      const isCompleted = statusLower === 'completed';
                      const isCanceled = statusLower === 'canceled' || statusLower === 'partial' || statusLower === 'refunded';

                      return (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition">
                          
                          {/* অর্ডার ID ও আপস্ট্রিম */}
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-200 block">{o.id}</span>
                            {o.upstreamId ? (
                              <span className="text-[10px] text-purple-400 font-mono flex items-center gap-1 mt-0.5">
                                <i className="fa-solid fa-server text-[9px]"></i> #{o.upstreamId}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">লোকাল অর্ডার</span>
                            )}
                          </td>

                          {/* তারিখ */}
                          <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                            {o.date || '-'}
                          </td>

                          {/* সার্ভিস নাম */}
                          <td className="p-3.5 max-w-xs">
                            {o.category && (
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded mr-1 font-bold">
                                {o.category}
                              </span>
                            )}
                            <div className="font-medium text-slate-200 truncate mt-0.5" title={o.serviceName}>
                              {o.serviceName || '-'}
                            </div>
                          </td>

                          {/* লিংক */}
                          <td className="p-3.5 max-w-[160px] truncate">
                            <a 
                              href={o.link || '#'} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                              <span className="truncate">{o.link || '-'}</span>
                            </a>
                          </td>

                          {/* পরিমাণ */}
                          <td className="p-3.5 font-bold text-slate-200 whitespace-nowrap">
                            {(qtyVal || 0).toLocaleString()}
                          </td>

                          {/* ইউজার চার্জ */}
                          <td className="p-3.5 font-black text-slate-100 whitespace-nowrap">
                            ৳ {(chargeVal || 0).toFixed(2)}
                          </td>

                          {/* মাদার খরচ */}
                          <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                            ৳ {(orderCost || 0).toFixed(2)}
                          </td>

                          {/* আমাদের লাভ */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-black text-xs inline-flex items-center gap-1">
                              <i className="fa-solid fa-coins text-[10px] text-amber-400"></i>
                              +৳ {(orderProfit || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* বর্তমান অবস্থা (স্ট্যাটাস) */}
                          <td className="p-3.5 whitespace-nowrap">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <i className="fa-solid fa-circle-check text-[10px]"></i>
                                Completed
                              </span>
                            ) : isProcessing ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                                {o.status || 'Processing'}
                              </span>
                            ) : isCanceled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <i className="fa-solid fa-circle-xmark text-[10px]"></i>
                                {o.status || 'Canceled'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {o.status || 'Pending'}
                              </span>
                            )}
                          </td>

                          {/* অ্যাডমিন অ্যাকশন */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* লাইভ চেক বাটন */}
                              <button
                                onClick={() => handleCheckOrderLive(o)}
                                title="মাদারপ্যানেল API দিয়ে লাইভ স্ট্যাটাস চেক করুন"
                                className="w-7 h-7 rounded-lg bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white transition flex items-center justify-center cursor-pointer text-xs"
                              >
                                <i className="fa-solid fa-arrows-rotate"></i>
                              </button>

                              {/* কুইক স্ট্যাটাস সিলেক্টর */}
                              <select
                                value={o.status || 'Pending'}
                                onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                                className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="Processing">Processing</option>
                                <option value="In progress">In progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Partial">Partial</option>
                                <option value="Canceled">Canceled</option>
                                <option value="Pending">Pending</option>
                              </select>

                              {/* ডিটেইলস মডাল ওপেন বাটন */}
                              <button
                                onClick={() => setSelectedOrderModal(o)}
                                title="অর্ডার সম্পূর্ণ বিস্তারিত দেখুন"
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer text-xs"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-slate-500">
                          <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-600 block"></i>
                          এই ভাগে কোনো অর্ডার পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 👁️ অর্ডার ডিটেইলস ও স্ট্যাটাস ম্যানেজমেন্ট মডাল */}
        {selectedOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <i className="fa-solid fa-receipt"></i>
                  </span>
                  <div>
                    <h4 className="text-base font-black text-slate-100">
                      অর্ডার বিস্তারিত: {selectedOrderModal.id}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {selectedOrderModal.date}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderModal(null)}
                  className="text-slate-400 hover:text-white cursor-pointer text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* অর্ডার ইনফো গ্রিড */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">মাদারপ্যানেল Upstream ID</span>
                  <span className="font-mono text-purple-400 font-bold text-sm">
                    {selectedOrderModal.upstreamId ? `#${selectedOrderModal.upstreamId}` : 'লোকাল'}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">বর্তমান স্ট্যাটাস</span>
                  <span className="font-bold text-slate-200 text-sm">
                    {selectedOrderModal.status || 'Pending'}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">অর্ডার পরিমাণ</span>
                  <span className="font-black text-slate-200 text-sm">
                    {(Number(selectedOrderModal.quantity) || 1000).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ইউজার চার্জ ও লাভ</span>
                  <span className="font-black text-emerald-400 text-sm">
                    ৳ {(Number(selectedOrderModal.charge) || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold ml-1.5">
                    (+৳ {(Number(selectedOrderModal.profit) || 0).toFixed(2)})
                  </span>
                </div>
              </div>

              {/* সার্ভিস ও লিঙ্ক */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">সার্ভিস নাম</span>
                  <p className="font-medium text-slate-200 mt-0.5">{selectedOrderModal.serviceName}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">টার্গেট লিঙ্ক</span>
                  <a
                    href={selectedOrderModal.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline break-all font-mono text-[11px] block mt-0.5"
                  >
                    {selectedOrderModal.link}
                  </a>
                </div>
              </div>

              {/* স্ট্যাটাস পরিবর্তন কুইক বাটনসমূহ */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 block">
                  কুইক স্ট্যাটাস আপডেট করুন:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'Completed');
                      setSelectedOrderModal({ ...selectedOrderModal, status: 'Completed' });
                    }}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-check"></i> Completed
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'Processing');
                      setSelectedOrderModal({ ...selectedOrderModal, status: 'Processing' });
                    }}
                    className="py-2 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-spinner"></i> Processing
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'Canceled');
                      setSelectedOrderModal({ ...selectedOrderModal, status: 'Canceled' });
                    }}
                    className="py-2 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i> Canceled
                  </button>
                </div>
              </div>

              {/* ফুটারে ক্লোজ বাটন */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📱 LAYER 5: PAYMENT GATEWAY SETUP */}
        {adminTab === 'payment' && (
          <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-mobile-screen-button text-emerald-400"></i> পেমেন্ট মেথড ও নাম্বার ম্যানেজমেন্ট
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ইউজাররা ফান্ড এড করার সময় এই নাম্বারগুলো দেখতে পাবে
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> বিকাশ (bKash) পার্সোনাল নাম্বার
                  </label>
                  <input
                    type="text"
                    value={paymentNumbers.bkash}
                    onChange={(e) => setPaymentNumbers({ ...paymentNumbers, bkash: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> নগদ (Nagad) পার্সোনাল নাম্বার
                  </label>
                  <input
                    type="text"
                    value={paymentNumbers.nagad}
                    onChange={(e) => setPaymentNumbers({ ...paymentNumbers, nagad: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> বাইনেন্স (Binance) Pay ID / ওয়ালেট
                  </label>
                  <input
                    type="text"
                    value={paymentNumbers.binance}
                    onChange={(e) => setPaymentNumbers({ ...paymentNumbers, binance: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span> বাইবিট (ByBit) ওয়ালেট / UID
                  </label>
                  <input
                    type="text"
                    value={paymentNumbers.bybit}
                    onChange={(e) => setPaymentNumbers({ ...paymentNumbers, bybit: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                onClick={() => showToast('✅ পেমেন্ট নাম্বার সফলভাবে আপডেট ও সেভ হয়েছে!')}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                পেমেন্ট তথ্য সেভ করুন
              </button>
            </div>
          </div>
        )}

        {/* 🎁 LAYER 6: REFERRAL OFFERS & BANNER */}
        {adminTab === 'referral' && (
          <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-gift text-yellow-400"></i> রেফারেল অফার ও ব্যানার সেটিংস
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ইউজারদের জন্য বোনাস রেট এবং নোটিশ মেসেজ পরিবর্তন করুন
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      রেফারকারী বোনাস (৳)
                    </label>
                    <input
                      type="number"
                      value={refBonusUser}
                      onChange={(e) => setRefBonusUser(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      নতুন ইউজার সাইন-আপ বোনাস (৳)
                    </label>
                    <input
                      type="number"
                      value={refBonusNew}
                      onChange={(e) => setRefBonusNew(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-yellow-400 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    রেফারেল ব্যানার ও প্রচার টেক্সট
                  </label>
                  <textarea
                    rows={4}
                    value={refText}
                    onChange={(e) => setRefText(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <button
                onClick={() => showToast('✅ রেফারেল সেটিংস সফলভাবে আপডেট ও সেভ হয়েছে!')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                রেফারেল সেটিংস সেভ করুন
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 🛠️ CUSTOM BALANCE ADJUSTMENT MODAL (NO WINDOW.PROMPT REQUIRED) */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-100 flex items-center gap-2">
                  <i className="fa-solid fa-coins text-emerald-400"></i> ইউজার ব্যালেন্স কাস্টম পরিবর্তন
                </h4>
                <p className="text-[11px] text-slate-400">
                  {balanceModalUser.name} (#{balanceModalUser.code})
                </p>
              </div>
              <button 
                onClick={() => setBalanceModalUser(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">বর্তমান ব্যালেন্স:</span>
              <span className="font-black text-emerald-400 text-sm">৳ {(Number(balanceModalUser.balance) || 0).toFixed(2)}</span>
            </div>

            {/* Adjust Type Selection */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  adjustType === 'add'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-plus"></i> ব্যালেন্স যোগ (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('deduct')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  adjustType === 'deduct'
                    ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-minus"></i> কর্তন (-)
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                value={customAmountInput}
                onChange={(e) => setCustomAmountInput(e.target.value)}
                placeholder="যেমন: 100"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex gap-2 text-xs">
              {[50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCustomAmountInput(val.toString())}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-1.5 rounded-lg text-slate-300 font-bold transition cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApplyCustomBalance}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ নতুন ইউজার যোগ করার মডাল */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-user-plus text-emerald-400"></i> নতুন রিয়েল ইউজার যোগ করুন
              </h4>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ইউজারের নাম</label>
              <input
                type="text"
                value={newUserNameInput}
                onChange={(e) => setNewUserNameInput(e.target.value)}
                placeholder="যেমন: মো: কামরুল হাসান"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">শুরুর ব্যালেন্স (৳)</label>
              <input
                type="number"
                value={newUserBalanceInput}
                onChange={(e) => setNewUserBalanceInput(e.target.value)}
                placeholder="0"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const bal = parseFloat(newUserBalanceInput) || 0;
                  if (onAddUser) {
                    onAddUser(newUserNameInput, bal);
                  }
                  setIsAddUserModalOpen(false);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

        {/* 💬 LAYER 8: SUPPORT MESSAGES */}
        {adminTab === 'support' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in space-y-4">
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-headset text-emerald-400"></i> ইউজার সাপোর্ট মেসেজসমূহ
            </h3>
            {supportMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <i className="fa-solid fa-inbox text-3xl mb-2 text-slate-700 block"></i>
                কোনো সাপোর্ট মেসেজ নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {supportMessages.map(msg => (
                  <div key={msg.id} className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-300 font-bold flex items-center justify-between">
                      <span>ইউজার: #{msg.userCode}</span>
                      <span className="text-[10px] text-slate-500">{new Date(msg.date).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-slate-200 mt-2 p-3 bg-slate-900 rounded-lg">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

    </div>
  );
};
