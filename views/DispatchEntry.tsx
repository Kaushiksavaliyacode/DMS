
import React, { useState } from 'react';
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{editingId ? 'Edit Job' : 'New Entry'}</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your daily production dispatch</p>
          </div>
        </div>
      </div>

      {/* Entry Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        {editingId && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse z-10"></div>}
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Job Details */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">1</div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Client & Product</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all placeholder:text-slate-400 outline-none"
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all placeholder:text-slate-400 outline-none"
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
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none"
                        required
                      />
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 2: Metrics */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">2</div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quantities & Weights</h3>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none"
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
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none"
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none"
                          min="0"
                          required={formData.status === 'completed'}
                        />
                    </div>
                  </div>

                  {/* Production Weight (Optional) */}
                  <div className="relative group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex justify-between ml-1">
                        <span>Prod. Wt (kg)</span>
                        <span className="text-indigo-400 bg-indigo-50 px-2 rounded-md text-[9px] tracking-wide font-extrabold">OPTIONAL</span>
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
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-sm font-bold text-slate-800 transition-all outline-none"
                          min="0"
                        />
                    </div>
                  </div>
               </div>
            </div>

            {/* Status Selector - High Contrast & Visible Text */}
            <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-3 block ml-1">Job Status</label>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'pending'})}
                        className={`relative overflow-hidden py-3 px-2 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 group ${
                            formData.status === 'pending' 
                            ? 'border-amber-400 bg-amber-50 text-amber-800' 
                            : 'border-slate-100 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/30'
                        }`}
                    >
                        <Clock className={`w-5 h-5 mb-1 ${formData.status === 'pending' ? 'fill-amber-400 text-amber-700' : 'text-slate-300'}`} />
                        <span className="text-xs font-black uppercase tracking-wider">Pending</span>
                        {formData.status === 'pending' && <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full"></div>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'running'})}
                        className={`relative overflow-hidden py-3 px-2 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 group ${
                            formData.status === 'running' 
                            ? 'border-blue-400 bg-blue-50 text-blue-800' 
                            : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                    >
                        <Activity className={`w-5 h-5 mb-1 ${formData.status === 'running' ? 'fill-blue-400 text-blue-700' : 'text-slate-300'}`} />
                        <span className="text-xs font-black uppercase tracking-wider">Running</span>
                        {formData.status === 'running' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'completed'})}
                        className={`relative overflow-hidden py-3 px-2 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 group ${
                            formData.status === 'completed' 
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800' 
                            : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/30'
                        }`}
                    >
                        <CheckCircle className={`w-5 h-5 mb-1 ${formData.status === 'completed' ? 'fill-emerald-400 text-emerald-700' : 'text-slate-300'}`} />
                        <span className="text-xs font-black uppercase tracking-wider">Complete</span>
                        {formData.status === 'completed' && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 mt-6">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 group ${
                  editingId 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30' 
                    : 'bg-slate-900 shadow-slate-900/30'
                }`}
              >
                {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />}
                {editingId ? 'Update Job' : 'Create Job'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 border-2 border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors hover:border-slate-300"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {notification && (
              <div className={`p-4 rounded-xl flex items-center animate-in slide-in-from-top-2 duration-300 ${
                notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                <span className="font-bold text-sm">{notification.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Job List Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Jobs</h2>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-slate-200">{entries.length}</span>
            </div>
            
             {entries.length > 0 && (
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
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
        
        <div className="grid gap-4 relative">
          {entries.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
               <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-slate-300" />
               </div>
               <p className="font-bold text-slate-400 text-base">No jobs available</p>
             </div>
          ) : (
            entries.map((entry) => {
              const isSelected = selectedIds.has(entry.id);
              return (
              <div 
                key={entry.id} 
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 group relative overflow-hidden ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 z-10' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                  {/* Colored Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                     entry.status === 'completed' ? 'bg-emerald-500' : entry.status === 'running' ? 'bg-blue-500' : 'bg-amber-400'
                  }`}></div>

                  <div className="p-5 pl-6">
                      <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{entry.id.slice(0,4)}</span>
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {entry.date}
                              </span>
                          </div>
                          <button onClick={() => toggleSelection(entry.id)} className="text-slate-300 hover:text-indigo-600 -mt-1 -mr-1 p-2">
                                {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                          </button>
                      </div>
                      
                      <h3 className="text-base font-extrabold text-slate-800 mb-3 pr-8 line-clamp-2">{entry.partyName}</h3>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Size</div>
                              <div className="text-xs font-bold text-slate-700">{entry.size}</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rolls</div>
                              <div className="text-xs font-bold text-slate-700">{entry.bundle || '-'}</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Weight</div>
                              <div className="text-xs font-bold text-indigo-600">{entry.weight > 0 ? entry.weight : '-'}</div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                           {/* Status Pill */}
                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                               entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                               entry.status === 'running' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                               'bg-amber-100 text-amber-700 border-amber-200'
                           }`}>
                                {entry.status}
                           </span>

                           <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEditClick(entry)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDeleteEntry(entry.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
          <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-50 animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 pl-5 border border-slate-800 ring-1 ring-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                      <div className="bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {selectedIds.size}
                      </div>
                      <span className="text-xs font-bold text-slate-300">Selected</span>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                       <button onClick={() => executeBulkStatus('pending')} className="p-2 rounded-lg hover:bg-slate-800 text-amber-400 transition-colors" title="Mark Pending"><Clock className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('running')} className="p-2 rounded-lg hover:bg-slate-800 text-blue-400 transition-colors" title="Mark Running"><Activity className="w-4 h-4"/></button>
                       <button onClick={() => executeBulkStatus('completed')} className="p-2 rounded-lg hover:bg-slate-800 text-emerald-400 transition-colors" title="Mark Complete"><CheckCircle className="w-4 h-4"/></button>
                       <div className="w-px h-6 bg-slate-700 mx-1"></div>
                       <button onClick={executeBulkDelete} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                       <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-2 text-slate-500 hover:text-white" title="Cancel"><X className="w-4 h-4"/></button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
