import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { Plus, Trash2, QrCode, Table2, Loader2, Download, Check } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { cn } from '../lib/utils';

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);

  if (intent === 'add-table') {
    const restaurantId = formData.get('restaurantId');
    const tableNumber = formData.get('tableNumber');
    const tableName = formData.get('tableName') || null;
    const capacity = parseInt(formData.get('capacity'), 10) || 2;
    const { error } = await sb.from('restaurant_tables').insert({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      table_name: tableName,
      capacity
    });
    if (error) return { error: error.message };
    return { success: true };
  }

  if (intent === 'delete-table') {
    const id = formData.get('tableId');
    const { error } = await sb.from('restaurant_tables').delete().eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  }

  if (intent === 'toggle-table') {
    const id = formData.get('tableId');
    const isActive = formData.get('isActive') === 'true';
    const { error } = await sb.from('restaurant_tables').update({ is_active: isActive }).eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  }

  return { error: 'Unknown intent' };
}

export default function DashboardTables() {
  const { profile } = useOutletContext();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [qrModalTable, setQrModalTable] = useState(null);
  const [copiedQr, setCopiedQr] = useState(false);

  const fetchTables = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', profile.id)
      .order('table_number', { ascending: true });
    if (data) setTables(data);
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, [profile?.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('restaurant_tables').insert({
      restaurant_id: profile.id,
      table_number: newTableNum.trim(),
      table_name: newTableName.trim() || null,
      capacity: newCapacity
    });
    setSubmitting(false);
    if (error) { alert(error.message); return; }
    setNewTableNum('');
    setNewTableName('');
    setNewCapacity(2);
    setShowAddModal(false);
    fetchTables();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setDeleteConfirm(null);
    fetchTables();
  };

  const handleToggle = async (id, currentActive) => {
    await supabase.from('restaurant_tables').update({ is_active: !currentActive }).eq('id', id);
    fetchTables();
  };

  const getTableUrl = (table) => {
    return `${window.location.origin}/menu/${profile.slug}?table=${table.id}&qr=true`;
  };

  const handleBulkDownloadQr = async () => {
    const activeTables = tables.filter(t => t.is_active);
    if (activeTables.length === 0) return;
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const cols = 3;
    const rows = 3;
    const cellW = (pageW - margin * 2) / cols;
    const cellH = (pageH - margin * 2) / rows;
    const QR = (await import('qrcode')).default;

    for (let i = 0; i < activeTables.length; i++) {
      const table = activeTables[i];
      const col = i % cols;
      const row = Math.floor(i % (cols * rows) / cols);
      const pageIdx = Math.floor(i / (cols * rows));
      if (i > 0 && i % (cols * rows) === 0) doc.addPage();
      const x = margin + col * cellW;
      const y = margin + row * cellH;

      try {
        const qrDataUrl = await QR.toDataURL(getTableUrl(table), { width: 200, margin: 1 });
        const qrSize = Math.min(cellW, cellH) - 20;
        const qrX = x + (cellW - qrSize) / 2;
        const qrY = y + 10;
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setFontSize(10);
        doc.text(`Table ${table.table_number}`, pageW / 2, qrY + qrSize + 8, { align: 'center' });
        if (table.table_name) {
          doc.setFontSize(8);
          doc.text(table.table_name, pageW / 2, qrY + qrSize + 16, { align: 'center' });
        }
      } catch (e) {
        console.error('QR generation error:', e);
      }
    }
    doc.save(`${profile.slug}-table-qr-codes.pdf`);
  };

  const handleCopyQr = (table) => {
    navigator.clipboard.writeText(getTableUrl(table));
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Table Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage restaurant tables and generate per-table QR codes</p>
        </div>
        <div className="flex items-center gap-3">
          {tables.filter(t => t.is_active).length > 0 && (
            <button
              onClick={handleBulkDownloadQr}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700"
            >
              <Download className="h-4 w-4" />
              <span>Export QR Codes</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Table2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">No tables yet</h3>
          <p className="text-sm text-slate-500 mb-6">Add your first table to generate per-table QR codes</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Table</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "bg-slate-900/60 border rounded-xl p-5 transition-all duration-200",
                table.is_active ? "border-slate-700 hover:border-slate-600" : "border-slate-800/50 opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold",
                    table.is_active ? "bg-orange-500/10 text-orange-400" : "bg-slate-800 text-slate-500"
                  )}>
                    {table.table_number}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Table {table.table_number}</h3>
                    {table.table_name && (
                      <p className="text-xs text-slate-400">{table.table_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {table.is_active ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <span>Capacity: {table.capacity} {table.capacity === 1 ? 'person' : 'people'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getTableUrl(table));
                    setCopiedQr(true);
                    setTimeout(() => setCopiedQr(false), 2000);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all duration-200"
                >
                  {copiedQr ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  ) : (
                    <><QrCode className="h-3.5 w-3.5" /><span>Copy URL</span></>
                  )}
                </button>
                <button
                  onClick={() => setQrModalTable(table)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all duration-200"
                  title="View QR"
                >
                  <QrCode className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(table.id, table.is_active)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                    table.is_active
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                  )}
                >
                  {table.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(table.id)}
                  className="px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add New Table</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Table Number *</label>
                <input
                  type="text"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="e.g. 5, A3, Patio-1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Table Name (optional)</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Window Table, VIP"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 2)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTableNum.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Add Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-1">Table {qrModalTable.table_number}</h3>
            {qrModalTable.table_name && (
              <p className="text-sm text-slate-400 mb-4">{qrModalTable.table_name}</p>
            )}
            <div className="bg-white p-4 rounded-2xl inline-block mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getTableUrl(qrModalTable))}`}
                alt={`QR for Table ${qrModalTable.table_number}`}
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-slate-400 mb-4 break-all">{getTableUrl(qrModalTable)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setQrModalTable(null)}
                className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={() => handleCopyQr(qrModalTable)}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all duration-200"
              >
                {copiedQr ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">Delete Table?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
