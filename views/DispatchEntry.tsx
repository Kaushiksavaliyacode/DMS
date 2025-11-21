
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 pt-4 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{editingId ? 'Edit Job' : 'Create Job'}</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your daily production dispatch</p>
          </div>
        </div>
      </div>

      {/* Entry Form Card - Soft UI */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Party Name */}
                  <div className="md:col-span-5 space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Party Name</label>
                     <div className="relative group">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          list="party-options"
                          name="partyName"
                          value={formData.partyName}
                          onChange={handleChange}
                          placeholder="Select Client..."
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                          required
                        />
                     </div>
                     <datalist id="party-options">
                        {MOCK_PARTIES.map(p => <option key={p} value={p} />)}
                     </datalist>
                  </div>

                  {/* Size */}
                  <div className="md:col-span-4 space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Size</label>
                     <div className="relative group">
                        <Ruler className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="text"
                          name="size"
                          value={formData.size}
                          onChange={handleChange}
                          placeholder="e.g. 12mm"
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                          required
                        />
                     </div>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-3 space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                     <div className="relative group">
                       <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                       <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                        required
                      />
                     </div>
                  </div>
            </div>

            {/* Section 2: Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Bundles */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Rolls / Bundles</label>
                    <div className="relative group">
                        <Package className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="number"
                          name="bundle"
                          value={formData.bundle}
                          onChange={handleChange}
                          placeholder="0"
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                          min="0"
                          required={formData.status === 'completed'}
                        />
                    </div>
                  </div>

                   {/* Pcs (Conditional) */}
                  {!isMMSize && (
                    <div className="space-y-1.5 animate-in fade-in zoom-in duration-300">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Total Pcs</label>
                        <div className="relative group">
                            <Layers className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                            type="number"
                            name="pcs"
                            value={formData.pcs}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                            min="0"
                            required={formData.status === 'completed'}
                            />
                        </div>
                    </div>
                  )}

                  {/* Dispatch Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dispatch Wt (kg)</label>
                    <div className="relative group">
                        <Scale className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="number"
                          name="weight"
                          step="0.01"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                          min="0"
                          required={formData.status === 'completed'}
                        />
                    </div>
                  </div>

                  {/* Production Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex justify-between ml-1">
                        <span>Prod. Wt (kg)</span>
                        <span className="text-slate-300 text-[10px]">OPTIONAL</span>
                    </label>
                    <div className="relative group">
                        <Scale className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="number"
                          name="productionWeight"
                          step="0.01"
                          value={formData.productionWeight}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none"
                          min="0"
                        />
                    </div>
                  </div>
            </div>

            {/* Status & Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
                {/* Status Selector */}
                <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
                    {['pending', 'running', 'completed'].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                formData.status === s 
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                     <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-3.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    
                    <button
                        type="submit"
                        className={`flex-1 md:flex-none flex items-center justify-center text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${
                        editingId 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30'
                        }`}
                    >
                        {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                        {editingId ? 'Update Job' : 'Create Job'}
                    </button>
                </div>
            </div>

            {notification && (
              <div className={`p-4 rounded-xl flex items-center animate-in slide-in-from-top-2 duration-300 ${
                notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                <span className="font-bold text-sm">{notification.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Job List Section - Card Style List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
                <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{entries.length} Jobs</span>
            </div>
            
             {entries.length > 0 && (
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    {selectedIds.size === entries.length && entries.length > 0 ? (
                        <CheckSquare className="w-4 h-4 mr-1.5 text-indigo-600" />
                    ) : (
                        <Square className="w-4 h-4 mr-1.5" />
                    )}
                    Select All
                </button>
            )}
        </div>
        
        <div className="flex flex-col gap-3">
          {sortedEntries.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
               <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
               <p className="font-medium text-slate-400 text-sm">No jobs today</p>
             </div>
          ) : (
            sortedEntries.map((entry) => {
              const isSelected = selectedIds.has(entry.id);
              return (
              <div 
                key={entry.id} 
                className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border transition-all duration-200 group relative ${
                    isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-100 hover:border-indigo-200'
                }`}
              >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Select Box */}
                      <button onClick={() => toggleSelection(entry.id)} className="text-slate-300 hover:text-indigo-600 pt-1 sm:pt-0">
                            {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                          <div className="col-span-2 md:col-span-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-0.5">
                                  <Calendar className="w-3 h-3" /> {entry.date}
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 truncate">{entry.partyName}</h3>
                          </div>

                          <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Size</span>
                              <span className="text-sm font-bold text-slate-700">{entry.size}</span>
                          </div>

                          <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Details</span>
                              <span className="text-sm font-bold text-slate-700">{entry.bundle || 0} Rolls • {entry.weight} kg</span>
                          </div>

                          <div className="flex justify-between md:justify-end items-center col-span-2 md:col-span-1">
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                   entry.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                   entry.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                   'bg-amber-50 text-amber-700 border-amber-100'
                               }`}>
                                    {entry.status}
                               </span>
                               
                               <div className="flex gap-1 ml-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(entry)} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDeleteEntry(entry.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-50 animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 px-5 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300">{selectedIds.size} Selected</span>
                  <div className="flex items-center gap-2">
                       <button onClick={() => executeBulkStatus('pending')} className="p-2 rounded-lg hover:bg-slate-800 text-amber-400 transition-colors"><Clock className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('running')} className="p-2 rounded-lg hover:bg-slate-800 text-blue-400 transition-colors"><Activity className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('completed')} className="p-2 rounded-lg hover:bg-slate-800 text-emerald-400 transition-colors"><CheckCircle className="w-4 h-4"/></button>
                       <div className="w-px h-4 bg-slate-700 mx-1"></div>
                       <button onClick={executeBulkDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                       <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-2 text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
