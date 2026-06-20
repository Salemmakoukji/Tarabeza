import { useLocation, Link } from 'react-router';
import { LayoutGrid, UtensilsCrossed, QrCode, Settings, LogOut, X, CreditCard, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';
import Logo from '../logo';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const pathname = location.pathname;

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutGrid },
    { name: 'Menu Builder', href: '/dashboard/menu', icon: UtensilsCrossed },
    { name: 'Customize Menu', href: '/dashboard/customize', icon: Palette },
    { name: 'QR Code', href: '/dashboard/qr', icon: QrCode },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0B0F19] border-r border-slate-800/80 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-0 -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Logo variant="white" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-800 lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/auth/logout"
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
