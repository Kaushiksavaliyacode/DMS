
import React, { useState, useMemo, useEffect } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, CheckCircle2, Pencil, Trash2, Layers, Scale, AlertCircle, CheckSquare, Square, X, Calendar, Ruler, User, Package, Send, UserPlus } from 'lucide-react';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
}

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry, onBulkDelete, onBulkStatusUpdate 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Party Management
  const [availableParties, setAvailableParties] = useState<string[]>(MOCK_PARTIES);
  const [newPartyName, setNewPartyName] = useState('');
  const [showAddParty, setShowAddParty] = useState(false);

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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load custom parties from local storage
  useEffect(() => {
      const saved = localStorage.getItem('custom_parties');
      if (saved) {
          setAvailableParties([...MOCK_PARTIES, ...JSON.parse(saved)]);
      }
  }, []);

  const handleAddParty = () => {
      if (newPartyName.trim()) {
          const updatedParties = [...availableParties, newPartyName.trim()];
          // Deduplicate
          const uniqueParties = Array.from(new Set(updatedParties));
          setAvailableParties(uniqueParties);
          
          // Save custom ones (filtering out mocks to avoid dupes in logic, but simplifed here)
          const custom = uniqueParties.filter(p => !MOCK_PARTIES.includes(p));
          localStorage.setItem('custom_parties', JSON.stringify(custom));
          
          setFormData(prev => ({ ...prev, partyName: newPartyName.trim() }));
          setNewPartyName('');
          setShowAddParty(false);
          setNotification({ type: 'success', message: 'New Party Added' });
          setTimeout(() => setNotification(null), 2000);
      }
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  }, [entries]);

  const isMMSize = formData.size.toLowerCase().includes('mm');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (updated.size.toLowerCase().includes('mm')) {
        updated.pcs = updated.bundle;
      }
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      partyName: '',
      size: '',
      weight: '',
      productionWeight: '',
      pcs: '',
      bundle: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partyName || !formData.size || !formData.date) {
      setNotification({ type: 'error', message: "Party Name, Size, and Date are mandatory." });
      return;
    }

    const weight = parseFloat(formData.weight) || 0;
    const productionWeight = parseFloat(formData.productionWeight) || 0;
    const pcs = parseFloat(formData.pcs) || 0;
    const bundle = parseInt(formData.bundle) || 0;

    if (formData.status === 'completed') {
        if (weight <= 0 || bundle <= 0 || pcs <= 0) {
            setNotification({ type: 'error', message: "For Completed jobs, Weight, Bundles, and Pcs are required." });
            return;
        }
    }

    const entryData = {
      date: formData.date,
      partyName: formData.partyName,
      size: formData.size,
      weight,
      productionWeight,
      pcs,
      bundle,
      status: formData.status
    };

    if (editingId) {
      onUpdateEntry(editingId, entryData);
      setNotification({ type: 'success', message: "Job updated successfully." });
    } else {
      onAddEntry(entryData);
      setNotification({ type: 'success', message: "New job created successfully." });
    }

    setTimeout(() => setNotification(null), 3000);
    resetForm();
  };

  const handleEditClick = (entry: DispatchEntry) => {
    setEditingId(entry.id);
    setFormData({
      partyName: entry.partyName,
      size: entry.size,
      weight: entry.weight > 0 ? entry.weight.toString() : '',
      productionWeight: entry.productionWeight > 0 ? entry.productionWeight.toString() : '',
      pcs: entry.pcs > 0 ? entry.pcs.toString() : '',
      bundle: entry.bundle > 0 ? entry.bundle.toString() : '',
      date: entry.date,
      status: entry.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const sendWhatsApp = (entry: DispatchEntry) => {
      const text = `*Job Complete Update*%0A%0A*Party:* ${entry.partyName}%0A*Size:* ${entry.size}%0A*Weight:* ${entry.weight} kg%0A*Bundles:* ${entry.bundle} 📦%0A%0A_Sent via RDMS_`;
      window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const executeBulkDelete = () => {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
  };

  const executeBulkStatus = (status: DispatchStatus) => {
      onBulkStatusUpdate(Array.from(selectedIds), status);
      setSelectedIds(new Set());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 pt-2 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tighter flex items-center gap-3">
               {editingId ? 'Edit Job' : 'User Dashboard'}
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Manage Production & Parties</p>
        </div>
        
        <button 
            onClick={() => setShowAddParty(!showAddParty)}
            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_#fbbf24] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
        >
            <UserPlus className="w-4 h-4" />
            Add Party
        </button>
      </div>

      {/* Add Party Modal Area */}
      {showAddParty && (
          <div className="bg-yellow-100 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-2 items-end animate-in slide-in-from-top-2">
              <div className="flex-1">
                  <label className="text-xs font-black text-black uppercase block mb-1">New Party Name</label>
                  <input 
                    type="text" 
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold outline-none focus:bg-white"
                    placeholder="Enter Company Name"
                  />
              </div>
              <button 
                onClick={handleAddParty}
                className="bg-black text-white px-4 py-2.5 border-2 border-black text-xs font-bold uppercase tracking-wide hover:bg-slate-800"
              >
                  Save
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Entry Form - Desi Style */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                
                <div className="flex items-center gap-2 mb-6 border-b-4 border-black pb-2">
                    <div className="bg-black text-white p-1"><Plus className="w-5 h-5" strokeWidth={3} /></div>
                    <h2 className="text-lg font-black text-black uppercase">Job Entry</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-black uppercase">Party Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-black" />
                                <input
                                    list="party-options"
                                    name="partyName"
                                    value={formData.partyName}
                                    onChange={handleChange}
                                    placeholder="Select Party..."
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                    required
                                />
                                <datalist id="party-options">
                                    {availableParties.map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-black uppercase">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-5 h-5 text-black" />
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black text-black uppercase">Size (e.g. 12mm)</label>
                        <div className="relative">
                            <Ruler className="absolute left-3 top-3 w-5 h-5 text-black" />
                            <input
                                type="text"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                placeholder="Size"
                                className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="h-1 bg-slate-100 border-t-2 border-dashed border-slate-300"></div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-black text-black uppercase">Rolls / Bundles</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-3 w-5 h-5 text-black" />
                                <input
                                    type="number"
                                    name="bundle"
                                    value={formData.bundle}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>
                        
                         {!isMMSize && (
                            <div className="space-y-1">
                                <label className="text-xs font-black text-black uppercase">Total Pcs</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-3 w-5 h-5 text-black" />
                                    <input
                                        type="number"
                                        name="pcs"
                                        value={formData.pcs}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                        min="0"
                                        required={formData.status === 'completed'}
                                    />
                                </div>
                            </div>
                        )}

                         <div className="space-y-1">
                            <label className="text-xs font-black text-black uppercase">Dispatch Wt (kg)</label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3 w-5 h-5 text-black" />
                                <input
                                    type="number"
                                    name="weight"
                                    step="0.01"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-black uppercase flex justify-between">
                                <span>Prod. Wt (kg)</span>
                                <span className="text-[10px] text-slate-400">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3 w-5 h-5 text-black" />
                                <input
                                    type="number"
                                    name="productionWeight"
                                    step="0.01"
                                    value={formData.productionWeight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-black text-sm font-bold text-black focus:bg-yellow-50 outline-none"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-black uppercase">Job Status</label>
                        <div className="flex border-2 border-black bg-white p-1 gap-1">
                            {['pending', 'running', 'completed'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                                        formData.status === s 
                                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_#fbbf24]' 
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-black'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-3 bg-white border-2 border-black text-black font-bold hover:bg-slate-100"
                        >
                            <RotateCcw className="w-5 h-5" strokeWidth={3} />
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                                editingId 
                                ? 'bg-orange-500' 
                                : 'bg-indigo-600'
                            }`}
                        >
                            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Update Job' : 'Create Job'}
                        </button>
                    </div>

                     {notification && (
                        <div className={`p-3 border-2 border-black flex items-center gap-2 text-xs font-bold uppercase ${
                            notification.type === 'success' ? 'bg-emerald-300 text-black' : 'bg-red-300 text-black'
                        }`}>
                            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {notification.message}
                        </div>
                    )}
                </form>
            </div>
        </div>

        {/* Right: Recent List - Bold Cards */}
        <div className="lg:col-span-5 flex flex-col h-full">
             <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-black text-black uppercase">Recent Jobs</h2>
                {entries.length > 0 && (
                     <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                         {selectedIds.size === entries.length ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                         Select All
                     </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[700px] space-y-3 pr-1 pb-10">
                 {sortedEntries.length === 0 ? (
                     <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                         <Layers className="w-8 h-8 mb-2 text-slate-300" />
                         <span className="text-xs font-bold uppercase">No jobs yet</span>
                     </div>
                 ) : (
                     sortedEntries.map(entry => {
                         const isSelected = selectedIds.has(entry.id);
                         return (
                             <div key={entry.id} className={`bg-white p-4 border-2 border-black transition-all ${isSelected ? 'bg-indigo-50 shadow-none translate-x-1 translate-y-1' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-3">
                                         <button onClick={() => toggleSelection(entry.id)} className="text-slate-300 hover:text-black transition-colors">
                                             {isSelected ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5" />}
                                         </button>
                                         <div>
                                             <h3 className="text-sm font-black text-black uppercase leading-tight">{entry.partyName}</h3>
                                             <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.date} • {entry.size}</span>
                                         </div>
                                     </div>
                                     <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black ${
                                         entry.status === 'completed' ? 'bg-emerald-300' :
                                         entry.status === 'running' ? 'bg-blue-300' :
                                         'bg-amber-300'
                                     }`}>
                                         {entry.status}
                                     </span>
                                 </div>
                                 
                                 <div className="flex items-center justify-between pl-8 mt-3">
                                     <div className="flex gap-2 text-xs font-black text-black">
                                         <span className="bg-slate-100 px-2 py-1 border border-slate-300">{entry.bundle} 📦</span>
                                         <span className="bg-slate-100 px-2 py-1 border border-slate-300">{entry.weight} kg</span>
                                     </div>
                                     
                                     <div className="flex items-center gap-2">
                                         {entry.status === 'completed' && (
                                             <button onClick={() => sendWhatsApp(entry)} title="Share on WhatsApp" className="p-1.5 text-black hover:bg-green-100 rounded border border-transparent hover:border-green-600 transition-all">
                                                 <Send className="w-4 h-4" />
                                             </button>
                                         )}
                                         <button onClick={() => handleEditClick(entry)} className="p-1.5 text-black hover:bg-yellow-100 rounded border border-transparent hover:border-yellow-600 transition-all"><Pencil className="w-4 h-4"/></button>
                                         <button onClick={() => onDeleteEntry(entry.id)} className="p-1.5 text-black hover:bg-red-100 rounded border border-transparent hover:border-red-600 transition-all"><Trash2 className="w-4 h-4"/></button>
                                     </div>
                                 </div>
                             </div>
                         )
                     })
                 )}
             </div>
        </div>
      </div>

      {/* Bulk Action Bar - Bold Fixed */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
              <div className="max-w-2xl mx-auto bg-black text-white border-4 border-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase">{selectedIds.size} Selected</span>
                  <div className="flex items-center gap-2">
                       <button onClick={() => executeBulkStatus('pending')} className="px-2 py-1 bg-amber-400 text-black text-[10px] font-black uppercase border border-white hover:bg-amber-300">Pending</button>
                       <button onClick={() => executeBulkStatus('running')} className="px-2 py-1 bg-blue-400 text-black text-[10px] font-black uppercase border border-white hover:bg-blue-300">Running</button>
                       <button onClick={() => executeBulkStatus('completed')} className="px-2 py-1 bg-emerald-400 text-black text-[10px] font-black uppercase border border-white hover:bg-emerald-300">Done</button>
                       <div className="h-4 w-px bg-white/30 mx-1"></div>
                       <button onClick={executeBulkDelete} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5"/></button>
                       <button onClick={() => setSelectedIds(new Set())} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
