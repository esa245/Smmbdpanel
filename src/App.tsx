/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, FundRequest, ServiceItem, AdminUserItem, PaymentNumbers, SupportMessage } from './types';
import { SidebarSector } from './components/SidebarSector';
import { HeaderSector } from './components/HeaderSector';
import { DashboardSection } from './components/DashboardSection';
import { NewOrderSection } from './components/NewOrderSection';
import { OrderHistorySection } from './components/OrderHistorySection';
import { BalanceAddSection } from './components/BalanceAddSection';
import { ReferralSection } from './components/ReferralSection';
import { SupportSection } from './components/SupportSection';
import { AdminPanelSection } from './components/AdminPanelSection';
import { AddFundModal } from './components/AddFundModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  dbSaveFundRequest,
  dbUpdateFundRequestStatus,
  subscribeToFundRequests,
  dbSaveUser,
  dbUpdateUser,
  subscribeToUsers,
  subscribeToSingleUser,
  dbRecordReferral,
  dbSaveOrder,
  dbUpdateOrderStatus,
  subscribeToOrders,
  dbSavePaymentNumbers,
  subscribeToPaymentNumbers,
  dbSaveReferralSettings,
  subscribeToReferralSettings,
  dbSaveSupportMessage,
  subscribeToSupportMessages
} from './firebase';

const USD_TO_BDT = 120;

