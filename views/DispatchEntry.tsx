import React, { useState, useEffect, useMemo } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES, ChallanEntry } from '../types';
import { Plus, RotateCcw, CheckCircle2, Trash2, Send, Ruler, User, Package, Scale, Pencil, Save, X, ScrollText, Receipt, AlertCircle, Circle } from 'lucide-react';
import { ChallanView } from './Challan';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => Promise<void> | void;
  onDeleteEntry: (id: string) => Promise<void> | void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
  challanData?: ChallanEntry[];
  onAddChallan?: (entry: any) => Promise<void> | void;
  onUpdateChallan?: (id: string, entry: any) => Promise<void> | void;
  onDeleteChallan?: (id: string) => Promise<void> | void;
}

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry,
    challanData = [], onAddChallan, onUpdateChallan, onDeleteChallan
}) => {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'challan'>('dispatch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ partyName: '', size: '', weight: '', productionWeight: '', pcs: '', bundle: '', date: new Date().toISOString().split('T')[0], status: 'pending' as DispatchStatus });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableParties, setAvailableParties] = useState<string[]>(MOCK_PARTIES);
  const [newPartyName, setNewPartyName] = useState('');
  const [showAddParty, setShowAddParty] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('custom_parties');
    if (saved) setAvailableParties([...MOCK_PARTIES, ...JSON.parse(saved)]);
  }, []);

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
    setFormData({ partyName: entry.partyName, size: entry.size, weight: entry.weight.toString(), productionWeight: entry.productionWeight?.toString() || '', pcs: entry.pcs?.toString() || '', bundle: entry.bundle?.toString() || '', date: entry.date, status: entry.status || 'pending' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({ ...prev, partyName: '', size: '', weight: '', productionWeight: '', pcs: '', bundle: '', status: 'pending' }));
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
    const entryData = { date: formData.date, partyName: formData.partyName, size: formData.size, weight, productionWeight: parseFloat(formData.productionWeight) || 0, pcs, bundle, status: formData.status, isLoaded: false };
    setIsSubmitting(true);
    try {
      if (editingId) {
        const existing = entries.find(e => e.id === editingId);
        await onUpdateEntry(editingId, { ...entryData, isLoaded: existing?.isLoaded });
        setNotification({ type: 'success', message: "Updated" });
        setEditingId(null);
      } else {
        await onAddEntry(entryData);
        setNotification({ type: 'success', message: "Added" });
      }
      setFormData(prev => ({ ...prev, weight: '', productionWeight: '', pcs: '', bundle: '', status: 'pending' }));
    } catch (error: any) {
      setNotification({ type: 'error', message: "Save Failed" });
      alert(error.message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };
  
  const sendBulkWhatsApp = (items: DispatchEntry[]) => {
    if (items.length === 0) return;
    const { date, partyName } = items[0];
    let totalWt = 0, totalBdl = 0;
    let message = `*DISPATCH UPDATE*\nDate: ${date}\nParty: ${partyName}\n\n*Packing List:*\n`;
    items.forEach(item => {
      message += `• ${item.size}: ${item.weight.toFixed(3)} kg | ${item.bundle} 📦\n`;
      totalWt += item.weight;
      totalBdl += item.bundle;
    });
    message += `\n*Total Wt:* ${totalWt.toFixed(3)} kg\n*Total Bundles:* ${totalBdl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleLoadedStatus = async (id: string, currentStatus: boolean | undefined) => await onUpdateEntry(id, { isLoaded: !currentStatus });

  const isMMSize = formData.size.toLowerCase().includes('mm');
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
    return <div className="max-w-full mx-auto"><div className="flex justify-center mb-6"><div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex"><button onClick={() => setActiveTab('dispatch')} className="px-4 py-2 text-sm font-bold text-slate-500 rounded-lg">Job Entry</button><button onClick={() => setActiveTab('challan')} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg">Challan Book</button></div></div><ChallanView data={challanData} onAdd={onAddChallan} onUpdate={onUpdateChallan} onDelete={onDeleteChallan} /></div>;
  }

  return (
    <div className="w-full max-w-full pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 px-2 md:px-4 font-poppins">
      {notification && <div className={`fixed top-4 right-4 z-[100] p-3 rounded-xl shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}><span className="font-bold text-sm">{notification.message}</span></div>}
      <div className="lg:col-span-12 flex justify-center"><div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex"><button onClick={() => setActiveTab('dispatch')} className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg">Job Entry</button><button onClick={() => setActiveTab('challan')} className="px-6 py-2 text-sm font-bold text-slate-500 rounded-lg">Challan Book</button></div></div>
      <div className="lg:col-span-4 space-y-6"><div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100"><div className="flex justify-between items-center mb-5"><h3 className="font-bold text-slate-900 text-lg">{editingId ? 'Edit Job' : 'New Entry'}</h3><button onClick={() => setShowAddParty(!showAddParty)} className="text-xs font-bold text-indigo-600">+ Add Party</button></div>{showAddParty && <div className="flex gap-2 mb-4"><input value={newPartyName} onChange={e => setNewPartyName(e.target.value)} placeholder="Party Name" className="flex-1 p-2 rounded-lg text-sm border"/><button onClick={handleAddParty} className="bg-indigo-600 text-white px-3 text-xs font-bold rounded-lg">Save</button></div>}<form onSubmit={handleSubmit} className="space-y-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">Party</label><input list="parties" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/><datalist id="parties">{availableParties.map(p => <option key={p} value={p}/>)}</datalist></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">Size</label><input value={formData.size} onChange={e => setFormData(p => ({...p, size: e.target.value, pcs: e.target.value.toLowerCase().includes('mm') ? p.bundle : p.pcs}))} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase">Bundles</label><input type="number" value={formData.bundle} onChange={e => setFormData(p => ({...p, bundle: e.target.value, pcs: isMMSize ? e.target.value : p.pcs}))} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">Weight</label><input type="number" step="0.001" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/></div></div>{!isMMSize && <div><label className="text-[10px] font-bold text-slate-500 uppercase">Pcs</label><input type="number" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold"/></div>}<div><label className="text-[10px] font-bold text-slate-500 uppercase">Status</label><div className="flex bg-slate-100 p-1 rounded-xl">{['pending', 'running', 'completed'].map(s => <button key={s} type="button" onClick={() => setFormData({...formData, status: s as DispatchStatus})} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg ${formData.status === s ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{s}</button>)}</div></div><div className="flex gap-3"><button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">{isSubmitting ? '...' : (editingId ? 'Update' : 'Add')}</button>{editingId && <button type="button" onClick={cancelEdit} className="p-3 bg-slate-100 rounded-xl"><X/></button>}</div></form></div></div>
      <div className="lg:col-span-8 space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-lg">Job List</h3><span>{sortedEntries.length} Total</span></div>{groupedEntries.length === 0 ? <div className="text-center py-20 bg-white rounded-2xl"><p>No jobs.</p></div> : groupedEntries.map(([key, items]) => { const [date, party] = key.split('|'); const totalBundles = items.reduce((sum, item) => sum + item.bundle, 0); return <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200"><div className="p-4 border-b border-slate-100"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div className="flex items-center gap-3 w-full sm:w-auto"><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">{date}</span><h4 className="font-bold text-base truncate flex-1 sm:flex-none">{party}</h4><button onClick={() => sendBulkWhatsApp(items)} className="ml-auto sm:ml-2 p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Send className="w-4 h-4"/></button></div><div className="w-full sm:w-auto text-right"><span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">Total Bundles: {totalBundles}</span></div></div></div><div className="p-3 space-y-3">{items.map(entry => <div key={entry.id} className="p-3 rounded-lg border bg-white"><div className="flex justify-between items-center mb-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : entry.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{entry.status}</span><div className="flex gap-2"><button onClick={() => handleEditClick(entry)}><Pencil className="w-4 h-4 text-indigo-600"/></button><button onClick={() => onDeleteEntry(entry.id)}><Trash2 className="w-4 h-4 text-red-500"/></button></div></div><div className="grid grid-cols-3 gap-3"><div><div className="text-[10px] font-bold text-slate-400">Size</div><div className="font-bold text-sm">{entry.size}</div><div className="text-xs text-slate-500">{entry.pcs} Pcs</div></div><div className="border-2 border-blue-500 rounded-lg p-1 text-center"><div className="text-[9px] font-bold text-blue-500">BUNDLES</div><div className="font-bold text-lg">{entry.bundle} 📦</div></div><div className="bg-indigo-50 p-2 rounded-lg text-center"><div className="text-[9px] font-bold text-indigo-400">Weight</div><div className="font-bold text-indigo-700">{entry.weight.toFixed(3)} kg</div></div></div></div>)}</div></div>})}</div>
    </div>
  );
};