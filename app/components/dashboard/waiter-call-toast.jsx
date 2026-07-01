import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export default function WaiterCallToast({ restaurantId, onAcknowledge }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    const subscription = supabase
      .channel('waiter-call-toast')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waiter_calls', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          const call = payload.new;
          let tableLabel = 'Unknown Table';
          if (call.table_id) {
            const { data } = await supabase.from('restaurant_tables').select('table_number').eq('id', call.table_id).single();
            if (data) tableLabel = `Table ${data.table_number}`;
          }
          setToast({ ...call, tableLabel });
          setVisible(true);
          setTimeout(() => setVisible(false), 8000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [restaurantId]);

  if (!visible || !toast) return null;

  const callLabels = { service: 'Service', bill: 'Bill', help: 'Help' };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-orange-500/10 max-w-sm">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-orange-400 animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">New Waiter Call</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {callLabels[toast.call_type] || 'Service'} request from {toast.tableLabel}
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={async () => {
              await supabase.from('waiter_calls').update({ status: 'acknowledged' }).eq('id', toast.id);
              setVisible(false);
              if (onAcknowledge) onAcknowledge(toast.id);
            }}
            className="flex-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-all"
          >
            Acknowledge
          </button>
          <button
            onClick={() => setVisible(false)}
            className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
