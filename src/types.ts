export interface Order {
  id: string;
  upstreamId?: string;
  date: string;
  category: string;
  serviceName: string;
  link: string;
  quantity: number;
  charge: number;        // মোট ইউজার চার্জ (User Paid)
  providerCost?: number; // মাদার প্যানেলের খরচ (Provider Cost)
  profit?: number;       // আমাদের অর্জিত লাভ (Our Net Profit)
  status: string;
}

export interface FundRequest {
  id: string;
  userCode: string;
  date: string;
  method: string;
  amount: number;
  trxId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ServiceItem {
  id: number;
  service?: number;
  category: string;
  name: string;
  rateUsd?: number;
  providerRateUsd?: number;
  providerRateBdt: number; // মাদার প্যানেলের বেস রেট প্রতি ১০০০
  rateBdt: number;         // আমাদের বিক্রয় রেট (মাদার প্যানেল রেট + লাভ)
  profitMarginBdt?: number;// প্রতি ১০০০ এ লাভ (ডিফল্ট ১০৳)
  min: number;
  max: number;
}

export interface AdminUserItem {
  id: string;
  code: string;
  name: string;
  balance: number;
  totalDeposit: number;
  ordersCount: number;
  referredBy: string;
  referredCount: number;
  refEarnings: number;
  status: 'Online' | 'Active';
  joinedDate: string;
}

export interface PaymentNumbers {
  bkash: string;
  nagad: string;
  binance: string;
  bybit: string;
}

export interface SupportMessage {
  id: string;
  userCode: string;
  date: string;
  message: string;
  status: 'Pending' | 'Replied';
}
