
import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, Package, Scale, TrendingUp, XCircle, Layers, Calendar
} from 'lucide-react';

interface DashboardProps {
  data: DispatchEntry[];
}

type SortKey = keyof DispatchEntry | 'wastage';
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

  // Extract unique values for dropdowns
  const uniqueParties = useMemo(() => Array.from(new Set(data.map(d => d.partyName))).sort(), [data]);
  const uniqueSizes = useMemo(() => Array.from(new Set(data.map(d => d.size))).sort(), [data]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(entry => {
      const matchesParty = filters.party ? entry.partyName === filters.party : true;
      const matchesSize = filters.size ? entry.size === filters.size : true;
      
      let matchesDate = true;
      if (filters.startDate) {
        matchesDate = matchesDate && entry.date >= filters.startDate;
      }
      if (filters.endDate) {
        matchesDate = matchesDate && entry.date <= filters.endDate;
      }

      return matchesParty && matchesSize && matchesDate;
    });
  }, [data, filters]);

  // Sorting Logic
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

  // Totals Calculation
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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  const getStatusBadge = (status: DispatchStatus) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600" title="Pending"><div className="w-2 h-2 bg-current rounded-full"></div></span>;
      case 'running':
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 animate-pulse" title="Running"><div className="w-2 h-2 bg-current rounded-full"></div></span>;
      case 'completed':
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600" title="Completed"><div className="w-2 h-2 bg-current rounded-full"></div></span>;
      default:
        return null;
    }
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
        <div className={`absolute -right-6 -top-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:rotate-12`}>
            <Icon size={120} className={colorClass} />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-6">
                <div className={`p-3.5 rounded-2xl ${bgClass} shadow-sm`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
            </div>
            <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
                    <span className="text-xs font-bold text-slate-400">{sub}</span>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 pt-2">
      
      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
            title="Total Dispatched" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
        />
        <KPICard 
            title="Total Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="rolls" 
            icon={Package} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
        />
        <KPICard 
            title="Total Quantity" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            colorClass="text-orange-600" 
            bgClass="bg-orange-50" 
        />
        <KPICard 
            title="Avg Weight / Job" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            colorClass="text-pink-600" 
            bgClass="bg-pink-50" 
        />
      </div>

      {/* Main Content Card */}
      <div className="flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-[600px]">
        
        {/* Filters Toolbar - Floating Glass Effect */}
        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-3 w-full lg:w-auto pl-2">
                <div className="bg-indigo-50 p-2 rounded-xl">
                    <Filter className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-bold text-slate-700 text-sm">Smart Filters</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="relative group">
                    <select 
                        className="pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border-0 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer appearance-none min-w-[140px]"
                        value={filters.party}
                        onChange={(e) => setFilters({...filters, party: e.target.value})}
                    >
                        <option value="">All Parties</option>
                        {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative group">
                    <select 
                        className="pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border-0 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer appearance-none min-w-[110px]"
                        value={filters.size}
                        onChange={(e) => setFilters({...filters, size: e.target.value})}
                    >
                        <option value="">All Sizes</option>
                        {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                     <div className="relative">
                        <Calendar className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                            type="date"
                            className="pl-8 pr-2 py-1.5 bg-transparent border-0 text-xs font-bold text-slate-600 focus:ring-0 outline-none w-28"
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        />
                     </div>
                     <span className="text-slate-300 mx-1">/</span>
                     <div className="relative">
                        <input 
                            type="date"
                            className="pl-2 pr-2 py-1.5 bg-transparent border-0 text-xs font-bold text-slate-600 focus:ring-0 outline-none w-28"
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        />
                     </div>
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center w-9 h-9 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        title="Clear Filters"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 relative">
             {/* Stats Bar */}
            <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm">
                <h2 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Live Feed</h2>
                <span className="bg-white text-indigo-600 px-2 py-0.5 rounded text-[10px] font-extrabold border border-indigo-100 shadow-sm">
                    {sortedData.length} ENTRIES
                </span>
            </div>
            
            <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead className="bg-white sticky top-8 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <tr>
                    {[
                        { label: 'Party Name', key: 'partyName', width: '24%' },
                        { label: 'Date', key: 'date', width: '12%' },
                        { label: 'Size', key: 'size', width: '10%' },
                        { label: 'Pcs', key: 'pcs', align: 'center', width: '9%' },
                        { label: 'D.Weight', key: 'weight', align: 'right', width: '12%' },
                        { label: 'Bundles', key: 'bundle', align: 'center', width: '9%' },
                        { label: 'P.Weight', key: 'productionWeight', align: 'right', width: '12%' },
                        { label: 'Wst', key: 'wastage', align: 'right', width: '8%' },
                        { label: '', key: 'status', align: 'center', width: '4%' },
                    ].map((col) => (
                        <th 
                        key={col.key}
                        onClick={() => handleSort(col.key as SortKey)}
                        style={{ width: col.width }}
                        className={`px-3 py-3 font-extrabold text-slate-400 text-[10px] uppercase tracking-wider cursor-pointer hover:text-indigo-600 hover:bg-slate-50 transition-colors select-none border-b border-slate-100 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        >
                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                            {col.label}
                            <SortIcon columnKey={col.key as SortKey} />
                        </div>
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sortedData.length > 0 ? (
                    sortedData.map((entry) => {
                        const wastage = (entry.productionWeight || 0) - (entry.weight || 0);
                        return (
                            <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                            <td className="px-3 py-3 font-bold text-slate-700 break-words truncate">
                                {entry.partyName}
                            </td>
                            <td className="px-3 py-3 text-slate-500 font-semibold text-[11px]">
                                {entry.date}
                            </td>
                            <td className="px-3 py-3">
                                <span className="inline-flex bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200/50">
                                    {entry.size}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-center text-slate-600 font-semibold">
                                {entry.pcs}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-slate-800">
                                {entry.weight > 0 ? entry.weight.toLocaleString() : <span className="text-slate-300 opacity-50">-</span>}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-600 font-semibold">
                                {entry.bundle > 0 ? entry.bundle : <span className="text-slate-300 opacity-50">-</span>}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-500 font-semibold">
                                {entry.productionWeight > 0 ? entry.productionWeight.toLocaleString() : <span className="text-slate-300 opacity-50">-</span>}
                            </td>
                            <td className={`px-3 py-3 text-right font-bold text-[10px]`}>
                                {entry.productionWeight && entry.weight ? (
                                    <span className={`${wastage > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{wastage.toLocaleString()}</span>
                                ) : <span className="text-slate-300 opacity-50">-</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                                {getStatusBadge(entry.status)}
                            </td>
                            </tr>
                        )
                    })
                    ) : (
                    <tr>
                        <td colSpan={9} className="px-4 py-24 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300">
                            <div className="bg-slate-50 p-4 rounded-full mb-4 border border-slate-100">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">No records found</p>
                            <p className="text-xs text-slate-300 mt-1">Try adjusting filters or add new entries</p>
                        </div>
                        </td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
