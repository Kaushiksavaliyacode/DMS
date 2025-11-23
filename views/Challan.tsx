import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES, PaymentType, ChallanType } from '../types';
import { Plus, Trash2, Receipt, Save, RotateCcw, User, Filter, X, CheckCircle2, Clock, Pencil, Search, RefreshCw, AlertCircle, Coins } from 'lucide-react';

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
          acc.all += curr.grandTotal;
          if (curr.paymentType === 'cash') acc.received += curr.grandTotal;
          if (curr.paymentType === 'credit' && curr.challanType !== 'jobwork') acc.receivable += curr.grandTotal;
          return acc;
      }, { receivable: 0, received: 0, all: 0 });
  }, [data]);

  const filteredData = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return data.filter(d => {
        if (searchTerm && !d.challanNo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (summaryFilter === 'cash' && d.paymentType !== 'cash') return false;
        if (summaryFilter === 'unpaid' && (d.paymentType !== 'credit' || d.challanType === 'jobwork')) return false;
        if (!searchTerm) {
            const entryDate = new Date(d.date); entryDate.setHours(0,0,0,0);
            if (filterRange === 'today') return entryDate.getTime() === today.getTime();
            if (filterRange === '7days') { const ago = new Date(today); ago.setDate(today.getDate() - 7); return entryDate >= ago && entryDate <= today; }
            if (filterRange === '30days') { const ago = new Date(today); ago.setDate(today.getDate() - 30); return entryDate >= ago && entryDate <= today; }
            if (filterRange === 'custom') return d.date === customDate;
        }
        return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [data, filterRange, customDate, searchTerm, summaryFilter]);

  const addItem = () => {
    if (!itemSize || !itemWeight || (entryMode !== 'job' && !itemPrice)) return;
    const newItem = { id: crypto.randomUUID(), size: itemSize, weight: parseFloat(itemWeight), price: parseFloat(itemPrice) || 0, total: (parseFloat(itemWeight) * (parseFloat(itemPrice) || 0)) };
    setItems([...items, newItem]);
    setItemSize(''); setItemWeight(''); setItemPrice('');
  };
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const handleEdit = (entry: ChallanEntry) => {
    setEditingId(entry.id); setChallanNo(entry.challanNo); setDate(entry.date); setPartyName(entry.partyName); setItems(entry.items);
    if (entry.paymentType === 'cash') setEntryMode('cash'); else if (entry.challanType === 'jobwork') setEntryMode('job'); else setEntryMode('unpaid');
  };
  const resetForm = () => { setEditingId(null); setChallanNo(''); setItems([]); setPartyName(''); setEntryMode('unpaid'); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || items.length === 0) return alert("Party & items required");
    const pType: PaymentType = entryMode === 'cash' ? 'cash' : 'credit';
    const cType: ChallanType = entryMode === 'job' ? 'jobwork' : 'debit_note';
    const entryData = { challanNo, date, partyName, paymentType: pType, challanType: cType, items, grandTotal };
    setIsSubmitting(true);
    try {
      if (editingId && onUpdate) await onUpdate(editingId, entryData);
      else if (onAdd) await onAdd(entryData);
      resetForm();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const toggleSummaryFilter = (filter: SummaryFilter) => setSummaryFilter(summaryFilter === filter ? 'all' : filter);

  return (
    <div className="w-full pb-20 space-y-4 font-poppins">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => toggleSummaryFilter('all')} className={`p-3 rounded-xl border flex justify-between items-center ${summaryFilter === 'all' ? 'bg-indigo-50 border-indigo-500' : 'bg-white'}`}><div className="text-left"><p className="text-[10px] font-bold uppercase text-indigo-600">All</p><h3 className="font-bold text-lg text-indigo-700">{Math.floor(summary.all).toLocaleString()}</h3></div><Coins/></button>
        <button onClick={() => toggleSummaryFilter('cash')} className={`p-3 rounded-xl border flex justify-between items-center ${summaryFilter === 'cash' ? 'bg-emerald-50 border-emerald-500' : 'bg-white'}`}><div className="text-left"><p className="text-[10px] font-bold uppercase text-emerald-600">Cash</p><h3 className="font-bold text-lg text-emerald-700">{Math.floor(summary.received).toLocaleString()}</h3></div><CheckCircle2/></button>
        <button onClick={() => toggleSummaryFilter('unpaid')} className={`p-3 rounded-xl border flex justify-between items-center ${summaryFilter === 'unpaid' ? 'bg-amber-50 border-amber-500' : 'bg-white'}`}><div className="text-left"><p className="text-[10px] font-bold uppercase text-amber-600">Unpaid</p><h3 className="font-bold text-lg text-amber-700">{Math.floor(summary.receivable).toLocaleString()}</h3></div><Clock/></button>
      </div>
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-4`}>
        {!isAdmin && <div className="lg:col-span-4"><div className="bg-white rounded-xl border p-4"><h3 className="font-bold text-sm mb-3">{editingId ? 'Edit' : 'New'} Challan</h3><form onSubmit={handleSubmit} className="space-y-3"><div className="grid grid-cols-2 gap-3"><input value={challanNo} onChange={e => setChallanNo(e.target.value)} placeholder="Challan #" className="p-2 text-xs rounded border"/><input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 text-xs rounded border"/></div><input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Party Name" className="w-full p-2 text-xs rounded border"/><datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p}/>)}</datalist><div className="grid grid-cols-3 gap-2">{['unpaid', 'cash', 'job'].map(m => <button key={m} type="button" onClick={() => setEntryMode(m as EntryMode)} className={`py-2 text-[10px] font-bold uppercase rounded border ${entryMode === m ? 'bg-blue-100 text-blue-700' : ''}`}>{m}</button>)}</div><div className="bg-slate-50 p-2 rounded border"><div className="grid grid-cols-3 gap-2 mb-2"><input placeholder="Size" value={itemSize} onChange={e => setItemSize(e.target.value)} className="p-1.5 text-xs rounded border"/><input type="number" placeholder="Wt" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="p-1.5 text-xs rounded border"/>{entryMode !== 'job' && <input type="number" placeholder="Price" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="p-1.5 text-xs rounded border"/>}</div><button type="button" onClick={addItem} className="w-full bg-blue-600 text-white py-1.5 text-xs font-bold rounded">Add Item</button>{items.length > 0 && <div className="mt-2 space-y-1 text-[10px]">{items.map(item => <div key={item.id} className="flex justify-between p-1 bg-white rounded border"><span>{item.size}</span><span>{Math.floor(item.total)}</span></div>)}</div>}</div><button type="submit" className="w-full bg-slate-900 text-white py-2.5 font-bold rounded">{editingId ? 'Update' : 'Save'}</button></form></div></div>}
        <div className={isAdmin ? "lg:col-span-1" : "lg:col-span-8"}><div className="bg-white rounded-xl border h-full flex flex-col"><div className="p-3 border-b flex justify-between items-center"><h3 className="font-bold text-sm">Challan Book</h3><div className="flex gap-1">{['today', '7days', '30days'].map(r => <button key={r} onClick={() => setFilterRange(r as FilterRange)} className={`px-2 py-1 text-[10px] font-bold rounded border ${filterRange === r ? 'bg-indigo-600 text-white' : ''}`}>{r}</button>)}</div></div><div className="flex-1 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th>#</th><th>Date</th><th>Party</th><th>Total</th><th>Act</th></tr></thead><tbody>{filteredData.map(row => <React.Fragment key={row.id}><tr onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} className={`${row.paymentType === 'cash' ? 'bg-emerald-50' : 'bg-red-50'}`}><td>{row.challanNo}</td><td>{row.date}</td><td className="text-blue-700 font-bold">{row.partyName}</td><td>{Math.floor(row.grandTotal)}</td><td><button onClick={() => onDelete(row.id)}><Trash2 className="w-4 h-4 text-red-500"/></button></td></tr>{expandedRow === row.id && <tr><td colSpan={5} className="p-2"><table className="w-full text-[10px]"><thead><tr><th>Size</th><th>Wt</th><th>Price</th><th>Total</th></tr></thead><tbody>{row.items.map(i => <tr key={i.id}><td>{i.size}</td><td>{i.weight}</td><td>{i.price}</td><td>{Math.floor(i.total)}</td></tr>)}</tbody></table></td></tr>}</React.Fragment>)}</tbody></table></div></div></div>
      </div>
    </div>
  );
};