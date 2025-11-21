
import React, { useMemo, useState } from 'react';
import { DispatchEntry } from '../types';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  Package, Scale, TrendingUp, Layers, Calendar, Filter, XCircle
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

export const DashboardView: React.FC<DashboardProps> = ({ data }) => {
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

  // --- Data Processing ---
  const uniqueParties = useMemo(() => Array.from(new Set(data.map(d => d.partyName))).sort(), [data]);
  const uniqueSizes = useMemo(() => Array.from(new Set(data.map(d => d.size))).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(entry => {
      const matchesParty = filters.party ? entry.partyName === filters.party : true;
      const matchesSize = filters.size ? entry.size === filters.size : true;
      let matchesDate = true;
      if (filters.startDate) matchesDate = matchesDate && entry.date >= filters.startDate;
      if (filters.endDate) matchesDate = matchesDate && entry.date <= filters.endDate;
      return matchesParty && matchesSize && matchesDate;
    });
  }, [data, filters]);

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
    return filteredData.reduce((acc, curr) => ({
      weight: acc.weight + (curr.weight || 0),
      bundles: acc.bundles + (curr.bundle || 0),
      pcs: acc.pcs + (curr.pcs || 0),
      count: acc.count + 1
    }), { weight: 0, bundles: 0, pcs: 0, count: 0 });
  }, [filteredData]);

  // --- Chart Data Prep ---
  const chartData = useMemo(() => {
    const last7Days = new Map<string, number>();
    // Initialize last 7 days with 0
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.set(d.toISOString().split('T')[0], 0);
    }
    
    filteredData.forEach(d => {
        if (last7Days.has(d.date)) {
            last7Days.set(d.date, (last7Days.get(d.date) || 0) + d.weight);
        }
    });

    return Array.from(last7Days.entries()).map(([date, weight]) => ({
        date: date.split('-').slice(1).join('/'), // MM/DD
        weight
    }));
  }, [filteredData]);

  // --- Actions ---
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

  // --- Components ---
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 ml-1" />;
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8 transition-transform group-hover:scale-110 ${bgClass}`}></div>
        
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div className="flex items-center gap-2 mt-auto relative z-10">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{sub}</span>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6 font-sans">
      
      {/* Top Section: KPIs & Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
         {/* KPIs */}
         <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard 
                title="Total Weight" 
                value={totals.weight.toLocaleString()} 
                sub="kg" 
                icon={Scale} 
                colorClass="text-indigo-600" 
                bgClass="bg-indigo-100" 
            />
            <KPICard 
                title="Total Bundles" 
                value={totals.bundles.toLocaleString()} 
                sub="pkg" 
                icon={Package} 
                colorClass="text-blue-600" 
                bgClass="bg-blue-100" 
            />
            <KPICard 
                title="Total Pcs" 
                value={totals.pcs.toLocaleString()} 
                sub="pcs" 
                icon={Layers} 
                colorClass="text-emerald-600" 
                bgClass="bg-emerald-100" 
            />
            <KPICard 
                title="Avg Weight" 
                value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
                sub="kg / entry" 
                icon={TrendingUp} 
                colorClass="text-amber-600" 
                bgClass="bg-amber-100" 
            />
         </div>

         {/* Weekly Trend Chart */}
         <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700">Weekly Dispatch Trend</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">Live</span>
            </div>
            <div className="flex-1 min-h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Bottom Section: Data Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                    <Search className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        value={filters.party}
                        onChange={(e) => setFilters({...filters, party: e.target.value})}
                    >
                        <option value="">All Parties</option>
                        {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <select 
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        value={filters.size}
                        onChange={(e) => setFilters({...filters, size: e.target.value})}
                    >
                        <option value="">All Sizes</option>
                        {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                    <input 
                        type="date"
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none w-24"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    />
                    <span className="text-slate-300 mx-2">to</span>
                    <input 
                        type="date"
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none w-24"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    />
                </div>

                {(filters.party || filters.size || filters.startDate) && (
                    <button 
                        onClick={clearFilters}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Clear Filters"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            {sortedData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                    <Package className="w-12 h-12 mb-3 text-slate-200" />
                    <p className="text-sm font-medium">No records found matching filters</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                            {[
                                { label: 'Date', key: 'date', width: 'w-[12%]', className: 'pl-6' },
                                { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                { label: 'Size', key: 'size', width: 'w-[12%]' },
                                { label: 'Rolls', key: 'bundle', width: 'w-[12%]', align: 'center' },
                                { label: 'Pcs', key: 'pcs', width: 'w-[12%]', align: 'center' },
                                { label: 'Disp. Wt', key: 'weight', width: 'w-[12%]', align: 'right' },
                                { label: 'Prod. Wt', key: 'productionWeight', width: 'w-[12%]', align: 'right' },
                                { label: 'Status', key: 'status', width: 'w-[8%]', align: 'center', className: 'pr-6' },
                            ].map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key as SortKey)}
                                    className={`py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors select-none ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                        {col.label}
                                        <SortIcon columnKey={col.key as SortKey} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((entry) => {
                            const isMM = entry.size.toLowerCase().includes('mm');
                            return (
                                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="py-3.5 px-4 pl-6 align-middle text-sm font-medium text-slate-500 font-mono">
                                        {entry.date}
                                    </td>
                                    <td className="py-3.5 px-4 align-middle">
                                        <div className="font-bold text-slate-900 text-sm truncate" title={entry.partyName}>
                                            {entry.partyName}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 align-middle">
                                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                            {entry.size}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center align-middle">
                                        <span className="font-bold text-slate-700 text-sm">
                                            {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center align-middle">
                                        {isMM ? (
                                            <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full">Rolls</span>
                                        ) : (
                                            <span className="font-bold text-slate-700 text-sm">{entry.pcs || '-'}</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right align-middle">
                                        <span className="font-bold text-indigo-600 text-sm">
                                            {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right align-middle">
                                        <span className="font-medium text-slate-500 text-sm">
                                            {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 pr-6 text-center align-middle">
                                        <div className={`w-2.5 h-2.5 rounded-full mx-auto ${
                                            entry.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                                            entry.status === 'running' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' :
                                            'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                        }`} title={entry.status} />
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
