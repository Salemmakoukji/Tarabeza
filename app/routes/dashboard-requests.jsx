import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { BellRing, ShoppingBag, Phone, CreditCard, HelpCircle, Bell, CheckCircle, Clock, Loader2, Eye, X, ChefHat, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { cn, formatPrice } from '../lib/utils';
import { playNotificationSound } from '../lib/notification-sound';
import { useEffect } from 'react';

const PAGE_SIZE = 20;

const TABS = [
  { value: 'calls', label: 'Waiter Calls', icon: BellRing },
  { value: 'orders', label: 'Orders', icon: ShoppingBag },
];

export default function DashboardRequests() {
  const { profile } = useOutletContext();
  const [activeTab, setActiveTab] = useState('calls');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Requests</h1>
          <p className="text-sm text-slate-400 mt-1">Manage incoming waiter calls and table orders in real time</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === tab.value
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'calls' && <CallsView profile={profile} />}
      {activeTab === 'orders' && <OrdersView profile={profile} />}
    </div>
  );
}

/* ── Waiter Calls Tab ── */

const CALL_TYPES = { service: 'Service', bill: 'Bill', help: 'Help' };
const CALL_ICONS = { service: Bell, bill: CreditCard, help: HelpCircle };
const CALL_COLORS = {
  service: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  bill: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  help: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
};

function CallsView({ profile }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [newCallToast, setNewCallToast] = useState(null);

  const fetchCalls = async (pageNum = 0, append = false) => {
    if (!profile?.id) return;
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase
      .from('waiter_calls')
      .select('*, restaurant_tables!left(table_number, table_name)')
      .eq('restaurant_id', profile.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    if (data) {
      if (append) {
        setCalls(prev => [...prev, ...data]);
      } else {
        setCalls(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setPage(0);
    setCalls([]);
    setHasMore(true);
    fetchCalls(0);
  }, [profile?.id, statusFilter]);

  useEffect(() => {
    if (!profile?.id) return;
    const subscription = supabase
      .channel('waiter-calls-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${profile.id}` },
        (payload) => {
          const newCall = payload.new;
          setCalls(prev => [newCall, ...prev]);
          if (newCall.status === 'pending') {
            setNewCallToast(newCall);
            playNotificationSound();
            setTimeout(() => setNewCallToast(null), 5000);
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
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, ...update } : c));
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Waiter Calls</h2>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <BellRing className="h-5 w-5 text-orange-400 animate-pulse" />
            <span className="text-orange-400 font-bold text-sm">{pendingCount} pending</span>
          </div>
        )}
      </div>

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
                          {tableInfo?.table_name && <span className="text-slate-400 font-normal"> — {tableInfo.table_name}</span>}
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
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeAgo(call.created_at)}</span>
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

      {hasMore && !loading && calls.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setLoadingMore(true);
              const nextPage = page + 1;
              setPage(nextPage);
              fetchCalls(nextPage, true);
            }}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            Load More
          </button>
        </div>
      )}

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
              <button onClick={() => setNewCallToast(null)} className="text-slate-500 hover:text-white transition-colors">
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
              <button onClick={() => setNewCallToast(null)} className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Orders Tab ── */

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'preparing', label: 'Preparing', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'ready', label: 'Ready', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'delivered', label: 'Delivered', color: 'bg-slate-800 text-slate-500 border-slate-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];

const STATUS_ICONS = {
  pending: Clock, confirmed: CheckCircle, preparing: ChefHat, ready: Bell, delivered: CheckCircle, cancelled: X,
};

const STATUS_ACTIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['delivered'],
};

