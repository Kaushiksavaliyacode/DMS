
import React, { useState, useMemo, useEffect } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES } from '../types';
import { Plus, RotateCcw, CheckCircle2, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Scale, Layers, ArrowLeft, Send, Ruler, User } from 'lucide-react';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
}

// Calendar Helper
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};
const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry 
}) => {
  // --- Calendar State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'day-detail'>('calendar');

  // --- Form State ---
  const [formData, setFormData] = useState({
    partyName: '',
    size: '',
    weight: '',
    productionWeight: '',
    pcs: '',
    bundle: '',
    status: 'pending' as DispatchStatus
  });
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

  // --- Computed Data ---
  const entriesForSelectedDate = useMemo(() => {
      return entries.filter(e => e.date === selectedDate).sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, selectedDate]);

  const entriesByDateMap = useMemo(() => {
      const map = new Map<string, number>();
      entries.forEach(e => {
          map.set(e.date, (map.get(e.date) || 0) + 1);
      });
      return map;
  }, [entries]);

  // --- Handlers ---
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setViewMode('day-detail');
  };

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

    onAddEntry({
      date: selectedDate,
      partyName: formData.partyName,
      size: formData.size,
      weight,
      productionWeight: parseFloat(formData.productionWeight) || 0,
      pcs,
      bundle,
      status: formData.status
    });

    setNotification({ type: 'success', message: "Added successfully" });
    setTimeout(() => setNotification(null), 2000);
    
    // Reset form but keep party/size for rapid entry if needed, or reset all?
    // Resetting mostly everything for clean entry
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

  // --- Render Calendar ---
  const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysCount = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const todayStr = new Date().toISOString().split('T')[0];

      const days = [];
      // Empty slots
      for(let i=0; i<startDay; i++) days.push(<div key={`empty-${i}`} />);
      // Days
      for(let d=1; d<=daysCount; d++) {
          const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const count = entriesByDateMap.get(dateStr) || 0;
          const isToday = dateStr === todayStr;
          
          days.push(
              <button 
                key={d} 
                onClick={() => handleDateClick(d)}
                className={`aspect-square rounded-2xl relative border transition-all flex flex-col items-center justify-center
                    ${isToday ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300'}
                `}
              >
                  <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>{d}</span>
                  {count > 0 && (
                      <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isToday ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {count} Jobs
                      </div>
                  )}
              </button>
          );
      }

      return (
          <div className="animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                      {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex gap-2">
                      <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-slate-100"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-slate-100"><ChevronRight className="w-5 h-5"/></button>
                  </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {days}
              </div>
          </div>
      );
  };

  // --- Render Day Detail ---
  const renderDayDetail = () => {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Form Section */}
              <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                      <button onClick={() => setViewMode('calendar')} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                          <ArrowLeft className="w-6 h-6" />
                      </button>
                      <div>
                          <h2 className="text-xl font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString('default', { weekday: 'short', month: 'long', day: 'numeric' })}</h2>
                          <p className="text-xs font-medium text-slate-500">Log new production entries</p>
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                       
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-slate-800">New Entry</h3>
                           <button onClick={() => setShowAddParty(!showAddParty)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">+ Add Party</button>
                       </div>

                       {showAddParty && (
                           <div className="bg-slate-50 p-3 rounded-xl mb-4 flex gap-2 border border-slate-200 animate-in slide-in-from-top-2">
                               <input type="text" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} placeholder="Party Name" className="flex-1 bg-white px-3 py-2 rounded-lg text-sm outline-none border border-slate-200 focus:border-indigo-500" />
                               <button onClick={handleAddParty} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Save</button>
                           </div>
                       )}

                       <form onSubmit={handleSubmit} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="relative">
                                   <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                   <input list="parties" name="partyName" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} placeholder="Select Party" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                                   <datalist id="parties">{availableParties.map(p => <option key={p} value={p} />)}</datalist>
                               </div>
                               <div className="relative">
                                   <Ruler className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                   <input type="text" name="size" value={formData.size} onChange={e => {
                                       const val = e.target.value;
                                       setFormData(prev => ({ ...prev, size: val, pcs: val.toLowerCase().includes('mm') ? prev.bundle.toString() : prev.pcs }));
                                   }} placeholder="Size (e.g. 12mm)" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                               </div>
                           </div>

                           <div className="grid grid-cols-3 gap-3">
                               <div className="relative group">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Bundles</label>
                                   <input type="number" name="bundle" value={formData.bundle} onChange={e => {
                                       const val = e.target.value;
                                       setFormData(prev => ({ ...prev, bundle: val, pcs: isMMSize ? val : prev.pcs }));
                                   }} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                               </div>
                               {!isMMSize && (
                                   <div className="relative group">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Pcs</label>
                                        <input type="number" name="pcs" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                                   </div>
                               )}
                               <div className="relative group">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase absolute -top-2 left-2 bg-white px-1">Weight</label>
                                   <input type="number" step="0.01" name="weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0.00" />
                               </div>
                           </div>

                           {/* Status Selection - Pill Style */}
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
                               <button type="button" onClick={() => setFormData({partyName: '', size: '', weight: '', productionWeight: '', pcs: '', bundle: '', status: 'pending'})} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><RotateCcw className="w-5 h-5" /></button>
                               <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                   <Plus className="w-5 h-5" /> Add Entry
                               </button>
                           </div>
                       </form>
                  </div>
              </div>

              {/* List Section */}
              <div className="lg:col-span-7 h-full flex flex-col">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-slate-700">Entries for {selectedDate}</h3>
                       <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">{entriesForSelectedDate.length} Items</span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20">
                       {entriesForSelectedDate.length === 0 ? (
                           <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                               <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                               <p className="text-slate-400 text-sm">No entries for this date</p>
                           </div>
                       ) : (
                           entriesForSelectedDate.map(entry => (
                               <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:border-indigo-200 transition-all">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <h4 className="font-bold text-slate-900">{entry.partyName}</h4>
                                           <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                               <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold">{entry.size}</span>
                                               <span>•</span>
                                               <span className={`font-bold uppercase ${entry.status === 'completed' ? 'text-emerald-600' : entry.status === 'running' ? 'text-blue-600' : 'text-amber-600'}`}>{entry.status}</span>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <div className="font-bold text-indigo-600 text-lg">{entry.weight} <span className="text-xs text-slate-400 font-normal">kg</span></div>
                                           <div className="text-xs text-slate-500">{entry.bundle} 📦</div>
                                       </div>
                                   </div>
                                   
                                   <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="text-xs text-slate-400 font-mono">{entry.id.slice(0, 6)}</div>
                                        <div className="flex gap-2">
                                            {entry.status === 'completed' && (
                                                <button onClick={() => sendWhatsApp(entry)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                                            )}
                                            <button onClick={() => onDeleteEntry(entry.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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

  return (
    <div className="max-w-6xl mx-auto pb-20">
        {notification && (
            <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-5 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                <span className="font-bold text-sm">{notification.message}</span>
            </div>
        )}
        
        {viewMode === 'calendar' ? renderCalendar() : renderDayDetail()}
    </div>
  );
};
    