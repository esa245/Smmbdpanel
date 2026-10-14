import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types';

interface OrderHistorySectionProps {
  orders: Order[];
  isLoading: boolean;
  refreshAllStatuses: () => void;
  checkStatus: (order: Order) => void;
  apiKey?: string;
  onOrdersUpdate?: (orders: Order[]) => void;
}

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({
  orders,
  isLoading,
  refreshAllStatuses,
  checkStatus,
  apiKey = '236d029077639b370d02d52a2aa3f8a2',
  onOrdersUpdate
}) => {
  // Local state for orders
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Processing' | 'Completed' | 'Pending' | 'Canceled' | 'Partial'>('all');

  // Keep local state in sync when parent orders change
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Keep a reference to current localOrders to avoid stale closures in intervals
  const localOrdersRef = useRef<Order[]>(localOrders);
  useEffect(() => {
    localOrdersRef.current = localOrders;
  }, [localOrders]);

  // Check status function for all 'Processing' orders
  const checkProcessingOrders = useCallback(async () => {
    const currentOrders = localOrdersRef.current;
    const processingOrders = currentOrders.filter(
      o => o.status && o.status.toLowerCase() === 'processing'
    );

    if (processingOrders.length === 0) {
      setLastPollTime(new Date());
      setCountdown(60);
      return;
    }

    setIsPolling(true);
    try {
      let hasChanges = false;
      const updatedList = await Promise.all(
        currentOrders.map(async (order) => {
          if (!order.status || order.status.toLowerCase() !== 'processing' || !order.upstreamId) {
            return order;
          }

          try {
            const res = await fetch('/api/smm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: apiKey,
                action: 'status',
                order: order.upstreamId
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data && data.status && data.status !== order.status) {
                hasChanges = true;
                return { ...order, status: data.status };
              }
            } else if (order.upstreamId.startsWith('SIM-')) {
              // Simulated demo order completion
              hasChanges = true;
              return { ...order, status: 'Completed' };
            }
          } catch (err) {
            if (order.upstreamId.startsWith('SIM-')) {
              hasChanges = true;
              return { ...order, status: 'Completed' };
            }
          }
          return order;
        })
      );

      if (hasChanges) {
        setLocalOrders(updatedList);
        if (onOrdersUpdate) {
          onOrdersUpdate(updatedList);
        }
      }
    } catch (e) {
      console.error('Background polling error:', e);
    } finally {
      setIsPolling(false);
      setLastPollTime(new Date());
      setCountdown(60);
    }
  }, [apiKey, onOrdersUpdate]);

  // 60-second polling interval & 1-second countdown timer
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkProcessingOrders();
    }, 60000);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [checkProcessingOrders]);

  const processingCount = localOrders.filter(
    o => o.status && o.status.toLowerCase() === 'processing'
  ).length;

  // Filtered orders based on search bar and status
  const filteredOrders = localOrders.filter(order => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (order.id && order.id.toLowerCase().includes(q)) ||
      (order.serviceName && order.serviceName.toLowerCase().includes(q)) ||
      (order.upstreamId && order.upstreamId.toLowerCase().includes(q)) ||
      (order.link && order.link.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all' ||
      (order.status && order.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md p-5 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-emerald-400"></i> অর্ডার হিস্টোরি ও স্ট্যাটাস
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
              {isPolling ? 'অটো-চেকিং চলছে...' : 'অটো-পোলিং ব্যাকগ্রাউন্ডে সক্রিয়'}
            </span>
            <span className="text-[11px] text-slate-400">
              পরবর্তী অটো চেক: <strong className="text-emerald-400 font-mono">{countdown}s</strong>
            </span>
            {processingCount > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium">
                {processingCount} টি Processing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              checkProcessingOrders();
            }}
            disabled={isPolling || isLoading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition border border-slate-700/60 cursor-pointer disabled:opacity-50"
            title="Processing অর্ডারগুলো এখনই চেক করুন"
          >
            <i className={`fa-solid fa-arrows-rotate text-emerald-400 ${isPolling ? 'animate-spin' : ''}`}></i>
            {isPolling ? 'চেক হচ্ছে...' : 'পোলিং চেক (এখনই)'}
          </button>

          <button 
            onClick={refreshAllStatuses} 
            disabled={isLoading} 
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition"
          >
            <i className={`fa-solid fa-rotate ${isLoading ? 'animate-spin' : ''}`}></i> সব রিফ্রেশ
          </button>
        </div>
      </div>

      {/* 🔍 Search Bar & Quick Filters */}
      <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="অর্ডার আইডি (যেমন: ORD-...) বা সার্ভিস নাম দিয়ে খুঁজুন..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-0.5"
              title="সার্চ মুছুন"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Quick Filter Status Badges */}
        <div className="flex items-center gap-1.5 pb-1 md:pb-0 text-xs shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
              statusFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title={`সব অর্ডার (${localOrders.length})`}
          >
            <i className="fa-solid fa-list"></i>
          </button>
          <button
            onClick={() => setStatusFilter('Processing')}
            className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
              statusFilter === 'Processing'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title={`Processing (${localOrders.filter(o => o.status && o.status.toLowerCase() === 'processing').length})`}
          >
            <i className="fa-solid fa-spinner animate-spin"></i>
          </button>
          <button
            onClick={() => setStatusFilter('Completed')}
            className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
              statusFilter === 'Completed'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title={`Completed (${localOrders.filter(o => o.status && o.status.toLowerCase() === 'completed').length})`}
          >
            <i className="fa-solid fa-check"></i>
          </button>
        </div>
      </div>

      {searchTerm && (
        <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 bg-slate-800/30 py-1.5 px-3 rounded-lg border border-slate-800/60">
          <span>
            🔍 <strong>&quot;{searchTerm}&quot;</strong> দিয়ে অনুসন্ধান: {filteredOrders.length} টি অর্ডার পাওয়া গেছে
          </span>
          <button
            onClick={() => setSearchTerm('')}
            className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
          >
            সার্চ ক্লিয়ার করুন
          </button>
        </div>
      )}

      {lastPollTime && (
        <div className="text-[10px] text-slate-500 flex justify-between items-center px-1">
          <span>সর্বশেষ ব্যাকগ্রাউন্ড চেক: {lastPollTime.toLocaleTimeString('bn-BD')}</span>
          <span className="text-slate-400">প্রতি ৬০ সেকেন্ডে স্বয়ংক্রিয়ভাবে Processing স্ট্যাটাস চেক হয়</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <th className="p-2.5">আইডি</th>
              <th className="p-2.5">Upstream</th>
              <th className="p-2.5">সার্ভিস</th>
              <th className="p-2.5">পরিমাণ</th>
              <th className="p-2.5">চার্জ</th>
              <th className="p-2.5">স্ট্যাটাস</th>
              <th className="p-2.5">একশন</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-300 divide-y divide-slate-800/40">
            {filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-slate-800/30">
                <td className="p-2.5 font-bold text-emerald-400">{o.id}</td>
                <td className="p-2.5 font-mono text-[10px] text-slate-400">{o.upstreamId || '-'}</td>
                <td className="p-2.5 truncate max-w-[150px]" title={o.serviceName || '-'}>{o.serviceName || '-'}</td>
                <td className="p-2.5 font-semibold">{(o.quantity || 0).toLocaleString()}</td>
                <td className="p-2.5 font-semibold text-emerald-300">৳{o.charge !== undefined && o.charge !== null ? (Number(o.charge) || 0).toFixed(2) : '0.00'}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                    o.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : o.status === 'Processing'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {o.status === 'Processing' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                    {o.status}
                  </span>
                </td>
                <td className="p-2.5">
                  {o.upstreamId && (
                    <button 
                      onClick={() => checkStatus(o)} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shadow-sm"
                    >
                      চেক
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  {searchTerm ? (
                    <div className="space-y-2">
                      <p className="text-slate-400 font-medium">
                        &quot;{searchTerm}&quot; দিয়ে কোনো অর্ডার পাওয়া যায়নি।
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg font-bold border border-slate-700 cursor-pointer inline-flex items-center gap-1"
                      >
                        <i className="fa-solid fa-rotate-left"></i> সার্চ রিসেট করুন
                      </button>
                    </div>
                  ) : (
                    'কোনো অর্ডার পাওয়া যায়নি।'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