function OrdersView({ profile }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [newOrderToast, setNewOrderToast] = useState(null);

  const fetchOrders = async (pageNum = 0, append = false) => {
    if (!profile?.id) return;
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase
      .from('orders')
      .select('*, restaurant_tables!left(table_number, table_name)')
      .eq('restaurant_id', profile.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    if (data) {
      if (append) {
        setOrders(prev => [...prev, ...data]);
      } else {
        setOrders(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setPage(0);
    setOrders([]);
    setHasMore(true);
    fetchOrders(0);
  }, [profile?.id, statusFilter]);

  useEffect(() => {
    if (!profile?.id) return;
    const subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${profile.id}` },
        (payload) => {
          const newOrder = payload.new;
          setOrders(prev => [newOrder, ...prev]);
          if (newOrder.status === 'pending') {
            setNewOrderToast(newOrder);
            playNotificationSound();
            setTimeout(() => setNewOrderToast(null), 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [profile?.id]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    setActionLoading(null);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setOrderItems(data || []);
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const filters = [
    { value: 'pending', label: `Pending (${orders.filter(o => o.status === 'pending').length})` },
    { value: 'confirmed', label: `Confirmed (${orders.filter(o => o.status === 'confirmed').length})` },
    { value: 'preparing', label: `Preparing (${orders.filter(o => o.status === 'preparing').length})` },
    { value: 'ready', label: `Ready (${orders.filter(o => o.status === 'ready').length})` },
    { value: 'delivered', label: 'Delivered' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Orders</h2>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <ShoppingBag className="h-5 w-5 text-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold text-sm">{pendingCount} new</span>
          </div>
        )}
      </div>

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
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <ShoppingBag className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">No orders yet</h3>
          <p className="text-sm text-slate-500">When customers order from their table, orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusMeta = ORDER_STATUSES.find(s => s.value === order.status);
            const StatusIcon = STATUS_ICONS[order.status] || Clock;
            const tableInfo = order.restaurant_tables;
            const actions = STATUS_ACTIONS[order.status] || [];
            return (
              <div
                key={order.id}
                className={cn(
                  "bg-slate-900/60 border rounded-xl p-5 transition-all duration-200",
                  order.status === 'pending' ? "border-amber-500/30" : "border-slate-700"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border",
                      statusMeta?.color || "text-slate-400 bg-slate-800 border-slate-700"
                    )}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-white">
                          {tableInfo ? `Table ${tableInfo.table_number}` : 'Takeaway'}
                          {tableInfo?.table_name && <span className="text-slate-400 font-normal"> — {tableInfo.table_name}</span>}
                        </h3>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                          statusMeta?.color || "bg-slate-800 text-slate-500"
                        )}>
                          {order.status}
                        </span>
                        <span className="text-xs font-bold text-orange-400">{formatPrice(order.total_amount, profile?.currency || 'USD')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        {order.customer_name && <span className="font-semibold">{order.customer_name}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeAgo(order.created_at)}</span>
                      </div>
                      {order.special_notes && <p className="text-xs text-slate-500 mt-1 italic">"{order.special_notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                    {actions.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleUpdateStatus(order.id, action)}
                        disabled={actionLoading === order.id}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5",
                          action === 'cancelled'
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        )}
                      >
                        {actionLoading === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        <span className="capitalize">{action}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Order #{selectedOrder.id.slice(0, 8)}</h2>
                <p className="text-sm text-slate-400">
                  {selectedOrder.restaurant_tables ? `Table ${selectedOrder.restaurant_tables.table_number}` : 'Takeaway'}
                  {selectedOrder.customer_name && ` — ${selectedOrder.customer_name}`}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">x{item.quantity}</span>
                      <h4 className="text-sm font-semibold text-white truncate">{item.item_name}</h4>
                    </div>
                    {item.notes && <p className="text-xs text-slate-500 mt-1 italic">"{item.notes}"</p>}
                  </div>
                  <span className="text-sm font-bold text-slate-200 shrink-0 ml-4">
                    {formatPrice(item.unit_price * item.quantity, profile?.currency || 'USD')}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-800 shrink-0 space-y-4">
              {selectedOrder.special_notes && (
                <div className="bg-slate-800/50 rounded-xl px-4 py-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Special Notes</span>
                  <p className="text-sm text-slate-200 mt-1">{selectedOrder.special_notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">Total</span>
                <span className="text-lg font-bold text-orange-400">{formatPrice(selectedOrder.total_amount, profile?.currency || 'USD')}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {hasMore && !loading && orders.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setLoadingMore(true);
              const nextPage = page + 1;
              setPage(nextPage);
              fetchOrders(nextPage, true);
            }}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            Load More
          </button>
        </div>
      )}

      {newOrderToast && (
        <div className="fixed bottom-6 left-[50%] translate-x-[-50%] z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 min-w-[320px]">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">New Order</p>
              <p className="text-xs text-slate-400">
                {newOrderToast.customer_name
                  ? `${newOrderToast.customer_name} — ${formatPrice(newOrderToast.total_amount, profile?.currency || 'USD')}`
                  : formatPrice(newOrderToast.total_amount, profile?.currency || 'USD')}
              </p>
            </div>
            <button onClick={() => setNewOrderToast(null)} className="h-8 w-8 rounded-full bg-slate-700/50 flex items-center justify-center hover:bg-slate-700 transition-colors shrink-0">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
