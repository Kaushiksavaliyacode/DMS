
import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  Package, Scale, TrendingUp, XCircle, Layers, CheckCircle2, Clock, Activity, Calendar
} from 'lucide-react';

interface DashboardProps {
  data: DispatchEntry[];
}

type SortKey = keyof DispatchEntry | 'wastage';
type SortDirection = 'asc' | 'desc';
type TabView = 'all' | 'today' | 'running' | 'pending' | 'completed';

interface FilterState {
  party: string;
  size: string;
  startDate: string;
  endDate: string;
}

export const DashboardView: React.FC<DashboardProps> = ({ data }) => {
  const [currentTab, setCurrentTab] = useState<TabView>('today');
  const [filters, setFilters] = useState<FilterState>({
    party: '',
    size: '',
    startDate: '',
    endDate: ''
  });
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({
    key: 'timestamp',
    direction: 'desc'
  });

  const uniqueParties = useMemo(() => Array.from(new Set(data.map(d => d.partyName))).sort(), [data]);
  const uniqueSizes = useMemo(() => Array.from(new Set(data.map(d => d.size))).sort(), [data]);

  // Filter Logic including Tabs
  const filteredData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return data.filter(entry => {
      // 1. Tab Filter
      if (currentTab === 'today' && entry.date !== todayStr) return false;
      if (currentTab === 'running' && entry.status !== 'running') return false;
      if (currentTab === 'pending' && entry.status !== 'pending') return false;
      if (currentTab === 'completed' && entry.status !== 'completed') return false;

      // 2. Dropdown Filters
      const matchesParty = filters.party ? entry.partyName === filters.party : true;
      const matchesSize = filters.size ? entry.size === filters.size : true;
      let matchesDate = true;
      
      // Only apply date range filter if NOT in 'today' tab
      if (currentTab !== 'today') {
          if (filters.startDate) matchesDate = matchesDate && entry.date >= filters.startDate;
          if (filters.endDate) matchesDate = matchesDate && entry.date <= filters.endDate;
      }
      
      return matchesParty && matchesSize && matchesDate;
    });
  }, [data, filters, currentTab]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof DispatchEntry];
      let bValue: any = b[sortConfig.key as keyof DispatchEntry];
      if (sortConfig.key === 'wastage') {
        aValue = (a.productionWeight || 0) - (a.weight || 0);
        bValue = (b.productionWeight || 0) - (b.weight || 0);
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      weight: acc.weight + (curr.weight || 0),
      bundles: acc.bundles + (curr.bundle || 0),
      pcs: acc.pcs + (curr.pcs || 0),
      count: acc.count + 1
    }), { weight: 0, bundles: 0, pcs: 0, count: 0 });
  }, [filteredData]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; 
    });
  };

  const clearFilters = () => {
    setFilters({ party: '', size: '', startDate: '', endDate: '' });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-black ml-1" /> 
      : <ArrowDown className="w-4 h-4 text-black ml-1" />;
  };

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-300', text: 'text-black', border: 'border-black' },
      running: { bg: 'bg-blue-300', text: 'text-black', border: 'border-black' },
      completed: { bg: 'bg-emerald-400', text: 'text-black', border: 'border-black' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-black uppercase tracking-wider border-2 ${style.bg} ${style.text} ${style.border} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
        {status}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-black tracking-tighter">{value}</span>
                <span className="text-xs font-bold text-slate-500">{sub}</span>
            </div>
        </div>
        <div className={`p-3 border-2 border-black ${color}`}>
            <Icon className="w-6 h-6 text-black" strokeWidth={2.5} />
        </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }: { id: TabView, label: string, icon: any }) => (
    <button
      onClick={() => setCurrentTab(id)}
      className={`flex-1 py-3 border-2 border-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:translate-y-1 ${
        currentTab === id 
          ? 'bg-black text-white shadow-[4px_4px_0px_0px_#94a3b8]' 
          : 'bg-white text-slate-500 hover:bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={3} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 font-sans">
      
      {/* 1. Tabs Section (Admin Job View) */}
      <div className="flex gap-3 shrink-0 overflow-x-auto pb-1">
        <TabButton id="today" label="Today's Job" icon={Calendar} />
        <TabButton id="running" label="Running" icon={Activity} />
        <TabButton id="pending" label="Pending" icon={Clock} />
        <TabButton id="completed" label="Completed" icon={CheckCircle2} />
        <TabButton id="all" label="All Records" icon={Layers} />
      </div>

      {/* 2. KPIs (Bold Blocks) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <KPICard 
            title="Total Weight" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale}
            color="bg-indigo-300"
        />
        <KPICard 
            title="Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
            color="bg-blue-300"
        />
        <KPICard 
            title="Total Pcs" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            color="bg-emerald-300"
        />
        <KPICard 
            title="Avg Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            color="bg-amber-300"
        />
      </div>

      {/* 3. Data Table (Grid Style) */}
      <div className="flex-1 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b-2 border-black flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50">
            <div className="flex items-center gap-3">
                <div className="bg-black p-2 border-2 border-black text-white shadow-[2px_2px_0px_0px_#94a3b8]">
                    <Search className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-lg font-black text-black uppercase tracking-tighter">
                    {currentTab === 'all' ? 'All Records' : `${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Jobs`}
                </h2>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
                <select 
                    className="px-4 py-2 bg-white border-2 border-black text-xs font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-yellow-50"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">ALL PARTIES</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-4 py-2 bg-white border-2 border-black text-xs font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:bg-yellow-50"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">ALL SIZES</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {currentTab !== 'today' && (
                    <div className="flex items-center bg-white border-2 border-black px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <input 
                            type="date"
                            className="bg-transparent border-0 text-xs font-bold text-black focus:ring-0 outline-none w-28 py-2"
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        />
                        <span className="text-black font-black">-</span>
                        <input 
                            type="date"
                            className="bg-transparent border-0 text-xs font-bold text-black focus:ring-0 outline-none w-28 py-2"
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        />
                    </div>
                )}

                {(filters.party || filters.size || (filters.startDate && currentTab !== 'today')) && (
                    <button 
                        onClick={clearFilters}
                        className="p-2 bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        <XCircle className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto no-scrollbar">
            {sortedData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <p className="text-lg font-black text-slate-300 uppercase">No records found</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 border-b-2 border-black shadow-sm">
                        <tr>
                            {[
                                { label: 'Date', key: 'date', width: 'w-[12%]', className: 'pl-6' },
                                { label: 'Party Name', key: 'partyName', width: 'w-[22%]' },
                                { label: 'Size', key: 'size', width: 'w-[12%]' },
                                { label: 'Rolls', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                { label: 'Pcs', key: 'pcs', width: 'w-[10%]', align: 'center' },
                                { label: 'Disp. Wt', key: 'weight', width: 'w-[12%]', align: 'right' },
                                { label: 'Prod. Wt', key: 'productionWeight', width: 'w-[12%]', align: 'right' },
                                { label: 'Status', key: 'status', width: 'w-[10%]', align: 'center', className: 'pr-6' },
                            ].map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key as SortKey)}
                                    className={`py-4 px-4 text-xs font-black text-black uppercase tracking-widest cursor-pointer hover:bg-slate-200 transition-colors select-none border-r border-slate-200 last:border-r-0 ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                        {col.label}
                                        <SortIcon columnKey={col.key as SortKey} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {sortedData.map((entry) => {
                            const isMM = entry.size.toLowerCase().includes('mm');
                            return (
                                <tr key={entry.id} className="hover:bg-yellow-50 transition-colors group">
                                    <td className="py-4 px-4 pl-6 align-middle text-sm font-bold text-slate-600 font-mono border-r border-slate-100">
                                        {entry.date}
                                    </td>
                                    <td className="py-4 px-4 align-middle border-r border-slate-100">
                                        <div className="font-black text-black text-sm truncate uppercase" title={entry.partyName}>
                                            {entry.partyName}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle border-r border-slate-100">
                                        <span className="font-bold text-slate-800 text-sm">
                                            {entry.size}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center align-middle border-r border-slate-100">
                                        <span className="font-black text-black text-sm">
                                            {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center align-middle border-r border-slate-100">
                                        {isMM ? (
                                            <span className="text-[10px] font-black text-white bg-black px-2 py-0.5 uppercase tracking-widest">Rolls</span>
                                        ) : (
                                            <span className="font-black text-black text-sm">{entry.pcs || '-'}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right align-middle border-r border-slate-100">
                                        <span className="font-black text-indigo-700 text-sm">
                                            {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right align-middle border-r border-slate-100">
                                        <span className="font-bold text-slate-500 text-sm">
                                            {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 pr-6 text-center align-middle">
                                        <StatusBadge status={entry.status} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};
