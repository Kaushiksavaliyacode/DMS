
import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES, PaymentType, ChallanType } from '../types';
import { Plus, Trash2, IndianRupee, Receipt, Save, RotateCcw, User, Calendar, Filter, ChevronDown, ChevronRight, FileText, CheckCircle2, Clock } from 'lucide-react';

interface ChallanProps {
  data: ChallanEntry[];
  onAdd?: (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

type FilterRange = 'today' | '7days' | '30days' | 'custom';
type EntryMode = 'unpaid' | 'cash' | 'job';

export const ChallanView: React.FC<ChallanProps> = ({ data, onAdd, onDelete, isAdmin = false }) => {
  // Form State
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  
  // Simplified Entry Mode (Maps to paymentType/challanType internally)
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

  // --- Derived State ---
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  // Financial Summary (All Time)
  const summary = useMemo(() => {
      return data.reduce((acc, curr) => {
          // Cash logic
          if (curr.paymentType === 'cash') {
              return { ...acc, received: acc.received + curr.grandTotal, count: acc.count + 1 };
          }
          // Unpaid logic (Credit payment type AND not jobwork)
          if (curr.paymentType === 'credit' && curr.challanType !== 'jobwork') {
              return { ...acc, receivable: acc.receivable + curr.grandTotal, count: acc.count + 1 };
          }
          // Jobwork just adds to count
          return { ...acc, count: acc.count + 1 };
      }, { receivable: 0, received: 0, count: 0 });
  }, [data]);

  // Data Filtering
  const filteredData = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);

      return data.filter(d => {
          const entryDate = new Date(d.date);
          entryDate.setHours(0,0,0,0);
          
          if (filterRange === 'today') {
              return entryDate.getTime() === today.getTime();
          } 
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
          if (filterRange === 'custom') {
              return d.date === customDate;
          }
          return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
  }, [data, filterRange, customDate]);

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

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!partyName || items.length === 0) {
          alert("Party name and items required.");
          return;
      }
      
      // Map simplified mode to internal types
      let pType: PaymentType = 'credit';
      let cType: ChallanType = 'debit_note';

      if (entryMode === 'cash') {
          pType = 'cash';
          cType = 'debit_note'; // Normal bill, paid
      } else if (entryMode === 'job') {
          pType = 'credit'; // Doesn't matter really
          cType = 'jobwork';
      } else {
          // Unpaid
          pType = 'credit';
          cType = 'debit_note';
      }

      if (onAdd) {
          onAdd({
              challanNo,
              date,
              partyName,
              paymentType: pType,
              challanType: cType,
              items,
              grandTotal
          });
      }
      // Reset
      setChallanNo('');
      setItems([]);
      setPartyName('');
      setEntryMode('unpaid');
  };

  return (
    <div className="w-full pb-20 space-y-6 font-inter">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Cash Received</p>
                    <h3 className="text-2xl font-bold text-emerald-700 mt-1 flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" /> {summary.received.toLocaleString()}
                    </h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Unpaid (Credit)</p>
                    <h3 className="text-2xl font-bold text-amber-700 mt-1 flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" /> {summary.receivable.toLocaleString()}
                    </h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-full"><Clock className="w-6 h-6 text-amber-500" /></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Transactions</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.count}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-full"><FileText className="w-6 h-6 text-slate-400" /></div>
            </div>
        </div>

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
            
            {/* Create Challan Form (Hidden for Admin) */}
            {!isAdmin && (
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800">New Transaction</h3>
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

                            {/* Simplified Type Selection */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setEntryMode('unpaid')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'unpaid' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        Unpaid
                                    </button>
                                    <button type="button" onClick={() => setEntryMode('cash')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'cash' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        Cash
                                    </button>
                                    <button type="button" onClick={() => setEntryMode('job')} className={`py-2 rounded-lg text-xs font-bold border transition-all ${entryMode === 'job' ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
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
                                        <input type="number" placeholder="₹" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="px-2 py-2 border border-slate-300 rounded-md text-xs font-bold focus:border-indigo-500 outline-none" />
                                    ) : (
                                        <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-200 bg-slate-100 rounded-md">No Price</div>
                                    )}
                                </div>
                                <button type="button" onClick={addItem} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Line
                                </button>

                                {/* Mini List */}
                                {items.length > 0 && (
                                    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                                                <span className="font-bold text-slate-700">{item.size} <span className="text-slate-400 font-normal">({item.weight}kg)</span></span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">₹{item.total}</span>
                                                    <button type="button" onClick={() => removeItem(item.id)}><Trash2 className="w-3 h-3 text-red-400" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="font-bold text-slate-500 text-sm">Grand Total</span>
                                <span className="text-xl font-bold text-slate-900">₹ {grandTotal.toLocaleString()}</span>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                <Save className="w-5 h-5" /> Save Record
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Right: Excel Style Table */}
            <div className={isAdmin ? "lg:col-span-1" : "lg:col-span-8"}>
                <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200 flex flex-col h-full min-h-[600px]">
                    
                    {/* Filters Toolbar */}
                    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                             <Receipt className="w-5 h-5 text-slate-600" />
                             <h3 className="font-bold text-slate-800">Challan Book</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => setFilterRange('today')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === 'today' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>Today</button>
                            <button onClick={() => setFilterRange('7days')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === '7days' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>7 Days</button>
                            <button onClick={() => setFilterRange('30days')} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${filterRange === '30days' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>30 Days</button>
                            
                            <div className="flex items-center bg-white border border-slate-300 rounded-md px-2 py-1">
                                <Filter className="w-3 h-3 text-slate-400 mr-2" />
                                <input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setFilterRange('custom'); }} className="text-xs font-bold text-slate-600 outline-none bg-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Excel Style Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 w-10"></th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300">Date</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300">Challan #</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 w-1/3">Party Name</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 text-center">Type</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 text-center">Items</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-r border-slate-300 text-right">Total</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-300 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-20 text-slate-400">
                                            No records found for selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => (
                                        <React.Fragment key={row.id}>
                                            <tr className="hover:bg-blue-50/50 transition-colors border-b border-slate-200">
                                                <td className="px-2 py-2 text-center border-r border-slate-200">
                                                    <button onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                                        {expandedRow === row.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap">{row.date}</td>
                                                <td className="px-4 py-2.5 text-xs font-bold text-slate-500 border-r border-slate-200">{row.challanNo || '-'}</td>
                                                <td className="px-4 py-2.5 text-sm font-bold text-blue-700 border-r border-slate-200">{row.partyName}</td>
                                                <td className="px-4 py-2.5 text-center border-r border-slate-200">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                        row.paymentType === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        row.challanType === 'jobwork' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {row.paymentType === 'cash' ? 'Cash' : row.challanType === 'jobwork' ? 'Job' : 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-bold text-slate-600 text-center border-r border-slate-200">{row.items.length}</td>
                                                <td className="px-4 py-2.5 text-sm font-bold text-slate-900 text-right border-r border-slate-200">
                                                    {row.challanType === 'jobwork' ? '-' : `₹ ${row.grandTotal.toLocaleString()}`}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded Row for Items */}
                                            {expandedRow === row.id && (
                                                <tr className="bg-slate-50 border-b border-slate-200 shadow-inner">
                                                    <td colSpan={8} className="px-10 py-4">
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
                                                                            <td className="px-4 py-2 text-xs font-bold text-slate-600 text-right">{item.price > 0 ? `₹${item.price}` : '-'}</td>
                                                                            <td className="px-4 py-2 text-xs font-bold text-slate-800 text-right">{item.total > 0 ? `₹${item.total}` : '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
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
