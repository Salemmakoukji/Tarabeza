'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import { supabase } from '@/lib/supabase';

export default function DashboardLayoutClient({ children, profile, user, subscriptionInfo }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIdx, setCurrentAnnouncementIdx] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      supabase
        .from('announcements')
        .select('*')
        .or(`restaurant_id.is.null,restaurant_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setAnnouncements(data);
        });
    }
  }, [profile?.id]);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          onMenuToggle={() => setSidebarOpen(true)} 
          profile={profile} 
          subscriptionInfo={subscriptionInfo} 
        />
        {announcements.length > 0 && announcements[currentAnnouncementIdx] && (
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-500/20 px-6 py-3.5 flex items-center justify-between text-xs text-orange-300">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-orange-500 text-slate-950 px-2 py-0.5 rounded text-[9px]">
                Platform Notice
              </span>
              <strong className="text-slate-200">{announcements[currentAnnouncementIdx].title}:</strong>
              <span>{announcements[currentAnnouncementIdx].message}</span>
            </div>
            <button 
              onClick={() => {
                setAnnouncements(prev => prev.filter((_, idx) => idx !== currentAnnouncementIdx));
              }}
              className="text-orange-400 hover:text-white font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
