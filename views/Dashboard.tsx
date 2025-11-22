
import React, { useMemo, useState } from 'react';
import { DispatchEntry } from '../types';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  Package, Scale, TrendingUp, Layers, Calendar, Filter, XCircle, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import { 
  Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

interface DashboardProps {
  data: DispatchEntry[];
}

type SortKey = keyof DispatchEntry;
type SortDirection = 'asc' | 'desc';

interface FilterState {
  party: string;
  size: string;
  startDate: string;
  endDate: string;
}

// --- Calendar Helpers ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const DashboardView: React.FC<DashboardProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'stats' | 'calendar'>('stats');
  const [filters, setFilters] = useState<FilterState>({ party: '', size: '', startDate: '', endDate: '' });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'timestamp', direction: 'desc' });
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // --- Data Processing ---
  const uniqueParties = useMemo(() => Array.from(new Set(data.map(d => d.partyName))).sort(), [data]);
  const uniqueSizes = useMemo(() => Array.from(new Set(data.map(d => d.size))).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(entry => {
      if (viewMode === 'calendar' && selectedDate) {
          return entry.date === selectedDate;
      }
      const matchesParty = filters.party ? entry.partyName === filters.party : true;
      const matchesSize = filters.size ? entry.size === filters.size : true;
      let matchesDate = true;
      if (filters.startDate) matchesDate = matchesDate && entry.date >= filters.startDate;
      if (filters.endDate) matchesDate = matchesDate && entry.date <= filters.endDate;
      return matchesParty && matchesSize && matchesDate;
    });
  }, [data, filters, viewMode, selectedDate]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totals = useMemo(() => {
    // Calculate totals based on ALL data for KPIs, unless filtered
    const source = viewMode === 'calendar' ? data : filteredData;
    return source.reduce((acc, curr) => ({
      weight: acc.weight + (curr.weight || 0),
      bundles: acc.bundles + (curr.bundle || 0),
      pcs: acc.pcs + (curr.pcs || 0),
      count: acc.count + 1
    }), { weight: 0, bundles: 0, pcs: 0, count: 0 });
  }, [data, filteredData, viewMode]);

  // --- Chart Data Prep ---
  const chartData = useMemo(() => {
    const last7Days = new Map<string, number>();
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.set(d.toISOString().split('T')[0], 0);
    }
    data.forEach(d => {
        if (last7Days.has(d.date)) {
            last7Days.set(d.date, (last7Days.get(d.date) || 0) + d.weight);
        }
    });
    return Array.from(last7Days.entries()).map(([date, weight]) => ({
        date: date.split('-').slice(1).join('/'),
        weight
    }));
  }, [data]);

  // --- Actions ---
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'desc' }; 
    });
  };
  const clearFilters = () => setFilters({ party: '', size: '', startDate: '', endDate: '' });
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- Components ---
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600 ml-1" /> : <ArrowDown className="w-3 h-3 text-indigo-600 ml-1" />;
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8 transition-transform group-hover:scale-110 ${bgClass}`}></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}><Icon className="w-5 h-5" /></div>
        </div>
        <div className="flex items-center gap-2 mt-auto relative z-10">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{sub}</span>
        </div>
    </div>
  );

  const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysCount = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Map data to dates
      const entriesMap = new Map<string, number>();
      data.forEach(d => entriesMap.set(d.date, (entriesMap.get(d.date) || 0) + 1));

      const days = [];
      for(let i=0; i<startDay; i++) days.push(<div key={`empty-${i}`} />);
      for(let d=1; d<=daysCount; d++) {
          const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const count = entriesMap.get(dateStr) || 0;
          const isSelected = selectedDate === dateStr;
          
          days.push(
              <button 
                key={d} 
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`aspect-square rounded-xl relative border transition-all flex flex-col items-center justify-center
                    ${isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105 z-10' 
                        : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300'}
                `}
              >
                  <span className="text-sm font-bold">{d}</span>
                  {count > 0 && (
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>
                  )}
              </button>
          );
      }

      return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">{currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h2>
                  <div className="flex gap-2">
                      <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-slate-100"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                      <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-slate-100"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
                  </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-2">{days}</div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
         <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Total Weight" value={totals.weight.toLocaleString()} sub="kg" icon={Scale} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
            <KPICard title="Total Bundles" value={totals.bundles.toLocaleString()} sub="pkg" icon={Package} colorClass="text-blue-600" bgClass="bg-blue-100" />
            <KPICard title="Total Pcs" value={totals.pcs.toLocaleString()} sub="pcs" icon={Layers} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
            <KPICard title="Avg Weight" value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} sub="kg / entry" icon={TrendingUp} colorClass="text-amber-600" bgClass="bg-amber-100" />
         </div>
         <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col min-h-[140px]">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-700">Weekly Trend</h3>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => setViewMode('stats')} className={`p-1.5 rounded-md transition-all ${viewMode === 'stats' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><TableIcon className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Calendar className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Conditional Calendar View */}
        {viewMode === 'calendar' && (
            <div className="lg:col-span-4 overflow-y-auto">
                {renderCalendar()}
            </div>
        )}

        {/* Table Section */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${viewMode === 'calendar' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg"><Search className="w-5 h-5 text-indigo-600" /></div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {viewMode === 'calendar' ? (selectedDate ? `Entries for ${selectedDate}` : 'Select a date') : 'All Transactions'}
                    </h2>
                </div>
                {viewMode === 'stats' && (
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer" value={filters.party} onChange={(e) => setFilters({...filters, party: e.target.value})}>
                                <option value="">All Parties</option>{uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                            <select className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer" value={filters.size} onChange={(e) => setFilters({...filters, size: e.target.value})}>
                                <option value="">All Sizes</option>{uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {(filters.party || filters.size) && (<button onClick={clearFilters} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><XCircle className="w-5 h-5" /></button>)}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {sortedData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                        <Package className="w-12 h-12 mb-3 text-slate-200" />
                        <p className="text-sm font-medium">No records found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                            <tr>
                                {[
                                    { label: 'Date', key: 'date', width: 'w-[15%]', className: 'pl-6' },
                                    { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                    { label: 'Size', key: 'size', width: 'w-[15%]' },
                                    { label: 'Rolls', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                    { label: 'Pcs', key: 'pcs', width: 'w-[10%]', align: 'center' },
                                    { label: 'Disp. Wt', key: 'weight', width: 'w-[15%]', align: 'right' },
                                    { label: 'Status', key: 'status', width: 'w-[10%]', align: 'center', className: 'pr-6' },
                                ].map((col) => (
                                    <th key={col.key} onClick={() => handleSort(col.key as SortKey)} className={`py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors select-none ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>{col.label}<SortIcon columnKey={col.key as SortKey} /></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedData.map((entry) => {
                                const isMM = entry.size.toLowerCase().includes('mm');
                                return (
                                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="py-3.5 px-4 pl-6 align-middle text-sm font-medium text-slate-500 font-mono">{entry.date}</td>
                                        <td className="py-3.5 px-4 align-middle"><div className="font-bold text-slate-900 text-sm truncate" title={entry.partyName}>{entry.partyName}</div></td>
                                        <td className="py-3.5 px-4 align-middle"><span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{entry.size}</span></td>
                                        <td className="py-3.5 px-4 text-center align-middle"><span className="font-bold text-slate-700 text-sm">{entry.bundle ? `${entry.bundle} 📦` : '-'}</span></td>
                                        <td className="py-3.5 px-4 text-center align-middle">{isMM ? <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full">Rolls</span> : <span className="font-bold text-slate-700 text-sm">{entry.pcs || '-'}</span>}</td>
                                        <td className="py-3.5 px-4 text-right align-middle"><span className="font-bold text-indigo-600 text-sm">{entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}</span></td>
                                        <td className="py-3.5 px-4 pr-6 text-center align-middle"><div className={`w-2.5 h-2.5 rounded-full mx-auto ${entry.status === 'completed' ? 'bg-emerald-400' : entry.status === 'running' ? 'bg-blue-400' : 'bg-amber-400'}`} title={entry.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
