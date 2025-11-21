
import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  Package, Scale, TrendingUp, XCircle, Layers
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
    key: 'timestamp', // Default sort by newest
    direction: 'desc'
  });

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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      running: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Refined KPI Card looking like the reference "Balance" cards
  const KPICard = ({ title, value, sub, icon: Icon, trend }: any) => (
    <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between h-full transition-all hover:shadow-md">
        <div className="flex items-start justify-between mb-3">
            <div className="p-3 bg-indigo-50/80 rounded-xl text-indigo-600">
                <Icon className="w-5 h-5" />
            </div>
             {trend && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {trend}
                </span>
            )}
        </div>
        <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">{title}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <span className="text-xs font-semibold text-slate-400">{sub}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-6 font-inter">
      
      {/* Top Section: KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <KPICard 
            title="Total Dispatch" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale}
            trend="+12% ↑"
        />
        <KPICard 
            title="Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
        />
        <KPICard 
            title="Total Pieces" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
        />
        <KPICard 
            title="Avg. Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg/job" 
            icon={TrendingUp} 
        />
      </div>

      {/* Main Content: Table & Filters - Fit Screen */}
      <div className="flex-1 bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-50 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm shadow-indigo-200">
                    <Search className="w-4 h-4" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">Dispatch Records</h2>
                    <p className="text-xs text-slate-400 font-medium">{filteredData.length} entries found</p>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                <select 
                    className="px-4 py-2 bg-slate-50 border-0 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all min-w-[140px]"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-4 py-2 bg-slate-50 border-0 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer transition-all min-w-[120px]"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-slate-50 rounded-xl px-4 gap-2 border border-transparent focus-within:border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                     <input 
                        type="date"
                        className="bg-transparent border-0 text-sm font-semibold text-slate-600 focus:ring-0 outline-none w-32 p-0 py-2"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-300 font-light">|</span>
                     <input 
                        type="date"
                        className="bg-transparent border-0 text-sm font-semibold text-slate-600 focus:ring-0 outline-none w-32 p-0 py-2"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Clear Filters"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>

        {/* Data Table - Scrollable Body */}
        <div className="flex-1 overflow-auto no-scrollbar">
            {sortedData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No records found</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <tr>
                            {[
                                { label: 'Date', key: 'date', width: 'w-[12%]', className: 'pl-6' },
                                { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                { label: 'Size', key: 'size', width: 'w-[10%]' },
                                { label: 'Rolls', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                { label: 'Pcs', key: 'pcs', width: 'w-[10%]', align: 'center' },
                                { label: 'Disp. Wt', key: 'weight', width: 'w-[12%]', align: 'right' },
                                { label: 'Prod. Wt', key: 'productionWeight', width: 'w-[12%]', align: 'right' },
                                { label: 'Status', key: 'status', width: 'w-[14%]', align: 'center', className: 'pr-6' },
                            ].map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key as SortKey)}
                                    className={`py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors select-none bg-white border-b border-slate-50 ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                        {col.label}
                                        <SortIcon columnKey={col.key as SortKey} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                        {sortedData.map((entry) => {
                            const isMM = entry.size.toLowerCase().includes('mm');
                            return (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-3.5 px-4 pl-6 align-middle text-sm font-semibold text-slate-500 font-mono whitespace-nowrap">
                                        {entry.date}
                                    </td>
                                    <td className="py-3.5 px-4 align-middle">
                                        <div className="font-bold text-slate-700 text-sm truncate" title={entry.partyName}>
                                            {entry.partyName}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 align-middle">
                                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
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
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Rolls</span>
                                        ) : (
                                            <span className="font-bold text-slate-700 text-sm">{entry.pcs || '-'}</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right align-middle">
                                        <span className="font-bold text-slate-900 text-sm block tabular-nums">
                                            {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right align-middle">
                                        <span className="font-medium text-slate-400 text-sm block tabular-nums">
                                            {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 pr-6 text-center align-middle">
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
