import React, { useState, useEffect, useMemo } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES, ChallanEntry } from '../types';
import { Plus, RotateCcw, CheckCircle2, Trash2, Send, Ruler, User, Package, Scale, Pencil, Save, X, ScrollText, Receipt, AlertCircle, Circle, Truck } from 'lucide-react';
import { ChallanView } from './Challan';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => Promise<void> | void;
  onDeleteEntry: (id: string) => Promise<void> | void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
  
  // Challan props
  challanData?: ChallanEntry[];
  onAddChallan?: (entry: any) => Promise<void> | void;
  onUpdateChallan?: (id: string, entry: any) => Promise<void> | void;
  onDeleteChallan?: (id: string) => Promise<void> | void;
}

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry,
    challanData = [], onAddChallan, onUpdateChallan, onDeleteChallan
}) => {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<'dispatch' | 'challan'>('dispatch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dispatch State ---
  const [formData, setFormData] = useState({
    partyName: '',
    size: '',
    weight: '',
    productionWeight: '',
    pcs: '',
    bundle: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as DispatchStatus
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableParties, setAvailableParties] = useState<string[]>(MOCK_PARTIES);
  const [newPartyName, setNewPartyName] = useState('');
  const [showAddParty, setShowAddParty] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // --- Effects ---
  useEffect(() => {
      const saved = localStorage.getItem('custom_parties');
      if (saved) {
          setAvailableParties([...MOCK_PARTIES, ...JSON.parse(saved)]);
      }
  }, []);

  // --- Handlers ---
  const handleAddParty = () => {
      if (newPartyName.trim()) {
          const updatedParties = Array.from(new Set([...availableParties, newPartyName.trim()]));
          setAvailableParties(updatedParties);
          const custom = updatedParties.filter(p => !MOCK_PARTIES.includes(p));
          localStorage.setItem('custom_parties', JSON.stringify(custom));
          setFormData(prev => ({ ...prev, partyName: newPartyName.trim() }));
          setNewPartyName('');
          setShowAddParty(false);
      }
  };

  const handleEditClick = (entry: DispatchEntry) => {
      setEditingId(entry.id);
      setFormData({
          partyName: entry.partyName,
          size: entry.size,
          weight: entry.weight.toString(),
          productionWeight: entry.productionWeight ? entry.productionWeight.toString() : '',
          pcs: entry.pcs ? entry.pcs.toString() : '',
          bundle: entry.bundle ? entry.bundle.toString() : '',
          date: entry.date,
          status: entry.status
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setFormData(prev => ({
          ...prev,
          partyName: '',
          size: '',
          weight: '',
          productionWeight: '',
          pcs: '',
          bundle: '',
          status: 'pending'
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName || !formData.size) {
      setNotification({ type: 'error', message: "Party & Size required" });
      return;
    }
    const weight = parseFloat(formData.weight) || 0;
    const bundle = parseInt(formData.bundle) || 0;
    const pcs = parseFloat(formData.pcs) || 0;

    if (formData.status === 'completed' && (weight <= 0 || bundle <= 0)) {
        setNotification({ type: 'error', message: "Weight & Bundles required for completion" });
        return;
    }

    const entryData = {
      date: formData.date,
      partyName: formData.partyName,
      size: formData.size,
      weight,
      productionWeight: parseFloat(formData.productionWeight) || 0,
      pcs,
      bundle,
      status: formData.status,
      isLoaded: false // Default to not loaded
    };

    setIsSubmitting(true);
    try {
        if (editingId) {
            // Preserve existing isLoaded status if updating
            const existing = entries.find(e => e.id === editingId);
            await onUpdateEntry(editingId, { ...entryData, isLoaded: existing?.isLoaded });
            setNotification({ type: 'success', message: "Job updated successfully" });
            setEditingId(null);
        } else {
            await onAddEntry(entryData);
            setNotification({ type: 'success', message: "Added successfully" });
        }
        
        // Reset form only on success
        setFormData(prev => ({
            ...prev,
            weight: '',
            productionWeight: '',
            pcs: '',
            bundle: '',
            status: 'pending'
        }));
    } catch (error: any) {
        console.error("Save failed:", error);
        let msg = error.message || 'Unknown error';
        if (msg.includes("Missing or insufficient permissions")) {
            msg = "PERMISSION ERROR: Go to Firebase Console > Firestore > Rules and set 'allow read, write: if true;'";
        }
        setNotification({ type: 'error', message: "Save Failed" });
        alert(msg);
    } finally {
        setIsSubmitting(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  // Updated Professional WhatsApp Template
  const sendBulkWhatsApp = (items: DispatchEntry[]) => {
    if (items.length === 0) return;
    const firstItem = items[0];
    
    // Helper to format date nicely
    const dateObj = new Date(firstItem.date);
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let totalWt = 0;
    let totalBdl = 0;

    let message = `*🏭 DISPATCH UPDATE*\n`;
    message += `*🗓 Date:* ${formattedDate}\n`;
    message += `*👤 Party:* ${firstItem.partyName}\n`;
    message += `--------------------------------\n`;
    message += `*📦 Packing List:*\n\n`;

    items.forEach(item => {
        const wt = item.weight.toFixed(3);
        const loadedIcon = item.isLoaded ? '✅' : '⏳';
        // Using monospace block for data alignment
        message += `${loadedIcon} *Size:* ${item.size}\n`;
        message += `    Qty: ${item.bundle} 📦 | Wt: ${wt} kg\n`;
        message += `    Pcs: ${item.pcs ? item.pcs : 'Bundles'}\n\n`;
        
        totalWt += item.weight;
        totalBdl += item.bundle;
    });

    message += `--------------------------------\n`;
    message += `*📊 TOTAL SUMMARY*\n`;
    message += `📦 *Total Bundles:* ${totalBdl}\n`;
    message += `⚖️ *Total Weight:* ${totalWt.toFixed(3)} kg\n`;
    message += `--------------------------------\n`;
    message += `Generated by RDMS`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const toggleLoadedStatus = async (id: string, currentStatus: boolean | undefined) => {
      try {
          await onUpdateEntry(id, { isLoaded: !currentStatus });
      } catch (e) {
          console.error("Failed to toggle loaded status", e);
      }
  };

  const isMMSize = formData.size.toLowerCase().includes('mm');
  
  // Grouping Logic for Job List
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const groupedEntries = useMemo(() => {
      const groups = new Map<string, DispatchEntry[]>();
      sortedEntries.forEach(entry => {
          const key = `${entry.date}|${entry.partyName}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)?.push(entry);
      });
      return Array.from(groups.entries());
  }, [sortedEntries]);

  if (activeTab === 'challan' && onAddChallan && onDeleteChallan) {
      return (
        <div className="max-w-full mx-auto">
             <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    <button onClick={() => setActiveTab('dispatch')} className="px-4 py-2 text-sm font-bold text-slate-500 rounded-lg hover:bg-slate-50">Job Entry</button>
                    <button onClick={() => setActiveTab('challan')} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg shadow-md">Challan Book</button>
                </div>
            </div>
            <ChallanView data={challanData} onAdd={onAddChallan} onUpdate={onUpdateChallan} onDelete={onDeleteChallan} />
        </div>
      );
  }

  return (
    <div className="w-full max-w-full pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 px-2 md:px-4 font-poppins text-slate-800">
        {notification && (
            <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-5 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-bold text-sm">{notification.message}</span>
            </div>
        )}

        {/* Tab Switcher (Mobile/Top) */}
        <div className="lg:col-span-12 flex justify-center">
             <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <button onClick={() => setActiveTab('dispatch')} className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg shadow-md flex items-center gap-2">
                    <ScrollText className="w-4 h-4" /> Job Entry
                </button>
                <button onClick={() => setActiveTab('challan')} className="px-6 py-2 text-sm font-bold text-slate-500 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> Transaction Book
                </button>
             </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                 
                 <div className="flex justify-between items-center mb-5">
                     <h3 className="font-bold text-slate-900 text-lg">{editingId ? 'Edit Job' : 'New Entry'}</h3>
                     <button onClick={() => setShowAddParty(!showAddParty)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors">+ Add Party</button>
                 </div>

                 {showAddParty && (
                     <div className="bg-slate-50 p-3 rounded-xl mb-4 flex gap-2 border border-slate-200 animate-in slide-in-from-top-2">
                         <input type="text" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} placeholder="Party Name" className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 focus:border-indigo-500" />
                         <button onClick={handleAddParty} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Save</button>
                     </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-4">
                     {/* Date */}
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                     </div>

                     {/* Party */}
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Party Name</label>
                         <div className="relative">
                             <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                             <input list="parties" name="partyName" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} placeholder="Select Party" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                             <datalist id="parties">{availableParties.map(p => <option key={p} value={p} />)}</datalist>
                         </div>
                     </div>
                     
                     {/* Size */}
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Size</label>
                         <div className="relative">
                             <Ruler className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                             <input type="text" name="size" value={formData.size} onChange={e => {
                                 const val = e.target.value;
                                 setFormData(prev => ({ ...prev, size: val, pcs: val.toLowerCase().includes('mm') ? prev.bundle.toString() : prev.pcs }));
                             }} placeholder="Size (e.g. 12mm)" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Bundles</label>
                             <div className="relative">
                                <Package className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input type="number" name="bundle" value={formData.bundle} onChange={e => {
                                    const val = e.target.value;
                                    setFormData(prev => ({ ...prev, bundle: val, pcs: isMMSize ? val : prev.pcs }));
                                }} className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white" placeholder="0" />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Weight</label>
                             <div className="relative">
                                <Scale className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input type="number" step="0.001" name="weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full pl-10 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white" placeholder="0.000" />
                             </div>
                         </div>
                     </div>

                     {!isMMSize && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Total Pcs</label>
                            <input type="number" name="pcs" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white" placeholder="0" />
                        </div>
                     )}

                     {/* Status Selection */}
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">Status</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                             {['pending', 'running', 'completed'].map(s => (
                                 <button 
                                      key={s} 
                                      type="button" 
                                      onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                      className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${formData.status === s ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                 >
                                     {s}
                                 </button>
                             ))}
                        </div>
                     </div>

                     <div className="flex gap-3 pt-2">
                         {editingId ? (
                             <button type="button" onClick={cancelEdit} className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl bg-white border border-slate-200"><X className="w-5 h-5" /></button>
                         ) : (
                             <button type="button" onClick={() => setFormData({partyName: '', size: '', weight: '', productionWeight: '', pcs: '', bundle: '', date: new Date().toISOString().split('T')[0], status: 'pending'})} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><RotateCcw className="w-5 h-5" /></button>
                         )}
                         
                         <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                             {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : (editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)} 
                             {editingId ? 'Update Entry' : 'Add Entry'}
                         </button>
                     </div>
                 </form>
             </div>
        </div>

        {/* List Section - Grouped */}
        <div className="lg:col-span-8 h-full flex flex-col">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 text-lg">Job List</h3>
                 <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">{sortedEntries.length} Total</span>
             </div>
             
             <div className="space-y-4">
                 {groupedEntries.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                         <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                         <p className="text-slate-400 text-sm font-medium">No jobs found. Add your first entry.</p>
                     </div>
                 ) : (
                     groupedEntries.map(([key, items]) => {
                         const [date, party] = key.split('|');
                         const totalBundles = items.reduce((sum, item) => sum + item.bundle, 0);

                         return (
                             <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                 <div className="bg-white px-3 py-3 border-b border-slate-100">
                                      <div className="flex flex-col gap-2">
                                          <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2 overflow-hidden">
                                                  <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 whitespace-nowrap">{date}</span>
                                                  <h4 className="font-bold text-slate-900 text-sm truncate">{party}</h4>
                                              </div>
                                              <button 
                                                  onClick={() => sendBulkWhatsApp(items)} 
                                                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold shrink-0"
                                                  title="Share on WhatsApp"
                                              >
                                                  <Send className="w-3 h-3" /> Share
                                              </button>
                                          </div>
                                          <div className="flex justify-end">
                                               <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded">Total Bundles: {totalBundles}</span>
                                          </div>
                                      </div>
                                 </div>
                                 
                                 <div className="p-3 space-y-3">
                                     {items.map(entry => {
                                         return (
                                         <div key={entry.id} className={`relative p-3 rounded-lg border transition-all ${editingId === entry.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                             {/* Header Row: Status, Edit, Delete */}
                                             <div className="flex justify-between items-center mb-2">
                                                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : entry.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {entry.status}
                                                 </span>
                                                 <div className="flex items-center gap-2">
                                                     <button onClick={() => handleEditClick(entry)} className="text-indigo-600 hover:text-indigo-800"><Pencil className="w-4 h-4" /></button>
                                                     <button onClick={() => onDeleteEntry(entry.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                 </div>
                                             </div>
                                             
                                             <div className="grid grid-cols-3 gap-3 text-sm">
                                                 {/* Size */}
                                                 <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Size</span>
                                                    <span className="font-bold text-slate-900 text-sm block">{entry.size}</span>
                                                    <div className="mt-1 text-xs font-bold text-slate-500">{entry.pcs || '-'} Pcs</div>
                                                 </div>

                                                 {/* Bundles Box */}
                                                 <div className="border-2 border-blue-500 rounded-lg p-1.5 text-center relative bg-white">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase block mb-0 leading-none">BUNDLES</span>
                                                    <span className="font-bold text-slate-900 text-lg flex items-center justify-center gap-1">
                                                        {entry.bundle} <span className="text-slate-400 text-xs">📦</span>
                                                    </span>
                                                    {/* Load Toggle Absolute */}
                                                    <button 
                                                        onClick={() => toggleLoadedStatus(entry.id, entry.isLoaded)}
                                                        className={`absolute -top-2 -right-2 bg-white rounded-full p-0.5 border ${entry.isLoaded ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'}`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                 </div>

                                                 {/* Weight Box */}
                                                 <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100 flex flex-col justify-center">
                                                    <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-0.5">Weight</span>
                                                    <span className="font-bold text-indigo-700 text-base">{entry.weight.toFixed(3)} kg</span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         );
                     })
                 )}
             </div>
        </div>
    </div>
  );
};