
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
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simplified Entry Mode
  const [entryMode, setEntryMode] = useState<EntryMode>('unpaid');
  const [items, setItems] = useState<ChallanItem[]>([]);
  
  // Item Entry State
  const [itemSize, setItemSize] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // View/Filter State
  const [filterRange, setFilterRange] = useState<FilterRange>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  
  // Error state for this component specifically if needed
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Derived State ---
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const summary = useMemo(() => {
      return data.reduce((acc, curr) => {
          if (curr.paymentType === 'cash') {
              return { ...acc, received: acc.received + curr.grandTotal };
          }
          if (curr.paymentType === 'credit' && curr.challanType !== 'jobwork') {
              return { ...acc, receivable: acc.receivable + curr.grandTotal };
          }
          return acc;
      }, { receivable: 0, received: 0 });
  }, [data]);

  const filteredData = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);

      return data.filter(d => {
          if (searchTerm && !d.challanNo.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
          }
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

  // --- Handlers ---
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
      
      if (entry.paymentType === 'cash') {
          setEntryMode('cash');
      } else if (entry.challanType === 'jobwork') {
          setEntryMode('job');
      } else {
          setEntryMode('unpaid');
      }
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
          alert("Party name and items required.");
          return;
      }
      
      let pType: PaymentType = 'credit';
      let cType: ChallanType = 'debit_note';

      if (entryMode === 'cash') {
          pType = 'cash';
          cType = 'debit_note';
      } else if (entryMode === 'job') {
          pType = 'credit';
          cType = 'jobwork';
      } else {
          pType = 'credit';
          cType = 'debit_note';
      }

      const entryData = {
          challanNo,
          date,
          partyName,
          paymentType: pType,
          challanType: cType,
          items,
          grandTotal
      };

      setIsSubmitting(true);
      setErrorMsg(null);
      
      try {
          if (editingId && onUpdate) {
              await onUpdate(editingId, entryData);
          } else if (onAdd) {
              await onAdd(entryData);
          }
          resetForm();
      } catch (e: any) {
          console.error("Error saving challan", e);
          let msg = e.message || 'Unknown error';
          if (msg.includes("Missing or insufficient permissions")) {
            msg = "PERMISSION ERROR: Go to Firebase Console > Firestore > Rules and set 'allow read, write: if true;'";
          }
          setErrorMsg(msg);
          alert(msg);
      } finally {
          setIsSubmitting(false);
      }
  };

  const toggleSummaryFilter = (filter: SummaryFilter) => {
      if (summaryFilter === filter) {
          setSummaryFilter('all');
      } else {
          setSummaryFilter(filter);
      }
  };

  return (
    <div className="w-full pb-20 space-y-6 font-inter">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => toggleSummaryFilter('cash')}
                className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-all ${
                    summaryFilter === 'cash' 
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' 
                    : 'bg-white border-emerald-200 hover:border-emerald-300'
                }`}
            >
                <div className="text-left">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Cash Received</p>
                    <h3 className="text-2xl font-bold text-emerald-700 mt-1 flex items-center">
                        {Math.floor(summary.received).toLocaleString()}
                    </h3>
                </div>
                <div className={`p-3 rounded-full ${summaryFilter === 'cash' ? 'bg-emerald-200' : 'bg-emerald-50'}`}>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
            </button>
            
            <button 
                onClick={() => toggleSummaryFilter('unpaid')}
                className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-all ${
                    summaryFilter === 'unpaid' 
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' 
                    : 'bg-white border-amber-200 hover:border-amber-300'
                }`}
            >
                <div className="text-left">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Unpaid (Credit)</p>
                    <h3 className="text-2xl font-bold text-amber-700 mt-1 flex items-center">
                        {Math.floor(summary.receivable).toLocaleString()}
                    </h3>
                </div>
                <div className={`p-3 rounded-full ${summaryFilter === 'unpaid' ? 'bg-amber-200' : 'bg-amber-50'}`}>
                    <Clock className="w-6 h-6 text-amber-600" />
                </div>
            </button>
        </div>

        {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">{errorMsg}</span>
            </div>
        )}

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
            
            {/* Create Challan Form */}
            {!isAdmin && (
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200 overflow-hidden relative">
                        {editingId && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 z-10"></div>}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-slate-800">{editingId ? 'Edit Transaction' : 'New Transaction'}</h3>
                            </div>
                            {editingId && (
                                <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Cancel
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Challan No</label>
                                    <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" placeholder="Auto" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Party Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full pl-9 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" placeholder="Select Party" />
                                    <datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p} />)}</datalist>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setEntryMode('unpaid')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'unpaid' ? 'bg-red-50 border-red-300 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        Unpaid
                                    </button>
                                    <button type="button" onClick={() => setEntryMode('cash')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'cash' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        Cash
                                    </button>
                                    <button type="button" onClick={() => setEntryMode('job')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'job' ? 'bg-slate-100 border-slate-300 text-slate-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        Job
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Item Details</label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <input placeholder="Size" value={itemSize} onChange={e => setItemSize(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-md text-xs font-bold focus:border-indigo-500 outline-none" />
                                    <input type="number" placeholder="Wt" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-md text-xs font-bold focus:border-indigo-500 outline-none" />
                                    {entryMode !== 'job' ? (
                                        <input type="number" placeholder="Price" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-md text-xs font-bold focus:border-indigo-500 outline-none" />
                                    ) : (
                                        <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-200 bg-slate-100 rounded-md">No Price</div>
                                    )}
                                </div>
                                <button type="button" onClick={addItem} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Line
                                </button>

                                {items.length > 0 && (
                                    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                                                <span className="font-bold text-slate-700">{item.size} <span className="text-slate-400 font-normal">({item.weight}kg)</span></span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{Math.floor(item.total).toLocaleString()}</span>
                                                    <button type="button" onClick={() => removeItem(item.id)}><Trash2 className="w-3 h-3 text-red-400" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {entryMode !== 'job' && (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="font-bold text-slate-500 text-sm">Grand Total</span>
                                    <span className="text-xl font-bold text-slate-900">{Math.floor(grandTotal).toLocaleString()}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70"
                            >
                                {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : (editingId ? <Save className="w-5 h-5" /> : <Save className="w-5 h-5" />)} 
                                {editingId ? 'Update' : 'Save'} Record
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Excel Style Table */}
            <div className={isAdmin ? "lg:col-span-1" : "lg:col-span-8"}>
                <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200 flex flex-col h-full min-h-[600px]">
                    <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-slate-600" />
                                <h3 className="font-bold text-slate-800 whitespace-nowrap">Challan</h3>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search Challan No..." 
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {summaryFilter !== 'all' && (
                                <button onClick={() => setSummaryFilter('all')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300">
                                    <RefreshCw className="w-3 h-3" /> Reset Filter
                                </button>
                            )}
                            <button onClick={() => setFilterRange('today')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === 'today' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>Today</button>
                            <button onClick={() => setFilterRange('7days')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === '7days' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>7 Days</button>
                            <button onClick={() => setFilterRange('30days')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === '30days' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>30 Days</button>
                            <div className="flex items-center bg-white border border-slate-300 rounded-md px-2 py-1">
                                <Filter className="w-3 h-3 text-slate-400 mr-2" />
                                <input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setFilterRange('custom'); }} className="text-xs font-bold text-slate-600 outline-none bg-transparent" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300">Challan #</th>
                                    <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300">Date</th>
                                    <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 w-1/3">Party Name</th>
                                    <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 text-right">Total</th>
                                    <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-300 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 text-slate-400">No records found.</td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => {
                                        let rowClass = "cursor-pointer transition-colors";
                                        let textClass = "";
                                        let borderClass = "";
                                        if (row.paymentType === 'cash') {
                                            rowClass = "bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-100 cursor-pointer";
                                            textClass = "text-emerald-800";
                                            borderClass = "border-l-4 border-l-emerald-500";
                                        } else if (row.challanType === 'jobwork') {
                                            rowClass = "bg-white hover:bg-slate-50 border-b border-slate-200 cursor-pointer";
                                            textClass = "text-slate-700";
                                            borderClass = "border-l-4 border-l-slate-400";
                                        } else {
                                            rowClass = "bg-red-50 hover:bg-red-100 border-b border-red-100 cursor-pointer";
                                            textClass = "text-red-800";
                                            borderClass = "border-l-4 border-l-red-500";
                                        }
                                        rowClass = `${rowClass} ${borderClass}`;
                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr className={rowClass} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                                                    <td className={`px-3 py-2.5 text-xs font-bold border-r border-slate-200/50 ${textClass}`}>{row.challanNo || '-'}</td>
                                                    <td className={`px-3 py-2.5 text-xs font-bold border-r border-slate-200/50 whitespace-nowrap ${textClass}`}>{row.date}</td>
                                                    <td className={`px-3 py-2.5 text-sm font-bold border-r border-slate-200/50 ${textClass}`}>{row.partyName}</td>
                                                    <td className={`px-3 py-2.5 text-sm font-bold text-right border-r border-slate-200/50 ${textClass}`}>{row.challanType === 'jobwork' ? '-' : `${Math.floor(row.grandTotal).toLocaleString()}`}</td>
                                                    <td className="px-3 py-2.5 text-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {!isAdmin && <button onClick={() => handleEdit(row)} className="text-indigo-500 hover:text-indigo-700 p-1"><Pencil className="w-4 h-4" /></button>}
                                                        <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                                {expandedRow === row.id && (
                                                    <tr className="bg-white border-b border-slate-200 shadow-inner">
                                                        <td colSpan={5} className="px-4 py-4 md:px-10">
                                                            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden max-w-2xl">
                                                                <table className="w-full text-left">
                                                                    <thead className="bg-slate-100 border-b border-slate-300">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Size</th>
                                                                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-right">Weight</th>
                                                                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-right">Price</th>
                                                                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-right">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {row.items.map((item, idx) => (
                                                                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                                <td className="px-4 py-2 text-xs font-bold text-slate-700">{item.size}</td>
                                                                                <td className="px-4 py-2 text-xs font-bold text-slate-600 text-right">{item.weight} kg</td>
                                                                                <td className="px-4 py-2 text-xs font-bold text-slate-600 text-right">{item.price > 0 ? `${Math.floor(item.price)}` : '-'}</td>
                                                                                <td className="px-4 py-2 text-xs font-bold text-slate-800 text-right">{item.total > 0 ? `${Math.floor(item.total)}` : '-'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
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
