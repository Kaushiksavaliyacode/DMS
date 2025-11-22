
import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES, PaymentType, ChallanType } from '../types';
import { Plus, Trash2, IndianRupee, Receipt, Save, RotateCcw, User, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface ChallanProps {
  data: ChallanEntry[];
  onAdd: (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
}

export const ChallanView: React.FC<ChallanProps> = ({ data, onAdd, onDelete }) => {
  // State for new challan form
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [challanType, setChallanType] = useState<ChallanType>('invoice');
  const [items, setItems] = useState<ChallanItem[]>([]);
  
  // View State (Date Slider)
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for new item entry
  const [itemSize, setItemSize] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  
  // Derived state
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  
  // Summary Stats (All time)
  const summary = useMemo(() => {
      return data.reduce((acc, curr) => ({
          receivable: acc.receivable + (curr.paymentType === 'credit' ? curr.grandTotal : 0),
          received: acc.received + (curr.paymentType === 'cash' ? curr.grandTotal : 0),
          count: acc.count + 1
      }), { receivable: 0, received: 0, count: 0 });
  }, [data]);

  // Filtered Data by Date
  const filteredData = useMemo(() => {
      return data.filter(d => d.date === viewDate);
  }, [data, viewDate]);

  // --- Handlers ---
  const addItem = () => {
      if (!itemSize || !itemWeight) return;
      // Allow price to be empty for Job Work / Notes if needed, but usually requires logic
      if ((challanType === 'invoice' || challanType === 'credit_note' || challanType === 'debit_note') && !itemPrice) return;

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

  const removeItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!partyName || items.length === 0) {
          alert("Please enter party details and at least one item.");
          return;
      }
      onAdd({
          challanNo,
          date,
          partyName,
          paymentType,
          challanType,
          items,
          grandTotal
      });
      // Reset
      setChallanNo('');
      setPartyName('');
      setItems([]);
      setPaymentType('credit');
      setChallanType('invoice');
  };

  const handlePrevDate = () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() - 1);
      setViewDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + 1);
      setViewDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Received (Cash)</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center"><IndianRupee className="w-5 h-5 mr-1" /> {summary.received.toLocaleString()}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
                <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Total Credit (Unpaid)</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center"><IndianRupee className="w-5 h-5 mr-1" /> {summary.receivable.toLocaleString()}</h3>
            </div>
             <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Challans</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.count}</h3>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Create Challan Form */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                     <div className="flex items-center gap-2 mb-6">
                         <div className="bg-blue-50 p-2 rounded-lg"><Receipt className="w-5 h-5 text-blue-600" /></div>
                         <h3 className="font-bold text-slate-800">Create Challan</h3>
                     </div>

                     <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Challan No</label>
                                 <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date</label>
                                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                             </div>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Party Name</label>
                             <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full pl-9 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" placeholder="Select Party" />
                                <datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p} />)}</datalist>
                             </div>
                         </div>

                        {/* Bill Type */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bill Type</label>
                            <select 
                                value={challanType} 
                                onChange={e => setChallanType(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                            >
                                <option value="invoice">Invoice</option>
                                <option value="jobwork">Job Work</option>
                                <option value="credit_note">Credit Note</option>
                                <option value="debit_note">Debit Note</option>
                            </select>
                        </div>

                         {/* Payment Mode */}
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Payment Mode</label>
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                                 <button type="button" onClick={() => setPaymentType('credit')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'credit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>Credit</button>
                                 <button type="button" onClick={() => setPaymentType('cash')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'cash' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Cash</button>
                             </div>
                         </div>

                         <div className="border-t border-slate-100 pt-4">
                             <label className="text-xs font-bold text-slate-800 block mb-2">Add Items</label>
                             <div className="grid grid-cols-3 gap-2 mb-2">
                                 <input placeholder="Size" value={itemSize} onChange={e => setItemSize(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
                                 <input type="number" placeholder="Weight" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
                                 {challanType !== 'jobwork' ? (
                                    <input type="number" placeholder="Price" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
                                 ) : (
                                    <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 flex items-center justify-center">No Price</div>
                                 )}
                             </div>
                             <button type="button" onClick={addItem} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 border border-blue-100">
                                 <Plus className="w-4 h-4" /> Add Item
                             </button>
                         </div>

                         {/* Items List inside Form */}
                         {items.length > 0 && (
                             <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto border border-slate-200">
                                 {items.map(item => (
                                     <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                         <div>
                                             <div className="text-xs font-bold text-slate-800">{item.size}</div>
                                             <div className="text-[10px] text-slate-500">{item.weight} kg {item.price > 0 ? `x ₹${item.price}` : ''}</div>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <div className="text-xs font-bold text-slate-800">₹{item.total.toFixed(2)}</div>
                                             <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}

                         {challanType !== 'jobwork' && (
                             <div className="flex justify-between items-center pt-2">
                                 <span className="font-bold text-slate-500 text-sm">Grand Total</span>
                                 <span className="text-xl font-bold text-slate-900">₹ {grandTotal.toLocaleString()}</span>
                             </div>
                         )}

                         <div className="flex gap-3 pt-2">
                             <button type="button" onClick={() => { setItems([]); setChallanNo(''); }} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"><RotateCcw className="w-5 h-5" /></button>
                             <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                 <Save className="w-5 h-5" /> Save Challan
                             </button>
                         </div>
                     </form>
                </div>
            </div>

            {/* Right: Recent Challans List with Slider */}
            <div className="lg:col-span-7">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="font-bold text-slate-700">Challan Book</h3>
                    
                    {/* Date Slider */}
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={handlePrevDate} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="flex items-center px-3 gap-2 border-x border-slate-100 mx-1">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-700 min-w-[90px] text-center">{viewDate}</span>
                        </div>
                        <button onClick={handleNextDate} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredData.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No challans found for {viewDate}.</p>
                        </div>
                    ) : (
                        filteredData.map(challan => (
                            <div key={challan.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 group relative">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">#{challan.challanNo || 'NA'}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${challan.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{challan.paymentType}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                challan.challanType === 'invoice' ? 'bg-blue-100 text-blue-700' : 
                                                challan.challanType === 'jobwork' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {challan.challanType.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg">{challan.partyName}</h4>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="text-2xl font-bold text-slate-800">₹ {challan.grandTotal.toLocaleString()}</div>
                                        <div className="text-xs text-slate-400">{challan.items.length} Items</div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 rounded-lg p-3 mb-3 overflow-x-auto">
                                    <table className="w-full text-left min-w-[300px]">
                                        <thead>
                                            <tr className="text-[10px] text-slate-400 uppercase">
                                                <th className="font-bold pb-1">Size</th>
                                                <th className="font-bold pb-1 text-right">Wt</th>
                                                <th className="font-bold pb-1 text-right">Price</th>
                                                <th className="font-bold pb-1 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-bold text-slate-700">
                                            {challan.items.map(item => (
                                                <tr key={item.id} className="border-t border-slate-200/50">
                                                    <td className="py-1 truncate max-w-[100px]">{item.size}</td>
                                                    <td className="text-right py-1">{item.weight}</td>
                                                    <td className="text-right py-1">{item.price}</td>
                                                    <td className="text-right py-1">{item.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => onDelete(challan.id)} className="flex items-center text-red-400 hover:text-red-600 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                         <Trash2 className="w-3 h-3 mr-1" /> Delete
                                     </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