export const DEFAULT_INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 101,
    service: 101,
    category: 'Facebook Services',
    name: 'Facebook Page Follower [HQ Real Profiles - Non Drop]',
    providerRateUsd: 0.35,
    providerRateBdt: 42.00,
    rateBdt: 52.00,
    profitMarginBdt: 10,
    min: 100,
    max: 50000
  },
  {
    id: 102,
    service: 102,
    category: 'Facebook Services',
    name: 'Facebook Post Likes & Reactions [Instant Start]',
    providerRateUsd: 0.15,
    providerRateBdt: 18.00,
    rateBdt: 28.00,
    profitMarginBdt: 10,
    min: 50,
    max: 100000
  },
  {
    id: 201,
    service: 201,
    category: 'TikTok Services',
    name: 'TikTok Video Views [Ultra Fast Delivery - 100% Safe]',
    providerRateUsd: 0.05,
    providerRateBdt: 6.00,
    rateBdt: 16.00,
    profitMarginBdt: 10,
    min: 500,
    max: 500000
  },
  {
    id: 202,
    service: 202,
    category: 'TikTok Services',
    name: 'TikTok Organic Followers [Global Profiles - Lifetime Refill]',
    providerRateUsd: 0.50,
    providerRateBdt: 60.00,
    rateBdt: 70.00,
    profitMarginBdt: 10,
    min: 100,
    max: 50000
  },
  {
    id: 301,
    service: 301,
    category: 'YouTube Services',
    name: 'YouTube Video Views [High Retention - Monetization Safe]',
    providerRateUsd: 0.40,
    providerRateBdt: 48.00,
    rateBdt: 58.00,
    profitMarginBdt: 10,
    min: 500,
    max: 100000
  },
  {
    id: 302,
    service: 302,
    category: 'YouTube Services',
    name: 'YouTube Subscribers [Non-Drop Guaranteed - 30 Days Refill]',
    providerRateUsd: 1.20,
    providerRateBdt: 144.00,
    rateBdt: 154.00,
    profitMarginBdt: 10,
    min: 50,
    max: 10000
  },
  {
    id: 401,
    service: 401,
    category: 'Telegram Services',
    name: 'Telegram Public/Private Channel Members [Instant]',
    providerRateUsd: 0.25,
    providerRateBdt: 30.00,
    rateBdt: 40.00,
    profitMarginBdt: 10,
    min: 100,
    max: 50000
  },
  {
    id: 501,
    service: 501,
    category: 'Instagram Services',
    name: 'Instagram Real Followers [Stable Speed - High Quality]',
    providerRateUsd: 0.65,
    providerRateBdt: 78.00,
    rateBdt: 88.00,
    profitMarginBdt: 10,
    min: 100,
    max: 50000
  }
];

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isAddFundModalOpen, setIsAddFundModalOpen] = useState<boolean>(false);
  
  // Auto-generated 6-digit user code
  const [userCode] = useState<string>(() => {
    let code = localStorage.getItem('smm_user_code');
    if (!code) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('smm_user_code', code);
    }
    return code;
  });

  // User Balance State
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('smm_user_balance');
    if (saved !== null) return parseFloat(saved);
    
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && !localStorage.getItem('smm_referred')) {
      localStorage.setItem('smm_referred', 'true');
      return 3.00; // 3 Tk bonus for joining via referral
    }
    return 0.00;
  });

  const [apiKey, setApiKey] = useState<string>('236d029077639b370d02d52a2aa3f8a2');

  // 💰 Profit Margin per 1,000 orders (Default: 10 Tk profit per 1,000 order quantity)
  // "ওদের চাইতে ১০০০ ওডার করলে ১০ টাকা করে লাভ থাকবে আমাদের তারা বাড়ালে আমাদের বাড়বে টাকা"
  const [profitMarginPer1k, setProfitMarginPer1k] = useState<number>(() => {
    const saved = localStorage.getItem('smm_profit_margin_1k');
    return saved !== null ? parseFloat(saved) : 10;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    return DEFAULT_INITIAL_SERVICES.map(s => ({
      ...s,
      profitMarginBdt: profitMarginPer1k,
      rateBdt: parseFloat((s.providerRateBdt + profitMarginPer1k).toFixed(2))
    }));
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('smm_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove demo orders
          return parsed.filter((o: any) => o.id !== 'ORD-1082' && o.id !== 'ORD-1095');
        }
      } catch (e) {}
    }
    return [];
  });

  const [fundRequests, setFundRequests] = useState<FundRequest[]>(() => {
    const saved = localStorage.getItem('smm_fund_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    return subscribeToSupportMessages((messages) => {
      setSupportMessages(messages);
    });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // New Order Form state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [orderLink, setOrderLink] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<string>('');

  // Balance Add state
  const [depositMethod, setDepositMethod] = useState<string>('বিকাশ (bKash)');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositTrx, setDepositTrx] = useState<string>('');

  // Referral Offer state (Editable in Admin)
  const [refBonusUser, setRefBonusUser] = useState<number>(() => {
    return parseFloat(localStorage.getItem('smm_ref_bonus_user') || '5');
  });
  const [refBonusNew, setRefBonusNew] = useState<number>(() => {
    return parseFloat(localStorage.getItem('smm_ref_bonus_new') || '3');
  });

  // Payment numbers state (Editable in Admin)
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumbers>(() => {
    const saved = localStorage.getItem('smm_payment_numbers');
    return saved ? JSON.parse(saved) : {
      bkash: '01799887799',
      nagad: '01811223344',
      binance: 'SMMBDPRO_USDT',
      bybit: 'SMMBDPRO_BYBIT'
    };
  });

  // Referral Text state (Editable in Admin)
  const [refText, setRefText] = useState(() => {
    return localStorage.getItem('smm_ref_text') || 'আপনার লিংক থেকে কেউ জয়েন করলে আপনি পাবেন এবং সে পাবে সাইন-আপ বোনাস!';
  });

  // Secret Admin Login state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPassInput, setAdminPassInput] = useState<string>('');

  const handleAdminAccess = () => {
    if (isAdminLoggedIn) {
      setActiveSection('admin');
      showToast('🔒 এডমিন প্যানেলে প্রবেশ করেছেন');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmailInput === 'Romjan' && adminPassInput === 'Romjan') {
      setIsAdminLoggedIn(true);
      setActiveSection('admin');
      setIsAdminLoginModalOpen(false);
      setAdminEmailInput('');
      setAdminPassInput('');
      showToast('✅ এডমিন লগইন সফল হয়েছে!');
    } else {
      showToast('❌ ইমেইল অথবা পাসওয়ার্ড ভুল (Romjan / Romjan দিন)');
    }
  };

  const [adminTab, setAdminTab] = useState<'users' | 'deposits' | 'api' | 'pricing' | 'orders' | 'payment' | 'referral' | 'support'>('users');
  
  const [adminUsersList, setAdminUsersList] = useState<AdminUserItem[]>(() => {
    const saved = localStorage.getItem('smm_admin_user_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove all hardcoded demo users
          const cleanUsers = parsed.filter(
            (u: any) => u.id !== 'u-2' && u.id !== 'u-3' && u.id !== 'u-4' && u.id !== 'u-5' &&
                        u.code !== '928104' && u.code !== '614920' && u.code !== '305819' && u.code !== '782341' &&
                        u.name !== 'তানভীর আহমেদ' && u.name !== 'শাকিল হোসেন' && u.name !== 'মো: হাসান আলী' && u.name !== 'রাকিবুল ইসলাম'
          );
          if (cleanUsers.length > 0) return cleanUsers;
        }
      } catch (e) {}
    }
    return [
      {
        id: `u-${userCode}`,
        code: userCode,
        name: `ইউজার #${userCode}`,
        balance: balance,
        totalDeposit: 0,
        ordersCount: 0,
        referredBy: 'Direct (অর্গানিক)',
        referredCount: 0,
        refEarnings: 0,
        status: 'Online',
        joinedDate: 'আজকে'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('smm_admin_user_list', JSON.stringify(adminUsersList));
  }, [adminUsersList]);

  useEffect(() => {
    setAdminUsersList(prev => {
      // Clean out any lingering demo users
      const cleanPrev = prev.filter(
        u => u.id !== 'u-2' && u.id !== 'u-3' && u.id !== 'u-4' && u.id !== 'u-5' &&
             u.code !== '928104' && u.code !== '614920' && u.code !== '305819' && u.code !== '782341' &&
             u.name !== 'তানভীর আহমেদ' && u.name !== 'শাকিল হোসেন' && u.name !== 'মো: হাসান আলী' && u.name !== 'রাকিবুল ইসলাম'
      );
      const existing = cleanPrev.find(u => u.code === userCode);
      const approvedDep = fundRequests.filter(r => r.userCode === userCode && r.status === 'Approved').reduce((s, r) => s + r.amount, 0);

      if (existing) {
        return cleanPrev.map(u => {
          if (u.code === userCode) {
            return {
              ...u,
              balance: balance,
              totalDeposit: approvedDep,
              ordersCount: orders.length
            };
          }
          return u;
        });
      } else {
        const currentUserItem: AdminUserItem = {
          id: `u-${userCode}`,
          code: userCode,
          name: `ইউজার #${userCode}`,
          balance: balance,
          totalDeposit: approvedDep,
          ordersCount: orders.length,
          referredBy: 'Direct (অর্গানিক)',
          referredCount: 0,
          refEarnings: 0,
          status: 'Online',
          joinedDate: 'আজকে'
        };
        return [currentUserItem, ...cleanPrev];
      }
    });
  }, [balance, orders.length, fundRequests, userCode]);

  const handleAdjustUserBalance = (code: string, delta: number) => {
    if (code === userCode) {
      const nextBal = Math.max(0, balance + delta);
      setBalance(nextBal);
      dbUpdateUser(userCode, { balance: nextBal }).catch(console.error);
    }
    setAdminUsersList(prev => prev.map(u => {
      if (u.code === code) {
        const updatedBal = Math.max(0, u.balance + delta);
        dbUpdateUser(code, { balance: updatedBal }).catch(console.error);
        return { ...u, balance: updatedBal };
      }
      return u;
    }));
    showToast(`✅ ইউজার #${code}-এর ব্যালেন্সে ৳ ${delta > 0 ? '+' : ''}${delta} আপডেট হয়েছে!`);
  };

  const [apiStatusResult, setApiStatusResult] = useState<{ checked: boolean; success: boolean; data?: any; error?: string }>({
    checked: false,
    success: false
  });

  const checkApiStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey, action: 'balance' })
      });
      const data = await res.json();
      if (data.balance !== undefined || Array.isArray(data) || data.error === undefined) {
        setApiStatusResult({ checked: true, success: true, data });
        showToast('✅ API Key Accepted & Connected!');
      } else {
        setApiStatusResult({ checked: true, success: false, error: data.error || 'Invalid API Key' });
        showToast('❌ API Key Rejected!');
      }
    } catch (e: any) {
      setApiStatusResult({ checked: true, success: false, error: e.message || 'Connection failed' });
      showToast('❌ API Connection Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('smm_payment_numbers', JSON.stringify(paymentNumbers));
    localStorage.setItem('smm_ref_text', refText);
    dbSavePaymentNumbers(paymentNumbers).catch(() => {});
    dbSaveReferralSettings({ refBonusUser, refBonusNew, refText }).catch(() => {});
  }, [paymentNumbers, refText, refBonusUser, refBonusNew]);

  // 🔴 Firebase Realtime Database Real-time Subscriptions
  useEffect(() => {
    // 1. Live sync for deposits / fund requests
    const unsubDeposits = subscribeToFundRequests((requests) => {
      if (Array.isArray(requests)) {
        setFundRequests(requests);
      }
    });

    // 2. Live sync for orders
    const unsubOrders = subscribeToOrders((rtdbOrders) => {
      if (Array.isArray(rtdbOrders) && rtdbOrders.length > 0) {
        const clean = rtdbOrders.filter(o => o.id !== 'ORD-1082' && o.id !== 'ORD-1095');
        setOrders(clean);
      }
    });

    // 3. Live sync for all users (Admin view)
    const unsubUsers = subscribeToUsers((rtdbUsers) => {
      if (Array.isArray(rtdbUsers) && rtdbUsers.length > 0) {
        const clean = rtdbUsers.filter(
          u => u.id !== 'u-2' && u.id !== 'u-3' && u.id !== 'u-4' && u.id !== 'u-5' &&
               u.code !== '928104' && u.code !== '614920' && u.code !== '305819' && u.code !== '782341' &&
               u.name !== 'তানভীর আহমেদ' && u.name !== 'শাকিল হোসেন' && u.name !== 'মো: হাসান আলী' && u.name !== 'রাকিবুল ইসলাম'
        );
        if (clean.length > 0) {
          setAdminUsersList(clean);
        }
      }
    });

    // 4. Live sync for payment numbers
    const unsubPay = subscribeToPaymentNumbers((nums) => {
      if (nums && nums.bkash) {
        setPaymentNumbers(nums);
      }
    });

    // 5. Live sync for referral settings
    const unsubRef = subscribeToReferralSettings((settings) => {
      if (settings) {
        if (typeof settings.refBonusUser === 'number') setRefBonusUser(settings.refBonusUser);
        if (typeof settings.refBonusNew === 'number') setRefBonusNew(settings.refBonusNew);
        if (settings.refText) setRefText(settings.refText);
      }
    });

    return () => {
      unsubDeposits();
      unsubOrders();
      unsubUsers();
      unsubPay();
      unsubRef();
    };
  }, []);

  // 🔴 Live sync for current user's profile and balance
  useEffect(() => {
    const unsubUser = subscribeToSingleUser(userCode, (userData) => {
      if (userData && typeof userData.balance === 'number') {
        setBalance(userData.balance);
      }
    });
    return () => unsubUser();
  }, [userCode]);

  // 🎁 Real-time Referral Register
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && refCode !== userCode && !localStorage.getItem('smm_referred_done')) {
      localStorage.setItem('smm_referred_done', refCode);
      dbRecordReferral(refCode, userCode, refBonusUser, refBonusNew)
        .then(() => {
          showToast(`🎁 রেফারেল বোনাস ৳${refBonusNew} স্বয়ংক্রিয়ভাবে ব্যালেন্সে যুক্ত হয়েছে!`);
        })
        .catch(console.error);
    }
  }, [userCode, refBonusUser, refBonusNew]);

  // 👥 Sync current user to Firebase RTDB whenever balance or orders change
  useEffect(() => {
    const approvedDep = fundRequests
      .filter(r => r.userCode === userCode && r.status === 'Approved')
      .reduce((s, r) => s + r.amount, 0);

    const currentUserItem: AdminUserItem = {
      id: `u-${userCode}`,
      code: userCode,
      name: `ইউজার #${userCode}`,
      balance: balance,
      totalDeposit: approvedDep,
      ordersCount: orders.length,
      referredBy: localStorage.getItem('smm_referred_done')
        ? `রেফার: #${localStorage.getItem('smm_referred_done')}`
        : 'Direct (অর্গানিক)',
      referredCount: 0,
      refEarnings: 0,
      status: 'Online',
      joinedDate: 'আজকে'
    };
    dbSaveUser(currentUserItem).catch(() => {});
  }, [userCode, balance, orders.length, fundRequests]);

  useEffect(() => {
    fetchServicesFromApi();
    
    // Purge demo orders from localStorage
    const savedOrders = localStorage.getItem('smm_orders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          const cleanOrders = parsed.filter((o: any) => o.id !== 'ORD-1082' && o.id !== 'ORD-1095');
          setOrders(cleanOrders);
          localStorage.setItem('smm_orders', JSON.stringify(cleanOrders));
        }
      } catch (e) {}
    }

    // Purge demo users from localStorage
    const savedUsers = localStorage.getItem('smm_admin_user_list');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const cleanUsers = parsed.filter(
            (u: any) => u.id !== 'u-2' && u.id !== 'u-3' && u.id !== 'u-4' && u.id !== 'u-5' &&
                        u.code !== '928104' && u.code !== '614920' && u.code !== '305819' && u.code !== '782341' &&
                        u.name !== 'তানভীর আহমেদ' && u.name !== 'শাকিল হোসেন' && u.name !== 'মো: হাসান আলী' && u.name !== 'রাকিবুল ইসলাম'
          );
          setAdminUsersList(cleanUsers);
          localStorage.setItem('smm_admin_user_list', JSON.stringify(cleanUsers));
        }
      } catch (e) {}
    }

    // Purge demo fund requests from localStorage
    const savedRequests = localStorage.getItem('smm_fund_requests');
    if (savedRequests) {
      try {
        const parsed = JSON.parse(savedRequests);
        if (Array.isArray(parsed)) {
          const cleanRequests = parsed.filter((r: any) => 
            r.userCode !== '928104' && r.userCode !== '614920' && r.userCode !== '305819' && r.userCode !== '782341'
          );
          setFundRequests(cleanRequests);
          localStorage.setItem('smm_fund_requests', JSON.stringify(cleanRequests));
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smm_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('smm_user_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('smm_fund_requests', JSON.stringify(fundRequests));
  }, [fundRequests]);

  useEffect(() => {
    localStorage.setItem('smm_ref_bonus_user', refBonusUser.toString());
    localStorage.setItem('smm_ref_bonus_new', refBonusNew.toString());
  }, [refBonusUser, refBonusNew]);

  useEffect(() => {
    localStorage.setItem('smm_profit_margin_1k', profitMarginPer1k.toString());
    setServices(prev => prev.map(s => ({
      ...s,
      profitMarginBdt: profitMarginPer1k,
      rateBdt: parseFloat((s.providerRateBdt + profitMarginPer1k).toFixed(2))
    })));
  }, [profitMarginPer1k]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchServicesFromApi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey, action: 'services' })
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted: ServiceItem[] = data.map((s: any) => {
          const pUsd = parseFloat(s.rate) || 0;
          const pBdt = parseFloat((pUsd * USD_TO_BDT).toFixed(2));
          return {
            id: parseInt(s.service || s.id) || Math.floor(100 + Math.random() * 900),
            service: parseInt(s.service || s.id) || undefined,
            category: s.category || 'General',
            name: s.name,
            rateUsd: pUsd,
            providerRateUsd: pUsd,
            providerRateBdt: pBdt,
            profitMarginBdt: profitMarginPer1k,
            rateBdt: parseFloat((pBdt + profitMarginPer1k).toFixed(2)),
            min: parseInt(s.min) || 10,
            max: parseInt(s.max) || 100000
          };
        });
        setServices(formatted);
      }
    } catch (e) {
      console.error('API fetch services:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentService = services.find(s => s.id.toString() === selectedServiceId || s.service?.toString() === selectedServiceId);
  const qtyNum = parseFloat(orderQuantity) || 0;
  const totalPriceBdt = currentService ? parseFloat(((qtyNum / 1000) * currentService.rateBdt).toFixed(2)) : 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService || !orderLink || qtyNum <= 0) {
      showToast('⚠️ সঠিক তথ্য দিন!');
      return;
    }

    if (balance < totalPriceBdt) {
      showToast('❌ একাউন্টে পর্যাপ্ত ব্যালেন্স নেই! অর্ডার করতে ফান্ড অ্যাড করুন।');
      setIsAddFundModalOpen(true);
      return;
    }

    if (qtyNum < currentService.min || qtyNum > currentService.max) {
      showToast(`⚠️ পরিমাণ ${currentService.min} থেকে ${currentService.max} এর মধ্যে হতে হবে।`);
      return;
    }

    const providerTotalCost = parseFloat(((qtyNum / 1000) * currentService.providerRateBdt).toFixed(2));
    const orderNetProfit = parseFloat(((qtyNum / 1000) * profitMarginPer1k).toFixed(2));

    setIsLoading(true);
    try {
      const res = await fetch('/api/smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: apiKey,
          action: 'add',
          service: currentService.service || currentService.id,
          link: orderLink,
          quantity: qtyNum
        })
      });
      const data = await res.json();
      if (data.order || !data.error) {
        const nextBal = Math.max(0, balance - totalPriceBdt);
        setBalance(nextBal);
        const newOrder: Order = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          upstreamId: data.order ? data.order.toString() : `SIM-${Date.now().toString().slice(-4)}`,
          date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }),
          category: currentService.category,
          serviceName: currentService.name,
          link: orderLink,
          quantity: qtyNum,
          charge: totalPriceBdt,
          providerCost: providerTotalCost,
          profit: orderNetProfit,
          status: 'Processing'
        };
        setOrders(prev => [newOrder, ...prev]);
        dbSaveOrder(newOrder).catch(console.error);
        dbUpdateUser(userCode, { balance: nextBal, ordersCount: orders.length + 1 }).catch(console.error);
        showToast(`✅ অর্ডার সফল! মোট খরচ: ৳${totalPriceBdt} (ফায়ারবেজ রিয়েল-টাইম ডাটাবেজে সংরক্ষিত)`);
        setOrderLink('');
        setOrderQuantity('');
      } else {
        showToast(`❌ মাদারপ্যানেল এরর: ${data.error || 'অর্ডার হয়নি'}`);
      }
    } catch (err) {
      showToast('❌ সার্ভার কানেকশন এরর');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (order: Order) => {
    if (!order.upstreamId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey, action: 'status', order: order.upstreamId })
      });
      const data = await res.json();
      if (data.status) {
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: data.status } : o));
        dbUpdateOrderStatus(order.id, data.status).catch(console.error);
        showToast(`✅ স্ট্যাটাস আপডেট: ${data.status}`);
      }
    } catch (e) {
      showToast('❌ স্ট্যাটাস চেক করা যায়নি');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllStatuses = async () => {
    const ordersWithUpstream = orders.filter(o => o.upstreamId);
    if (ordersWithUpstream.length === 0) {
      showToast('⚠️ কোনো আপস্ট্রিম অর্ডার নেই।');
      return;
    }
    setIsLoading(true);
    try {
      let updatedOrders = [...orders];
      for (const order of ordersWithUpstream) {
        try {
          const res = await fetch('/api/smm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: apiKey, action: 'status', order: order.upstreamId })
          });
          const data = await res.json();
          if (data.status) {
            updatedOrders = updatedOrders.map(o => o.id === order.id ? { ...o, status: data.status } : o);
            dbUpdateOrderStatus(order.id, data.status).catch(console.error);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setOrders(updatedOrders);
      showToast('✅ সমস্ত অর্ডারের স্ট্যাটাস রিফ্রেশ করা হয়েছে!');
    } catch (e) {
      showToast('❌ রিফ্রেশ করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    dbUpdateOrderStatus(orderId, newStatus).catch(console.error);
    showToast(`✅ অর্ডার #${orderId} এর স্ট্যাটাস '${newStatus}' এ পরিবর্তন করা হয়েছে (ফায়ারবেজে আপডেট)`);
  };

  const handleDeleteUser = (codeToDelete: string) => {
    if (codeToDelete === userCode) {
      showToast('⚠️ বর্তমান সক্রিয় ইউজার মুছে ফেলা যাবে না!');
      return;
    }
    setAdminUsersList(prev => prev.filter(u => u.code !== codeToDelete));
    dbUpdateUser(codeToDelete, { status: 'Disabled' }).catch(console.error);
    showToast(`🗑️ ইউজার #${codeToDelete} সফলভাবে মুছে ফেলা হয়েছে!`);
  };

  const handleAddUser = (name: string, initialBal: number = 0) => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: AdminUserItem = {
      id: `u-${newCode}`,
      code: newCode,
      name: name.trim() || `ইউজার #${newCode}`,
      balance: initialBal + 3,
      totalDeposit: initialBal,
      ordersCount: 0,
      referredBy: 'Direct (অর্গানিক)',
      referredCount: 0,
      refEarnings: 0,
      status: 'Active',
      joinedDate: 'আজকে'
    };
    setAdminUsersList(prev => [newUser, ...prev]);
    dbSaveUser(newUser).catch(console.error);
    showToast(`✅ নতুন ইউজার "${newUser.name}" (ID: #${newCode}) ফায়ারবেজে যোগ করা হয়েছে!`);
  };

  const handleClearDemoData = () => {
    localStorage.removeItem('smm_orders');
    localStorage.removeItem('smm_fund_requests');
    localStorage.removeItem('smm_admin_user_list');
    setOrders([]);
    setFundRequests([]);
    const freshUser: AdminUserItem = {
      id: `u-${userCode}`,
      code: userCode,
      name: `ইউজার #${userCode}`,
      balance: balance,
      totalDeposit: 0,
      ordersCount: 0,
      referredBy: 'Direct (অর্গানিক)',
      referredCount: 0,
      refEarnings: 0,
      status: 'Online',
      joinedDate: 'আজকে'
    };
    setAdminUsersList([freshUser]);
    dbSaveUser(freshUser).catch(console.error);
    showToast('✨ সকল ডেমো ডেটা ও ডেমো ইউজার মুছে ফ্রেশ ও সম্পূর্ণ নতুন স্টেট চালু করা হয়েছে!');
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${userCode}`);
    showToast(`📋 রেফারেল লিংক কপি হয়েছে! (রেফারকারী ৳${refBonusUser}, নতুন ইউজার ৳${refBonusNew} পাবে)`);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0 || !depositTrx) {
      showToast('⚠️ সঠিক পরিমাণ ও TrxID দিন।');
      return;
    }

    const newReq: FundRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      userCode,
      date: new Date().toLocaleString(),
      method: depositMethod,
      amount: amt,
      trxId: depositTrx,
      status: 'Pending'
    };

    setFundRequests(prev => [newReq, ...prev]);
    dbSaveFundRequest(newReq).catch(e => console.error('Firebase save deposit error:', e));
    showToast('✅ ডিপোজিট রিকোয়েস্ট ফায়ারবেজ রিয়েল-টাইম ডাটাবেজে পাঠানো হয়েছে!');
    setDepositAmount('');
    setDepositTrx('');
    setIsAddFundModalOpen(false);
  };

  // Admin Actions
  const acceptDeposit = (id: string) => {
    const req = fundRequests.find(r => r.id === id);
    if (!req || req.status !== 'Pending') return;

    setFundRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    dbUpdateFundRequestStatus(id, 'Approved').catch(console.error);

    if (req.userCode === userCode) {
      const nextBal = balance + req.amount;
      setBalance(nextBal);
      dbUpdateUser(userCode, { balance: nextBal }).catch(console.error);
    } else {
      setAdminUsersList(prev => prev.map(u => {
        if (u.code === req.userCode) {
          const updated = {
            ...u,
            balance: u.balance + req.amount,
            totalDeposit: u.totalDeposit + req.amount
          };
          dbUpdateUser(req.userCode, { balance: updated.balance, totalDeposit: updated.totalDeposit }).catch(console.error);
          return updated;
        }
        return u;
      }));
    }
    showToast(`✅ #${req.userCode} এর ৳${req.amount} ডিপোজিট এপ্রুভ হয়েছে এবং ফায়ারবেজ রিয়েল-টাইমে ব্যালেন্স যুক্ত হয়েছে!`);
  };

  const rejectDeposit = (id: string) => {
    setFundRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    dbUpdateFundRequestStatus(id, 'Rejected').catch(console.error);
    showToast('❌ ডিপোজিট রিকোয়েস্ট রিজেক্ট করা হয়েছে (ফায়ারবেজে আপডেট)।');
  };

  const myFundRequests = fundRequests.filter(r => r.userCode === userCode);

  return (
    <div className="bg-[#0f172a] text-slate-100 font-sans min-h-screen selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce border border-emerald-400/30">
          <i className="fa-solid fa-circle-check"></i>
          {toast}
        </div>
      )}

      {/* Add Fund Modal Sector */}
      <AddFundModal
        isOpen={isAddFundModalOpen}
        onClose={() => setIsAddFundModalOpen(false)}
        depositMethod={depositMethod}
        setDepositMethod={setDepositMethod}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        depositTrx={depositTrx}
        setDepositTrx={setDepositTrx}
        paymentNumbers={paymentNumbers}
        handleDepositSubmit={handleDepositSubmit}
      />

      {/* Admin Login Modal Sector */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        adminEmailInput={adminEmailInput}
        setAdminEmailInput={setAdminEmailInput}
        adminPassInput={adminPassInput}
        setAdminPassInput={setAdminPassInput}
        handleAdminLoginSubmit={handleAdminLoginSubmit}
      />

      {/* 🔒 100% SEPARATE STANDALONE ADMIN PAGE */}
      {activeSection === 'admin' ? (
        <AdminPanelSection
          apiKey={apiKey}
          setApiKey={setApiKey}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminUsersList={adminUsersList}
          setAdminUsersList={setAdminUsersList}
          handleAdjustUserBalance={handleAdjustUserBalance}
          apiStatusResult={apiStatusResult}
          checkApiStatus={checkApiStatus}
          isLoading={isLoading}
          fundRequests={fundRequests}
          acceptDeposit={acceptDeposit}
          rejectDeposit={rejectDeposit}
          paymentNumbers={paymentNumbers}
          setPaymentNumbers={setPaymentNumbers}
          refBonusUser={refBonusUser}
          setRefBonusUser={setRefBonusUser}
          refBonusNew={refBonusNew}
          setRefBonusNew={setRefBonusNew}
          refText={refText}
          setRefText={setRefText}
          setActiveSection={setActiveSection}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
          showToast={showToast}
          orders={orders}
          supportMessages={supportMessages}
          profitMarginPer1k={profitMarginPer1k}
          setProfitMarginPer1k={setProfitMarginPer1k}
          services={services}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          checkStatus={checkStatus}
          refreshAllStatuses={refreshAllStatuses}
          onDeleteUser={handleDeleteUser}
          onAddUser={handleAddUser}
          onClearDemoData={handleClearDemoData}
        />
      ) : (
        /* 📱 USER PANEL LAYOUT (DASHBOARD, NEW ORDER, ORDERS, BALANCE ADD, REFERRAL) */
        <div className="flex h-screen overflow-hidden">
          
          {/* User Sidebar Sector */}
          <SidebarSector
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            handleAdminAccess={handleAdminAccess}
          />

          {/* User Main Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            
            {/* User Top Navbar Sector */}
            <HeaderSector
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              setSidebarOpen={setSidebarOpen}
              userCode={userCode}
              balance={balance}
              setIsAddFundModalOpen={setIsAddFundModalOpen}
              handleAdminAccess={handleAdminAccess}
              setIsAdminLoggedIn={setIsAdminLoggedIn}
              showToast={showToast}
            />

            {/* User Main Body Sections */}
            <main className="p-4 md:p-6 space-y-5 mx-auto w-full max-w-4xl">

              {/* 1. DASHBOARD SECTOR */}
              {activeSection === 'dashboard' && (
                <DashboardSection
                  balance={balance}
                  orders={orders}
                  services={services}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedServiceId={selectedServiceId}
                  setSelectedServiceId={setSelectedServiceId}
                  orderLink={orderLink}
                  setOrderLink={setOrderLink}
                  orderQuantity={orderQuantity}
                  setOrderQuantity={setOrderQuantity}
                  isLoading={isLoading}
                  handlePlaceOrder={handlePlaceOrder}
                  setIsAddFundModalOpen={setIsAddFundModalOpen}
                  userCode={userCode}
                  setActiveSection={setActiveSection}
                  showToast={showToast}
                />
              )}

              {/* 2. NEW ORDER SECTOR */}
              {activeSection === 'new-order' && (
                <NewOrderSection
                  services={services}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedServiceId={selectedServiceId}
                  setSelectedServiceId={setSelectedServiceId}
                  orderLink={orderLink}
                  setOrderLink={setOrderLink}
                  orderQuantity={orderQuantity}
                  setOrderQuantity={setOrderQuantity}
                  isLoading={isLoading}
                  handlePlaceOrder={handlePlaceOrder}
                />
              )}

              {/* 3. ORDER HISTORY SECTOR */}
              {activeSection === 'orders' && (
                <OrderHistorySection
                  orders={orders}
                  isLoading={isLoading}
                  refreshAllStatuses={refreshAllStatuses}
                  checkStatus={checkStatus}
                  apiKey={apiKey}
                  onOrdersUpdate={setOrders}
                />
              )}

              {/* 4. BALANCE ADD & DEPOSIT HISTORY SECTOR */}
              {activeSection === 'balance-add' && (
                <BalanceAddSection
                  depositMethod={depositMethod}
                  setDepositMethod={setDepositMethod}
                  depositAmount={depositAmount}
                  setDepositAmount={setDepositAmount}
                  depositTrx={depositTrx}
                  setDepositTrx={setDepositTrx}
                  paymentNumbers={paymentNumbers}
                  myFundRequests={myFundRequests}
                  handleDepositSubmit={handleDepositSubmit}
                />
              )}

              {/* 5. REFERRAL PROGRAM SECTOR */}
              {activeSection === 'referral' && (
                <ReferralSection
                  userCode={userCode}
                  refText={refText}
                  refBonusUser={refBonusUser}
                  refBonusNew={refBonusNew}
                  copyRefLink={copyRefLink}
                  showToast={showToast}
                  referredCount={adminUsersList.find(u => u.code === userCode)?.referredCount || 0}
                  refEarnings={adminUsersList.find(u => u.code === userCode)?.refEarnings || 0}
                />
              )}
              {activeSection === 'support' && (
                <SupportSection
                  userCode={userCode}
                  showToast={showToast}
                  saveMessage={dbSaveSupportMessage}
                />
              )}

            </main>
          </div>
        </div>
      )}
    </div>
  );
}
