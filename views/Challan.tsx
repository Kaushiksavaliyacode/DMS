import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES, PaymentType, ChallanType } from '../types';
import { Plus, Trash2, Receipt, Save, RotateCcw, User, Filter, X, CheckCircle2, Clock, Pencil, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface ChallanProps {
  data: ChallanEntry[];
  onAdd?: (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onUpdate?: (id: string, entry: Partial<ChallanEntry>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  isAdmin?: boolean;
}

type FilterRange = 'today' | '7days' | '30days' | 'custom';
type EntryMode = 'unpaid' | 'cash' | 'job';
type SummaryFilter = 'all' | 'cash' | 'unpaid';

export const ChallanView: React.FC<ChallanProps> = ({ data, onAdd, onUpdate, onDelete, isAdmin = false }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [entryMode, setEntryMode] = useState<EntryMode>('unpaid');
  const [items, setItems] = useState<ChallanItem[]>([]);
  const [itemSize, setItemSize] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const [filterRange, setFilterRange] = useState<FilterRange>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const summary = useMemo(() => {
      return data.reduce((acc, curr) => {
          if (curr.paymentType === 'cash') return { ...acc, received: acc.received + curr.grandTotal };
          if (curr.paymentType === 'credit' && curr.challanType !== 'jobwork') return { ...acc, receivable: acc.receivable + curr.grandTotal };
          return acc;
      }, { receivable: 0, received: 0 });
  }, [data]);

  const filteredData = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      return data.filter(d => {
          if (searchTerm && !d.challanNo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
          if (summaryFilter === 'cash' && d.paymentType !== 'cash') return false;
          if (summaryFilter === 'unpaid' && (d.paymentType !== 'credit' || d.challanType === 'jobwork')) return false;
          if (!searchTerm) {
              const entryDate = new Date(d.date);
              entryDate.setHours(0,0,0,0);
              if (filterRange === 'today') return entryDate.getTime() === today.getTime();
              if (filterRange === '7days') {
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  return entryDate >= sevenDaysAgo && entryDate <= today;
              }
              if (filterRange === '30days') {
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  return entryDate >= thirtyDaysAgo && entryDate <= today;
              }
              if (filterRange === 'custom') return d.date === customDate;
          }
          return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filterRange, customDate, searchTerm, summaryFilter]);

  const addItem = () => {
      if (!itemSize || !itemWeight) return;
      if (entryMode !== 'job' && !itemPrice) return;
      const weight = parseFloat(itemWeight);
      const price = parseFloat(itemPrice) || 0;
      const newItem: ChallanItem = {
          id: crypto.randomUUID(),
          size: itemSize,
          weight,
          price,
          total: weight * price
      };
      setItems([...items, newItem]);
      setItemSize('');
      setItemWeight('');
      setItemPrice('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleEdit = (entry: ChallanEntry) => {
      setEditingId(entry.id);
      setChallanNo(entry.challanNo);
      setDate(entry.date);
      setPartyName(entry.partyName);
      setItems(entry.items);
      if (entry.paymentType === 'cash') setEntryMode('cash');
      else if (entry.challanType === 'jobwork') setEntryMode('job');
      else setEntryMode('unpaid');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
      setEditingId(null);
      setChallanNo('');
      setItems([]);
      setPartyName('');
      setEntryMode('unpaid');
      setItemSize('');
      setItemWeight('');
      setItemPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!partyName || items.length === 0) {
          alert("Party & items required");
          return;
      }
      let pType: PaymentType = entryMode === 'cash' ? 'cash' : 'credit';
      let cType: ChallanType = entryMode === 'job' ? 'jobwork' : 'debit_note';
      const entryData = { challanNo, date, partyName, paymentType: pType, challanType: cType, items, grandTotal };
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
          if (editingId && onUpdate) await onUpdate(editingId, entryData);
          else if (onAdd) await onAdd(entryData);
          resetForm();
      } catch (e: any) {
          let msg = e.message || 'Unknown error';
          if (msg.includes("Missing or insufficient permissions")) msg = "PERMISSION ERROR: Check Firebase Rules";
          setErrorMsg(msg);
          alert(msg);
      } finally {
          setIsSubmitting(false);
      }
  };

  const toggleSummaryFilter = (filter: SummaryFilter) => setSummaryFilter(summaryFilter === filter ? 'all' : filter);

  return (
    <div className="w-full pb-20 space-y-4 font-poppins text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => toggleSummaryFilter('cash')} className={`rounded-xl border p-3 shadow-sm flex items-center justify-between transition-all ${summaryFilter === 'cash' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-emerald-100'}`}>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Cash Received</p>
                    <h3 className="text-lg font-bold text-emerald-700">{Math.floor(summary.received).toLocaleString()}</h3>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </button>
            <button onClick={() => toggleSummaryFilter('unpaid')} className={`rounded-xl border p-3 shadow-sm flex items-center justify-between transition-all ${summaryFilter === 'unpaid' ? 'bg-amber-50 border-amber-500' : 'bg-white border-amber-100'}`}>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-amber-600 uppercase">Unpaid Credit</p>
                    <h3 className="text-lg font-bold text-amber-700">{Math.floor(summary.receivable).toLocaleString()}</h3>
                </div>
                <Clock className="w-5 h-5 text-amber-600" />
            </button>
        </div>

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-4`}>
            {!isAdmin && (
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm">{editingId ? 'Edit' : 'New'} Transaction</h3>
                            {editingId && <button onClick={resetForm} className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>}
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Challan #</label>
                                    <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none" placeholder="Auto" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Party</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                                    <input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full pl-8 px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none" placeholder="Select Party" />
                                    <datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p} />)}</datalist>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {['unpaid', 'cash', 'job'].map(m => (
                                    <button key={m} type="button" onClick={() => setEntryMode(m as EntryMode)} className={`py-2 rounded text-[10px] font-bold uppercase border transition-all ${entryMode === m ? (m === 'cash' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : m === 'unpaid' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-100 border-slate-300 text-slate-700') : 'bg-white border-slate-200 text-slate-500'}`}>{m}</button>
                                ))}
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <input placeholder="Size" value={itemSize} onChange={e => setItemSize(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-xs font-bold outline-none" />
                                    <input type="number" placeholder="Wt" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-xs font-bold outline-none" />
                                    {entryMode !== 'job' ? <input type="number" placeholder="Price" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-xs font-bold outline-none" /> : <div className="text-[10px] flex items-center justify-center text-slate-400 font-bold">No Price</div>}
                                </div>
                                <button type="button" onClick={addItem} className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                                {items.length > 0 && (
                                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200 text-[10px]">
                                                <span className="font-bold text-slate-700">{item.size} ({item.weight.toFixed(3)}kg)</span>
                                                <div className="flex items-center gap-2"><span className="font-bold">{Math.floor(item.total).toLocaleString()}</span><button type="button" onClick={() => removeItem(item.id)}><Trash2 className="w-3 h-3 text-red-400" /></button></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded shadow flex items-center justify-center gap-2 text-sm disabled:opacity-70">{isSubmitting ? 'Saving...' : 'Save Record'}</button>
                        </form>
                    </div>
                </div>
            )}

            <div className={isAdmin ? "lg:col-span-1" : "lg:col-span-8"}>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
                    <div className="p-3 border-b border-slate-200 flex flex-col xl:flex-row gap-3 justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <h3 className="font-bold text-slate-800 text-sm">Challan Book</h3>
                            <div className="relative flex-1 sm:w-48">
                                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold outline-none" />
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {['today', '7days', '30days'].map(r => <button key={r} onClick={() => setFilterRange(r as FilterRange)} className={`px-2 py-1 text-[10px] font-bold rounded border ${filterRange === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}>{r === '7days' ? '7D' : r === '30days' ? '30D' : 'Today'}</button>)}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-r border-slate-200">#</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-r border-slate-200">Date</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-r border-slate-200 w-1/3">Party</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-r border-slate-200 text-right">Total</th>
                                    <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 text-center">Act</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-xs">
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-bold">No records found.</td></tr>
                                ) : (
                                    filteredData.map((row) => {
                                        let bgClass = row.paymentType === 'cash' ? "bg-emerald-50 text-emerald-800" : row.challanType === 'jobwork' ? "bg-white text-slate-700" : "bg-red-50 text-red-800";
                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr className={`${bgClass} hover:brightness-95 cursor-pointer border-b border-slate-100`} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                                                    <td className="px-3 py-2 font-bold border-r border-slate-200/50">{row.challanNo || '-'}</td>
                                                    <td className="px-3 py-2 font-bold border-r border-slate-200/50 whitespace-nowrap">{row.date}</td>
                                                    <td className="px-3 py-2 font-bold border-r border-slate-200/50 text-blue-700">{row.partyName}</td>
                                                    <td className="px-3 py-2 font-bold text-right border-r border-slate-200/50">{row.challanType === 'jobwork' ? '-' : Math.floor(row.grandTotal).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-center flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                        {!isAdmin && <button onClick={() => handleEdit(row)} className="text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>}
                                                        <button onClick={() => onDelete(row.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </td>
                                                </tr>
                                                {expandedRow === row.id && (
                                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                                        <td colSpan={5} className="px-4 py-3">
                                                            <table className="w-full bg-white border border-slate-200 rounded overflow-hidden text-[10px]">
                                                                <thead className="bg-slate-100 border-b border-slate-200">
                                                                    <tr><th className="px-2 py-1 font-bold text-slate-500">Size</th><th className="px-2 py-1 font-bold text-right text-slate-500">Weight</th><th className="px-2 py-1 font-bold text-right text-slate-500">Price</th><th className="px-2 py-1 font-bold text-right text-slate-500">Total</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {row.items.map((item, idx) => (
                                                                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                            <td className="px-2 py-1 font-bold text-slate-700">{item.size}</td>
                                                                            <td className="px-2 py-1 font-bold text-right">{item.weight.toFixed(3)}</td>
                                                                            <td className="px-2 py-1 font-bold text-right">{item.price || '-'}</td>
                                                                            <td className="px-2 py-1 font-bold text-right">{item.total ? Math.floor(item.total) : '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};