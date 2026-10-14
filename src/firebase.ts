import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  push, 
  update, 
  remove, 
  off,
  DatabaseReference,
  DataSnapshot
} from 'firebase/database';
import { FundRequest, Order, AdminUserItem, PaymentNumbers, SupportMessage } from './types';

export const firebaseConfig = {
  apiKey: "AIzaSyATKtnmrsE9ZPGO_WOo3-DzOIhXCDqSonw",
  authDomain: "mdesa1111.firebaseapp.com",
  databaseURL: "https://mdesa1111-default-rtdb.firebaseio.com",
  projectId: "mdesa1111",
  storageBucket: "mdesa1111.firebasestorage.app",
  messagingSenderId: "762017291021",
  appId: "1:762017291021:web:6f9882224d77d7df3eae44"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);

// ==========================================
// 💳 DEPOSITS (ডিপোজিট / ফান্ড রিকোয়েস্ট)
// ==========================================

/**
 * Save or submit a new deposit request to Firebase Realtime Database
 */
export async function dbSaveFundRequest(request: FundRequest): Promise<void> {
  try {
    const requestRef = ref(db, `fund_requests/${request.id}`);
    await set(requestRef, request);
  } catch (error) {
    console.error('Firebase RTDB Save Deposit Error:', error);
    throw error;
  }
}

/**
 * Update an existing deposit request (e.g. Approved or Rejected by Admin)
 */
export async function dbUpdateFundRequestStatus(
  id: string, 
  status: 'Approved' | 'Rejected' | 'Pending',
  reviewedAt?: string
): Promise<void> {
  try {
    const requestRef = ref(db, `fund_requests/${id}`);
    await update(requestRef, {
      status,
      reviewedAt: reviewedAt || new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase RTDB Update Deposit Status Error:', error);
    throw error;
  }
}

/**
 * Real-time listener for all deposit / fund requests
 */
export function subscribeToFundRequests(callback: (requests: FundRequest[]) => void) {
  const requestsRef = ref(db, 'fund_requests');
  const unsubscribe = onValue(
    requestsRef, 
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: FundRequest[] = Object.values(data);
        // Sort newest first
        list.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
        callback(list);
      } else {
        callback([]);
      }
    },
    (err) => {
      console.warn('Firebase RTDB deposits listener error:', err.message);
    }
  );
  return () => off(requestsRef, 'value', unsubscribe);
}

// ==========================================
// 👥 USERS & BALANCE (ইউজার ও ব্যালেন্স)
// ==========================================

/**
 * Sync user profile to Realtime Database
 */
export async function dbSaveUser(user: AdminUserItem): Promise<void> {
  try {
    const userRef = ref(db, `users/${user.code}`);
    await set(userRef, user);
  } catch (error) {
    console.error('Firebase RTDB Save User Error:', error);
  }
}

/**
 * Update specific fields for a user (e.g. balance adjustment)
 */
export async function dbUpdateUser(code: string, updates: Partial<AdminUserItem>): Promise<void> {
  try {
    const userRef = ref(db, `users/${code}`);
    await update(userRef, updates);
  } catch (error) {
    console.error('Firebase RTDB Update User Error:', error);
  }
}

/**
 * Real-time listener for all users (for Admin & referral counters)
 */
export function subscribeToUsers(callback: (users: AdminUserItem[]) => void) {
  const usersRef = ref(db, 'users');
  const unsubscribe = onValue(
    usersRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: AdminUserItem[] = Object.values(data);
        callback(list);
      } else {
        callback([]);
      }
    },
    (err) => {
      console.warn('Firebase RTDB users listener error:', err.message);
    }
  );
  return () => off(usersRef, 'value', unsubscribe);
}

/**
 * Real-time listener for a single user's balance and info
 */
export function subscribeToSingleUser(code: string, callback: (user: AdminUserItem | null) => void) {
  const userRef = ref(db, `users/${code}`);
  const unsubscribe = onValue(
    userRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    (err) => {
      console.warn('Firebase RTDB single user listener error:', err.message);
    }
  );
  return () => off(userRef, 'value', unsubscribe);
}

// ==========================================
// 🎁 REFERRALS (রেফারেল ট্র্যাকিং ও কমিশন)
// ==========================================

export interface ReferralRecord {
  id: string;
  referrerCode: string;
  referredUserCode: string;
  referrerBonus: number;
  newUserBonus: number;
  timestamp: string;
}

/**
 * Register a successful referral in RTDB and credit both users
 */
