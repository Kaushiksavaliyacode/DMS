
import React, { useState } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, FileText, CheckCircle2, Pencil, Trash2, Layers, Scale, AlertCircle, CheckSquare, Square, X, Calendar, Ruler, User, Package } from 'lucide-react';

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

  const getStatusColor = (status: DispatchStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'running': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{editingId ? 'Edit Job' : 'New Entry'}</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your daily production dispatch</p>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        {editingId && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse z-10"></div>}
        
        <div className="p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Job Details */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner">1</div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Client & Product Info</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Party Name */}
                  <div className="md:col-span-5 relative group">
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Party Name</label>
                     <div className="relative">
                        <User className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                        <input
                          list="party-options"
                          name="partyName"
                          value={formData.partyName}
                          onChange={handleChange}
                          placeholder="Select Client..."
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all placeholder:text-slate-400 shadow-sm"
                          required
                        />
                     </div>
                     <datalist id="party-options">
                        {MOCK_PARTIES.map(p => <option key={p} value={p} />)}
                     </datalist>
                  </div>

                  {/* Size */}
                  <div className="md:col-span-4 relative group">
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Size</label>
                     <div className="relative">
                        <Ruler className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                        <input
                          type="text"
                          name="size"
                          value={formData.size}
                          onChange={handleChange}
                          placeholder="e.g. 12mm"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all placeholder:text-slate-400 shadow-sm"
                          required
                        />
                     </div>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-3 relative group">
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Date</label>
                     <div className="relative">
                       <Calendar className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                       <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all shadow-sm"
                        required
                      />
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 2: Metrics */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shadow-inner">2</div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quantities & Weights</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Bundles */}
                  <div className="relative group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Rolls / Bundles</label>
                    <div className="relative">
                        <Package className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                        <input
                          type="number"
                          name="bundle"
                          value={formData.bundle}
                          onChange={handleChange}
                          placeholder="0"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all shadow-sm"
                          min="0"
                          required={formData.status === 'completed'}
                        />
                    </div>
                  </div>

                   {/* Pcs (Conditional) */}
                  {!isMMSize && (
                    <div className="relative group animate-in fade-in zoom-in duration-300">
                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Total Pcs</label>
                        <div className="relative">
                            <Layers className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                            <input
                            type="number"
                            name="pcs"
                            value={formData.pcs}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all shadow-sm"
                            min="0"
                            required={formData.status === 'completed'}
                            />
                        </div>
                    </div>
                  )}

                  {/* Dispatch Weight */}
                  <div className="relative group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Dispatch Wt (kg)</label>
                    <div className="relative">
                        <Scale className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                        <input
                          type="number"
                          name="weight"
                          step="0.01"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all shadow-sm"
                          min="0"
                          required={formData.status === 'completed'}
                        />
                    </div>
                  </div>

                  {/* Production Weight (Optional) */}
                  <div className="relative group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex justify-between ml-1">
                        <span>Prod. Wt (kg)</span>
                        <span className="text-slate-400 bg-slate-100 px-1.5 rounded text-[9px] tracking-wide font-bold">OPTIONAL</span>
                    </label>
                    <div className="relative">
                        <Scale className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                        <input
                          type="number"
                          name="productionWeight"
                          step="0.01"
                          value={formData.productionWeight}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-2xl text-sm font-bold text-slate-800 transition-all shadow-sm"
                          min="0"
                        />
                    </div>
                  </div>
               </div>
            </div>

            {/* Status */}
            <div className="space-y-2 pt-4">
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block ml-1">Current Status</label>
                <div className="flex p-1.5 bg-slate-50 rounded-2xl w-full md:w-fit border border-slate-100">
                    {['pending', 'running', 'completed'].map((s) => (
                            <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                            className={`text-xs font-bold px-6 py-3 rounded-xl capitalize transition-all duration-300 ${
                                formData.status === s 
                                ? 'bg-white text-indigo-600 shadow-md shadow-slate-200 transform scale-105' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                            }`}
                            >
                            {s}
                            </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-50 mt-8">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 group ${
                  editingId 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30 hover:shadow-amber-500/40' 
                    : 'bg-slate-900 shadow-slate-900/20 hover:shadow-slate-900/30'
                }`}
              >
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />}
                {editingId ? 'Update Job' : 'Create Job'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-colors hover:border-slate-200"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {notification && (
              <div className={`p-4 rounded-2xl flex items-center animate-in slide-in-from-top-2 duration-300 ${
                notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                <span className="font-bold text-sm">{notification.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Job List Section */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Jobs</h2>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide border border-slate-200">{entries.length}</span>
            </div>
            
            {/* Select All Button */}
             {entries.length > 0 && (
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    {selectedIds.size === entries.length && entries.length > 0 ? (
                        <CheckSquare className="w-4 h-4 mr-2 text-indigo-600" />
                    ) : (
                        <Square className="w-4 h-4 mr-2" />
                    )}
                    Select All
                </button>
            )}
        </div>
        
        <div className="grid gap-4 relative">
          {entries.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
               <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Layers className="w-8 h-8 text-slate-300" />
               </div>
               <p className="font-bold text-slate-400 text-base">No jobs available</p>
               <p className="text-xs text-slate-300 mt-1">Create a new job to see it here</p>
             </div>
          ) : (
            entries.map((entry) => {
              const isSelected = selectedIds.has(entry.id);
              return (
              <div 
                key={entry.id} 
                className={`bg-white p-1 rounded-[2rem] shadow-sm border-2 transition-all duration-300 group relative ${
                    isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/10 z-10 scale-[1.01]' : 'border-transparent hover:border-indigo-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                <div className="bg-white rounded-[1.8rem] p-6 relative overflow-hidden">
                  {/* Status Indicator Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                     entry.status === 'completed' ? 'bg-emerald-500' : entry.status === 'running' ? 'bg-indigo-500' : 'bg-amber-400'
                  }`}></div>

                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-4">
                  
                    {/* Checkbox Overlay */}
                    <div className="absolute right-6 top-6 lg:relative lg:right-auto lg:top-auto lg:mr-2">
                        <button onClick={() => toggleSelection(entry.id)} className="text-slate-200 hover:text-indigo-600 transition-colors">
                            {isSelected ? <CheckSquare className="w-6 h-6 text-indigo-600" /> : <Square className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">#{entry.id.slice(0,5)}</span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {entry.date}
                            </span>
                            <div className={`ml-auto lg:ml-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(entry.status)}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${entry.status === 'running' ? 'bg-blue-600 animate-pulse' : 'bg-current'}`}></div>
                                {entry.status}
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-extrabold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">{entry.partyName}</h3>
                        
                        <div className="flex flex-wrap gap-3">
                            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1 min-w-[90px] hover:bg-white transition-colors">
                                <span className="block text-[9px] text-slate-400 uppercase font-extrabold mb-1">Size</span>
                                <span className="font-bold text-slate-700 text-xs">{entry.size}</span>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1 min-w-[90px] hover:bg-white transition-colors">
                                <span className="block text-[9px] text-slate-400 uppercase font-extrabold mb-1">Rolls</span>
                                <span className="font-bold text-slate-700 text-xs">{entry.bundle || '-'}</span>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1 min-w-[90px] hover:bg-white transition-colors">
                                <span className="block text-[9px] text-slate-400 uppercase font-extrabold mb-1">Pcs</span>
                                <span className="font-bold text-slate-700 text-xs">{entry.pcs}</span>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex-1 min-w-[90px] hover:bg-white transition-colors">
                                <span className="block text-[9px] text-slate-400 uppercase font-extrabold mb-1">Weight</span>
                                <span className="font-bold text-slate-700 text-xs">{entry.weight > 0 ? `${entry.weight} kg` : '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        {/* Status Pills */}
                        <div className="flex bg-slate-50 p-1 rounded-xl w-full sm:w-auto border border-slate-100">
                        <button
                            onClick={() => onUpdateEntry(entry.id, { status: 'pending' })}
                            className={`flex-1 sm:flex-none w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            entry.status === 'pending' ? 'bg-white text-amber-500 shadow-sm ring-1 ring-black/5' : 'text-slate-300 hover:bg-white hover:text-slate-500'
                            }`}
                            title="Pending"
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                        </button>
                        <button
                            onClick={() => onUpdateEntry(entry.id, { status: 'running' })}
                            className={`flex-1 sm:flex-none w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            entry.status === 'running' ? 'bg-white text-indigo-500 shadow-sm ring-1 ring-black/5' : 'text-slate-300 hover:bg-white hover:text-slate-500'
                            }`}
                            title="Running"
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                        </button>
                        <button
                            onClick={() => onUpdateEntry(entry.id, { status: 'completed' })}
                            className={`flex-1 sm:flex-none w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            entry.status === 'completed' ? 'bg-white text-emerald-500 shadow-sm ring-1 ring-black/5' : 'text-slate-300 hover:bg-white hover:text-slate-500'
                            }`}
                            title="Completed"
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                        </button>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button 
                                onClick={() => handleEditClick(entry)}
                                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                                title="Edit"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onDeleteEntry(entry.id)}
                                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                title="Delete"
                            >
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
          <div className="fixed bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-2xl shadow-indigo-900/30 flex items-center gap-3 pl-4 border border-slate-800/50 backdrop-blur-xl ring-1 ring-white/10 max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 mr-4">
                      <div className="bg-indigo-500 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-500/50">
                          {selectedIds.size}
                      </div>
                      <span className="text-xs font-bold text-slate-300 hidden sm:inline">Selected</span>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-700 mx-1 hidden sm:block"></div>

                  <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => executeBulkStatus('pending')}
                        className="px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => executeBulkStatus('running')}
                        className="px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        Run
                      </button>
                      <button 
                        onClick={() => executeBulkStatus('completed')}
                        className="px-3 py-2 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        Done
                      </button>
                  </div>
                  
                  <div className="ml-auto flex items-center gap-2">
                      <button 
                          onClick={executeBulkDelete}
                          className="flex items-center bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20"
                      >
                          Delete
                      </button>
                      <button 
                          onClick={() => setSelectedIds(new Set())}
                          className="p-2.5 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
