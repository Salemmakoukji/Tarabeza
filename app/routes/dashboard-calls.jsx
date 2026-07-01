import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router';
import { Bell, BellRing, CheckCircle, Clock, Loader2, Phone, CreditCard, HelpCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { cn } from '../lib/utils';

const CALL_TYPES = { service: 'Service', bill: 'Bill', help: 'Help' };
const CALL_ICONS = { service: Bell, bill: CreditCard, help: HelpCircle };
const CALL_COLORS = {
  service: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  bill: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  help: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
};

export default function DashboardCalls() {
  const { profile } = useOutletContext();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [newCallToast, setNewCallToast] = useState(null);
  const audioRef = useRef(null);

  const fetchCalls = async () => {
    if (!profile?.id) return;
    let query = supabase
      .from('waiter_calls')
      .select('*, restaurant_tables!left(table_number, table_name)')
      .eq('restaurant_id', profile.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) setCalls(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCalls();
  }, [profile?.id, statusFilter]);

  useEffect(() => {
    if (!profile?.id) return;
    const subscription = supabase
      .channel('waiter-calls-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${profile.id}` },
        (payload) => {
          const newCall = payload.new;
          fetchCalls();
          if (newCall.status === 'pending') {
            setNewCallToast(newCall);
            try { audioRef.current?.play(); } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [profile?.id]);

  const handleUpdateStatus = async (callId, newStatus) => {
    setActionLoading(callId);
    const update = { status: newStatus };
    if (newStatus === 'resolved') update.resolved_at = new Date().toISOString();
    await supabase.from('waiter_calls').update(update).eq('id', callId);
    setActionLoading(null);
    fetchCalls();
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  const pendingCount = calls.filter(c => c.status === 'pending').length;
  const filters = [
    { value: 'pending', label: `Pending (${calls.filter(c => c.status === 'pending').length})` },
    { value: 'acknowledged', label: `Acknowledged (${calls.filter(c => c.status === 'acknowledged').length})` },
    { value: 'resolved', label: 'Resolved' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH+AgH9/f3+AgH9/f3+AgH9/f3+Af4CAf39/f4CAf39/f4B/f39/gIB/f39/gIB/f39/gICAf39/gIB/f39/gICAf39/gICAf39/gICAf39/gIB/f39/gIB/f39/gIB/f39/gIB/f39/gIB/f39/gIB/f39/gIB/f39/gIB/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gIB/f39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf4B/f3+AgH9/f3+Af4B/f3+AgH+AgH9/f3+AgH9/f3+Af4B/f3+AgH9/f3+AgH9/f3+Af4B/f3+AgH+AgH9/f3+AgH9/f39/gICAf39/gICAf39/gIB/f39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICAf39/gICA" preload="none" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Waiter Calls</h1>
          <p className="text-sm text-slate-400 mt-1">Manage incoming customer requests in real time</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <BellRing className="h-5 w-5 text-orange-400 animate-pulse" />
            <span className="text-orange-400 font-bold text-sm">{pendingCount} pending</span>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              statusFilter === f.value
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Bell className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">No calls yet</h3>
          <p className="text-sm text-slate-500">When customers request service from their table, calls will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const CallIcon = CALL_ICONS[call.call_type] || Bell;
            const tableInfo = call.restaurant_tables;
            return (
              <div
                key={call.id}
                className={cn(
                  "bg-slate-900/60 border rounded-xl p-5 transition-all duration-200",
                  call.status === 'pending' ? "border-orange-500/30" : "border-slate-700"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border",
                      CALL_COLORS[call.call_type] || "text-slate-400 bg-slate-800 border-slate-700"
                    )}>
                      <CallIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-white">
                          {tableInfo ? `Table ${tableInfo.table_number}` : 'Unknown Table'}
                          {tableInfo?.table_name && (
                            <span className="text-slate-400 font-normal"> — {tableInfo.table_name}</span>
                          )}
                        </h3>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                          call.status === 'pending' ? "bg-orange-500/10 text-orange-400" :
                          call.status === 'acknowledged' ? "bg-blue-500/10 text-blue-400" :
                          "bg-slate-800 text-slate-500"
                        )}>
                          {call.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="capitalize font-semibold">{CALL_TYPES[call.call_type] || call.call_type}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(call.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {call.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(call.id, 'acknowledged')}
                        disabled={actionLoading === call.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-all duration-200 disabled:opacity-50"
                      >
                        {actionLoading === call.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        <span>Acknowledge</span>
                      </button>
                    )}
                    {call.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(call.id, 'resolved')}
                        disabled={actionLoading === call.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-all duration-200 disabled:opacity-50"
                      >
                        {actionLoading === call.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Call Toast */}
      {newCallToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-orange-500/10 max-w-sm">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-orange-400 animate-pulse shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">New Waiter Call</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CALL_TYPES[newCallToast.call_type]} request from Table {newCallToast.restaurant_tables?.table_number || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setNewCallToast(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { handleUpdateStatus(newCallToast.id, 'acknowledged'); setNewCallToast(null); }}
                className="flex-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-all"
              >
                Acknowledge
              </button>
              <button
                onClick={() => setNewCallToast(null)}
                className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