export async function dbRecordReferral(
  referrerCode: string,
  newUserCode: string,
  referrerBonus: number,
  newUserBonus: number
): Promise<void> {
  try {
    const refId = `ref_${referrerCode}_${newUserCode}`;
    const referralRef = ref(db, `referrals/${refId}`);
    
    // Check if already registered
    const existingSnap = await get(referralRef);
    if (existingSnap.exists()) {
      return; // Already processed
    }

    const record: ReferralRecord = {
      id: refId,
      referrerCode,
      referredUserCode: newUserCode,
      referrerBonus,
      newUserBonus,
      timestamp: new Date().toISOString()
    };
    await set(referralRef, record);

    // Update Referrer's count & earnings
    const referrerRef = ref(db, `users/${referrerCode}`);
    const referrerSnap = await get(referrerRef);
    if (referrerSnap.exists()) {
      const rData = referrerSnap.val() as AdminUserItem;
      const newBal = (rData.balance || 0) + referrerBonus;
      const newCount = (rData.referredCount || 0) + 1;
      const newEarnings = (rData.refEarnings || 0) + referrerBonus;
      await update(referrerRef, {
        balance: parseFloat(newBal.toFixed(2)),
        referredCount: newCount,
        refEarnings: parseFloat(newEarnings.toFixed(2))
      });
    }
  } catch (error) {
    console.error('Firebase RTDB Record Referral Error:', error);
  }
}

/**
 * Real-time listener for referrals of a specific referrer
 */
export function subscribeToUserReferrals(userCode: string, callback: (referrals: ReferralRecord[]) => void) {
  const referralsRef = ref(db, 'referrals');
  const unsubscribe = onValue(
    referralsRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const all: ReferralRecord[] = Object.values(data);
        const userRefs = all.filter(r => r.referrerCode === userCode);
        callback(userRefs);
      } else {
        callback([]);
      }
    },
    (err) => {
      console.warn('Firebase RTDB referrals listener error:', err.message);
    }
  );
  return () => off(referralsRef, 'value', unsubscribe);
}

// ==========================================
// 📦 ORDERS (অর্ডার হিস্টোরি ও ট্র্যাকিং)
// ==========================================

/**
 * Save new order to Firebase RTDB
 */
export async function dbSaveOrder(order: Order): Promise<void> {
  try {
    const orderRef = ref(db, `orders/${order.id}`);
    await set(orderRef, order);
  } catch (error) {
    console.error('Firebase RTDB Save Order Error:', error);
  }
}

/**
 * Update order status in Firebase RTDB
 */
export async function dbUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    await update(orderRef, { status });
  } catch (error) {
    console.error('Firebase RTDB Update Order Status Error:', error);
  }
}

/**
 * Real-time listener for all orders
 */
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const ordersRef = ref(db, 'orders');
  const unsubscribe = onValue(
    ordersRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: Order[] = Object.values(data);
        list.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
        callback(list);
      } else {
        callback([]);
      }
    },
    (err) => {
      console.warn('Firebase RTDB orders listener error:', err.message);
    }
  );
  return () => off(ordersRef, 'value', unsubscribe);
}

// ==========================================
// ⚙️ SETTINGS & PAYMENT NUMBERS (সেটিংস)
// ==========================================

export async function dbSavePaymentNumbers(paymentNumbers: PaymentNumbers): Promise<void> {
  try {
    const payRef = ref(db, 'settings/payment_numbers');
    await set(payRef, paymentNumbers);
  } catch (error) {
    console.error('Firebase RTDB Save Payment Numbers Error:', error);
  }
}

export function subscribeToPaymentNumbers(callback: (numbers: PaymentNumbers | null) => void) {
  const payRef = ref(db, 'settings/payment_numbers');
  const unsubscribe = onValue(
    payRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    (err) => {
      console.warn('Firebase RTDB payment numbers listener error:', err.message);
    }
  );
  return () => off(payRef, 'value', unsubscribe);
}

export async function dbSaveReferralSettings(settings: { refBonusUser: number; refBonusNew: number; refText: string }): Promise<void> {
  try {
    const refSettingsRef = ref(db, 'settings/referral');
    await set(refSettingsRef, settings);
  } catch (error) {
    console.error('Firebase RTDB Save Referral Settings Error:', error);
  }
}

export function subscribeToReferralSettings(callback: (settings: { refBonusUser: number; refBonusNew: number; refText: string } | null) => void) {
  const refSettingsRef = ref(db, 'settings/referral');
  const unsubscribe = onValue(
    refSettingsRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    (err) => {
      console.warn('Firebase RTDB referral settings listener error:', err.message);
    }
  );
  return () => off(refSettingsRef, 'value', unsubscribe);
}

// ==========================================
// 💬 SUPPORT SYSTEM (সাপোর্ট মেসেজ)
// ==========================================

export async function dbSaveSupportMessage(message: SupportMessage): Promise<void> {
  try {
    const msgRef = ref(db, `support_messages/${message.id}`);
    await set(msgRef, message);
  } catch (error) {
    console.error('Firebase RTDB Save Support Message Error:', error);
  }
}

export function subscribeToSupportMessages(callback: (messages: SupportMessage[]) => void) {
  const msgsRef = ref(db, 'support_messages');
  const unsubscribe = onValue(
    msgsRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: SupportMessage[] = Object.values(data);
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(list);
      } else {
        callback([]);
      }
    },
    (err) => {
      console.warn('Firebase RTDB support messages listener error:', err.message);
    }
  );
  return () => off(msgsRef, 'value', unsubscribe);
}
