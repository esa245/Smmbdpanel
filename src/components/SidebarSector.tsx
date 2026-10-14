import React from 'react';

interface SidebarSectorProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleAdminAccess: () => void;
}

export const SidebarSector: React.FC<SidebarSectorProps> = ({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  handleAdminAccess
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: 'fa-house-chimney' },
    { id: 'new-order', label: 'নতুন অর্ডার', icon: 'fa-cart-plus' },
    { id: 'orders', label: 'অর্ডার হিস্টোরি', icon: 'fa-clock-rotate-left' },
    { id: 'balance-add', label: 'ব্যালেন্স অ্যাড ও হিস্টোরি', icon: 'fa-wallet' },
    { id: 'referral', label: 'রেফার ও ইনকাম', icon: 'fa-share-nodes' },
    { id: 'support', label: 'সাপোর্ট সেন্টার', icon: 'fa-headset' }
  ];

  return (
    <div className={`w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 text-white fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-4 text-xl font-black border-b border-slate-800 flex items-center justify-between">
        <div 
          onClick={handleAdminAccess}
          title="এডমিন প্যানেল (লোগোতে ক্লিক করে প্রবেশ)"
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition select-none"
        >
          <i className="fa-solid fa-rocket text-emerald-400"></i> SMM BD PRO
        </div>
        <button className="md:hidden text-gray-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav className="p-3 space-y-1.5">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeSection === item.id 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' 
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-4 text-center`}></i> {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
