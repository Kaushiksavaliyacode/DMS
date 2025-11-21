import React, { useState, useMemo } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, CheckCircle2, Pencil, Trash2, Layers, Scale, AlertCircle, CheckSquare, Square, X, Calendar, Ruler, User, Package, Clock, Activity, CheckCircle } from 'lucide-react';

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

  // Sort entries by timestamp descending (Newest First)
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
      if (selectedIds.size === entries.length && entries.length > 0) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(entries.map(e => e.id)));
      }
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 pt-2 font-sans">
      
      {/* Header with Context */}
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               {editingId ? 'Edit Dispatch' : 'New Dispatch'}
               <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-200">
                 Entry Form
               </span>
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1 ml-1">Enter production details for today's dispatch</p>
        </div>
      </div>

      {/* Main Layout: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Input Form - Premium Card Style */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden">
                {/* Decorative Background Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50"></div>
                
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    
                    {/* Primary Info */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Party Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        list="party-options"
                                        name="partyName"
                                        value={formData.partyName}
                                        onChange={handleChange}
                                        placeholder="Select Client..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                                        required
                                    />
                                    <datalist id="party-options">
                                        {MOCK_PARTIES.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Size & Dimensions</label>
                            <div className="relative group">
                                <Ruler className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    placeholder="e.g. 12mm or 12x12"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Rolls / Bundles</label>
                            <div className="relative group">
                                <Package className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="number"
                                    name="bundle"
                                    value={formData.bundle}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>
                        
                         {!isMMSize && (
                            <div className="space-y-2 animate-in fade-in zoom-in">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Total Pcs</label>
                                <div className="relative group">
                                    <Layers className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="number"
                                        name="pcs"
                                        value={formData.pcs}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        min="0"
                                        required={formData.status === 'completed'}
                                    />
                                </div>
                            </div>
                        )}

                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Dispatch Wt (kg)</label>
                            <div className="relative group">
                                <Scale className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="number"
                                    name="weight"
                                    step="0.01"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between ml-1">
                                <span>Prod. Wt (kg)</span>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-bold">Optional</span>
                            </label>
                            <div className="relative group">
                                <Scale className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="number"
                                    name="productionWeight"
                                    step="0.01"
                                    value={formData.productionWeight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-50/80 p-1.5 rounded-2xl flex shadow-inner">
                        {['pending', 'running', 'completed'].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                className={`flex-1 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all duration-300 ${
                                    formData.status === s 
                                    ? 'bg-white text-indigo-600 shadow-md shadow-slate-200 scale-100' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-5 py-3.5 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 ${
                                editingId 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200' 
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200'
                            }`}
                        >
                            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Update Job' : 'Create Job'}
                        </button>
                    </div>

                     {notification && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${
                            notification.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {notification.message}
                        </div>
                    )}
                </form>
            </div>
        </div>

        {/* Right: Recent List */}
        <div className="lg:col-span-5 flex flex-col h-full">
             <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xl font-black text-slate-800">Recent Activity</h2>
                {entries.length > 0 && (
                     <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
                         {selectedIds.size === entries.length ? <CheckSquare className="w-3.5 h-3.5"/> : <Square className="w-3.5 h-3.5"/>}
                         Select All
                     </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4 pr-2 pb-10 no-scrollbar">
                 {sortedEntries.length === 0 ? (
                     <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                         <Layers className="w-12 h-12 mb-3 text-slate-200" />
                         <span className="text-sm font-bold">No recent jobs</span>
                     </div>
                 ) : (
                     sortedEntries.map(entry => {
                         const isSelected = selectedIds.has(entry.id);
                         return (
                             <div key={entry.id} className={`bg-white p-5 rounded-[1.5rem] border-2 transition-all duration-300 group ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30' : 'border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-indigo-100 hover:-translate-x-1'}`}>
                                 <div className="flex justify-between items-start mb-3">
                                     <div className="flex items-center gap-4">
                                         <button onClick={() => toggleSelection(entry.id)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                                             {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                         </button>
                                         <div>
                                             <h3 className="text-base font-black text-slate-800 leading-tight">{entry.partyName}</h3>
                                             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{entry.date} • {entry.size}</span>
                                         </div>
                                     </div>
                                     <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                                         entry.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                         entry.status === 'running' ? 'bg-blue-100 text-blue-600' :
                                         'bg-amber-100 text-amber-600'
                                     }`}>
                                         {entry.status}
                                     </span>
                                 </div>
                                 
                                 <div className="flex items-center justify-between pl-9">
                                     <div className="flex gap-2 text-xs font-bold text-slate-600">
                                         <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{entry.bundle} 📦</span>
                                         <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{entry.weight} kg</span>
                                     </div>
                                     
                                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                         <button onClick={() => handleEditClick(entry)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
                                         <button onClick={() => onDeleteEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                     </div>
                                 </div>
                             </div>
                         )
                     })
                 )}
             </div>
        </div>
      </div>

      {/* Bulk Action Bar - Floating Glass */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-20 duration-500">
              <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-full px-8 py-4 shadow-2xl shadow-slate-900/20 flex items-center gap-6 border border-white/10">
                  <span className="text-sm font-bold whitespace-nowrap">{selectedIds.size} Selected</span>
                  <div className="h-5 w-px bg-white/20"></div>
                  <div className="flex items-center gap-3">
                       <button onClick={() => executeBulkStatus('pending')} title="Mark Pending" className="p-2 hover:bg-white/10 rounded-full transition-colors text-amber-400"><Clock className="w-5 h-5"/></button>
                       <button onClick={() => executeBulkStatus('running')} title="Mark Running" className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"><Activity className="w-5 h-5"/></button>
                       <button onClick={() => executeBulkStatus('completed')} title="Mark Complete" className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"><CheckCircle className="w-5 h-5"/></button>
                       <div className="h-5 w-px bg-white/20 mx-2"></div>
                       <button onClick={executeBulkDelete} title="Delete" className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400"><Trash2 className="w-5 h-5"/></button>
                  </div>
                  <button onClick={() => setSelectedIds(new Set())} className="ml-4 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
          </div>
      )}

    </div>
  );
};