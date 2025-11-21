
import React, { useState, useMemo } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, FileText, CheckCircle2, Pencil, Trash2, Layers, Scale, AlertCircle, CheckSquare, Square, X, Calendar, Ruler, User, Package, Clock, Activity, CheckCircle } from 'lucide-react';

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

  // Sort entries by timestamp descending (Newest First) for display
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 pt-2 font-inter">
      
      {/* Header with Context */}
      <div className="flex items-center justify-between px-2">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
               {editingId ? 'Edit Dispatch' : 'New Dispatch'}
               <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-wide border border-indigo-100">
                 Entry Form
               </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Enter production details for today's dispatch</p>
        </div>
      </div>

      {/* Main Layout: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Primary Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Party Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        list="party-options"
                                        name="partyName"
                                        value={formData.partyName}
                                        onChange={handleChange}
                                        placeholder="Select Client..."
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300 transition-all"
                                        required
                                    />
                                    <datalist id="party-options">
                                        {MOCK_PARTIES.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Size & Dimensions</label>
                            <div className="relative">
                                <Ruler className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    placeholder="e.g. 12mm or 12x12"
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50"></div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rolls / Bundles</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    name="bundle"
                                    value={formData.bundle}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>
                        
                         {!isMMSize && (
                            <div className="space-y-1.5 animate-in fade-in zoom-in">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pcs</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        name="pcs"
                                        value={formData.pcs}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        min="0"
                                        required={formData.status === 'completed'}
                                    />
                                </div>
                            </div>
                        )}

                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dispatch Wt (kg)</label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    name="weight"
                                    step="0.01"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                    required={formData.status === 'completed'}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                <span>Prod. Wt (kg)</span>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">OPTIONAL</span>
                            </label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    name="productionWeight"
                                    step="0.01"
                                    value={formData.productionWeight}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-0 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-50 p-1 rounded-xl flex">
                        {['pending', 'running', 'completed'].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                    formData.status === s 
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-3 bg-slate-50 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                                editingId 
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' 
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                        >
                            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Update Job' : 'Create Job'}
                        </button>
                    </div>

                     {notification && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${
                            notification.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {notification.message}
                        </div>
                    )}
                </form>
            </div>
        </div>

        {/* Right: Recent List */}
        <div className="lg:col-span-5 flex flex-col h-full">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
                {entries.length > 0 && (
                     <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                         {selectedIds.size === entries.length ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
                         Select All
                     </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[600px] space-y-3 pr-1 no-scrollbar">
                 {sortedEntries.length === 0 ? (
                     <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                         <Layers className="w-8 h-8 mb-2 opacity-50" />
                         <span className="text-sm">No jobs yet</span>
                     </div>
                 ) : (
                     sortedEntries.map(entry => {
                         const isSelected = selectedIds.has(entry.id);
                         return (
                             <div key={entry.id} className={`bg-white p-4 rounded-xl border transition-all group ${isSelected ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-3">
                                         <button onClick={() => toggleSelection(entry.id)} className="text-slate-300 hover:text-indigo-600">
                                             {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                         </button>
                                         <div>
                                             <h3 className="text-sm font-bold text-slate-800 leading-tight">{entry.partyName}</h3>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.date} • {entry.size}</span>
                                         </div>
                                     </div>
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                         entry.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                         entry.status === 'running' ? 'bg-blue-50 text-blue-600' :
                                         'bg-amber-50 text-amber-600'
                                     }`}>
                                         {entry.status}
                                     </span>
                                 </div>
                                 
                                 <div className="flex items-center justify-between pl-8">
                                     <div className="flex gap-3 text-xs font-medium text-slate-600">
                                         <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{entry.bundle} 📦</span>
                                         <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{entry.weight} kg</span>
                                     </div>
                                     
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={() => handleEditClick(entry)} className="p-1 text-slate-400 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5"/></button>
                                         <button onClick={() => onDeleteEntry(entry.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                                     </div>
                                 </div>
                             </div>
                         )
                     })
                 )}
             </div>
        </div>
      </div>

      {/* Bulk Action Bar - Floating */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
              <div className="bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 border border-slate-800">
                  <span className="text-xs font-bold whitespace-nowrap">{selectedIds.size} Selected</span>
                  <div className="h-4 w-px bg-slate-700"></div>
                  <div className="flex items-center gap-2">
                       <button onClick={() => executeBulkStatus('pending')} title="Mark Pending" className="hover:text-amber-400 transition-colors"><Clock className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('running')} title="Mark Running" className="hover:text-blue-400 transition-colors"><Activity className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('completed')} title="Mark Complete" className="hover:text-emerald-400 transition-colors"><CheckCircle className="w-4 h-4"/></button>
                       <div className="h-4 w-px bg-slate-700 mx-1"></div>
                       <button onClick={executeBulkDelete} title="Delete" className="hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
              </div>
          </div>
      )}

    </div>
  );
};
