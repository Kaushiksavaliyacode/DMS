
import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES } from '../types';
import { Plus, Trash2, IndianRupee, Receipt, Save, RotateCcw, User, Briefcase } from 'lucide-react';

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
  const [paymentType, setPaymentType] = useState<'debit' | 'cash'>('debit');
  const [challanType, setChallanType] = useState<'sales' | 'jobwork'>('sales');
  const [items, setItems] = useState<ChallanItem[]>([]);
  
  // State for new item entry
  const [itemSize, setItemSize] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  
  // Derived state
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  
  // Summary Stats
  const summary = useMemo(() => {
      return data.reduce((acc, curr) => ({
          receivable: acc.receivable + (curr.paymentType === 'debit' && curr.challanType === 'sales' ? curr.grandTotal : 0),
          received: acc.received + (curr.paymentType === 'cash' && curr.challanType === 'sales' ? curr.grandTotal : 0),
          count: acc.count + 1
      }), { receivable: 0, received: 0, count: 0 });
  }, [data]);

  // --- Handlers ---
  const addItem = () => {
      if (!itemSize || !itemWeight) return;
      if (challanType === 'sales' && !itemPrice) return;

      const weight = parseFloat(itemWeight);
      const price = challanType === 'sales' ? parseFloat(itemPrice) : 0;
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
      setPaymentType('debit');
      setChallanType('sales');
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Received (Cash)</p>
                <h3 className="text-3xl font-bold mt-1 flex items-center"><IndianRupee className="w-6 h-6 mr-1" /> {summary.received.toLocaleString()}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-200">
                <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Total Receivable (Debit)</p>
                <h3 className="text-3xl font-bold mt-1 flex items-center"><IndianRupee className="w-6 h-6 mr-1" /> {summary.receivable.toLocaleString()}</h3>
            </div>
             <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Challans</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary.count}</h3>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                                 <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date</label>
                                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                             </div>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Party Name</label>
                             <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full pl-9 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" placeholder="Select Party" />
                                <datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p} />)}</datalist>
                             </div>
                         </div>

                        {/* Challan Type & Payment Mode */}
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bill Type</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => setChallanType('sales')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${challanType === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Invoice</button>
                                    <button type="button" onClick={() => setChallanType('jobwork')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${challanType === 'jobwork' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>Job Work</button>
                                </div>
                            </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Payment Mode</label>
                                 <div className="flex bg-slate-100 p-1 rounded-xl">
                                     <button type="button" onClick={() => setPaymentType('debit')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${paymentType === 'debit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>Debit</button>
                                     <button type="button" onClick={() => setPaymentType('cash')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${paymentType === 'cash' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Cash</button>
                                 </div>
                             </div>
                         </div>

                         <div className="border-t border-slate-100 pt-4">
                             <label className="text-xs font-bold text-slate-800 block mb-2">Add Items</label>
                             <div className="grid grid-cols-3 gap-2 mb-2">
                                 <input placeholder="Size (Text)" value={itemSize} onChange={e => setItemSize(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                 <input type="number" placeholder="Weight" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                 {challanType === 'sales' ? (
                                    <input type="number" placeholder="Price" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                                 ) : (
                                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 flex items-center justify-center">No Price</div>
                                 )}
                             </div>
                             <button type="button" onClick={addItem} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                                 <Plus className="w-3 h-3" /> Add Item
                             </button>
                         </div>

                         {/* Items List inside Form */}
                         {items.length > 0 && (
                             <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                                 {items.map(item => (
                                     <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                         <div>
                                             <div className="text-xs font-bold text-slate-800">{item.size}</div>
                                             <div className="text-[10px] text-slate-500">{item.weight} kg {item.price > 0 ? `x ₹${item.price}` : '(Job Work)'}</div>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <div className="text-xs font-bold text-slate-800">₹{item.total.toFixed(2)}</div>
                                             <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}

                         {challanType === 'sales' && (
                             <div className="flex justify-between items-center pt-2">
                                 <span className="font-bold text-slate-500 text-sm">Grand Total</span>
                                 <span className="text-xl font-bold text-slate-900">₹ {grandTotal.toLocaleString()}</span>
                             </div>
                         )}

                         <div className="flex gap-3 pt-2">
                             <button type="button" onClick={() => { setItems([]); setChallanNo(''); }} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl border border-slate-200"><RotateCcw className="w-5 h-5" /></button>
                             <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                                 <Save className="w-5 h-5" /> Save Challan
                             </button>
                         </div>
                     </form>
                </div>
            </div>

            {/* Right: Recent Challans List */}
            <div className="lg:col-span-7">
                <h3 className="font-bold text-slate-700 mb-4">Recent Challans</h3>
                <div className="space-y-4">
                    {data.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No challans created yet.</p>
                        </div>
                    ) : (
                        data.map(challan => (
                            <div key={challan.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">{challan.date}</span>
                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">#{challan.challanNo || 'NA'}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${challan.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{challan.paymentType}</span>
                                            {challan.challanType === 'jobwork' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">Job Work</span>}
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg">{challan.partyName}</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-800">₹ {challan.grandTotal.toLocaleString()}</div>
                                        <div className="text-xs text-slate-400">{challan.items.length} Items</div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                    <table className="w-full text-left">
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
                                                    <td className="py-1">{item.size}</td>
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
