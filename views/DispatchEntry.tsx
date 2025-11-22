
import React, { useState, useEffect } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, CheckCircle2, Trash2, Send, Ruler, User, Package, Scale, Pencil, Save, X } from 'lucide-react';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
}

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry 
}) => {
  // --- State ---
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

  const handleSubmit = (e: React.FormEvent) => {
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
      status: formData.status
    };

    if (editingId) {
        onUpdateEntry(editingId, entryData);
        setNotification({ type: 'success', message: "Job updated successfully" });
        setEditingId(null);
    } else {
        onAddEntry(entryData);
        setNotification({ type: 'success', message: "Added successfully" });
    }

    setTimeout(() => setNotification(null), 2000);
    
    // Reset form 
    setFormData(prev => ({
        ...prev,
        weight: '',
        productionWeight: '',
        pcs: '',
        bundle: '',
        status: 'pending'
    }));
  };

  const sendWhatsApp = (entry: DispatchEntry) => {
    const text = `*Order Update - ${entry.date}*%0A%0A*Party:* ${entry.partyName}%0A*Size:* ${entry.size}%0A*Weight:* ${entry.weight} kg%0A*Bundles:* ${entry.bundle} 📦`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isMMSize = formData.size.toLowerCase().includes('mm');
  
  // Show newest entries first
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-7xl mx-auto pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {notification && (
            <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-5 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                <span className="font-bold text-sm">{notification.message}</span>
            </div>
        )}

        {/* Form Section */}
        <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                 
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800">{editingId ? 'Edit Job' : 'New Entry'}</h3>
                     <button onClick={() => setShowAddParty(!showAddParty)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">+ Add Party</button>
                 </div>

                 {showAddParty && (
                     <div className="bg-slate-50 p-3 rounded-xl mb-4 flex gap-2 border border-slate-200 animate-in slide-in-from-top-2">
                         <input type="text" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} placeholder="Party Name" className="flex-1 bg-white px-3 py-2 rounded-lg text-sm outline-none border border-slate-200 focus:border-indigo-500" />
                         <button onClick={handleAddParty} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Save</button>
                     </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1 z-10">Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-4 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                     </div>

                     <div className="relative">
                         <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                         <input list="parties" name="partyName" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} placeholder="Select Party" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                         <datalist id="parties">{availableParties.map(p => <option key={p} value={p} />)}</datalist>
                     </div>
                     
                     <div className="relative">
                         <Ruler className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                         <input type="text" name="size" value={formData.size} onChange={e => {
                             const val = e.target.value;
                             setFormData(prev => ({ ...prev, size: val, pcs: val.toLowerCase().includes('mm') ? prev.bundle.toString() : prev.pcs }));
                         }} placeholder="Size (e.g. 12mm)" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border border-transparent focus:border-indigo-500" />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                         <div className="relative group">
                             <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Bundles</label>
                             <div className="relative">
                                <Package className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                                <input type="number" name="bundle" value={formData.bundle} onChange={e => {
                                    const val = e.target.value;
                                    setFormData(prev => ({ ...prev, bundle: val, pcs: isMMSize ? val : prev.pcs }));
                                }} className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                             </div>
                         </div>
                         <div className="relative group">
                             <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Weight</label>
                             <div className="relative">
                                <Scale className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                                <input type="number" step="0.01" name="weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full pl-8 px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0.00" />
                             </div>
                         </div>
                     </div>

                     {!isMMSize && (
                        <div className="relative group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Pcs</label>
                            <input type="number" name="pcs" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                        </div>
                     )}

                     {/* Status Selection */}
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                         {['pending', 'running', 'completed'].map(s => (
                             <button 
                                  key={s} 
                                  type="button" 
                                  onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${formData.status === s ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                                 {s}
                             </button>
                         ))}
                     </div>

                     <div className="flex gap-3 pt-2">
                         {editingId ? (
                             <button type="button" onClick={cancelEdit} className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl bg-white border border-slate-200"><X className="w-5 h-5" /></button>
                         ) : (
                             <button type="button" onClick={() => setFormData({partyName: '', size: '', weight: '', productionWeight: '', pcs: '', bundle: '', date: new Date().toISOString().split('T')[0], status: 'pending'})} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><RotateCcw className="w-5 h-5" /></button>
                         )}
                         
                         <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                             {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
                             {editingId ? 'Update Job' : 'Add Entry'}
                         </button>
                     </div>
                 </form>
             </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8 h-full flex flex-col">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-700">Job List</h3>
                 <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">{sortedEntries.length} Total</span>
             </div>
             
             <div className="space-y-3">
                 {sortedEntries.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                         <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                         <p className="text-slate-400 text-sm">No jobs found. Add your first entry.</p>
                     </div>
                 ) : (
                     sortedEntries.map(entry => (
                         <div key={entry.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all group relative ${editingId === entry.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                 <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{entry.date}</span>
                                         <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : entry.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{entry.status}</span>
                                     </div>
                                     <h4 className="font-bold text-slate-900 text-lg">{entry.partyName}</h4>
                                     <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Size</span>
                                            <span className="font-bold text-slate-700">{entry.size}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rolls</span>
                                            <span className="font-bold text-slate-700">{entry.bundle} 📦</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Weight</span>
                                            <span className="font-bold text-slate-700">{entry.weight} kg</span>
                                        </div>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                                     {entry.status === 'completed' && (
                                         <button onClick={() => sendWhatsApp(entry)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Share WhatsApp"><Send className="w-4 h-4" /></button>
                                     )}
                                     <button onClick={() => handleEditClick(entry)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                     <button onClick={() => onDeleteEntry(entry.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
             </div>
        </div>
    </div>
  );
};
