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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 ml-1" />;
  };

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      running: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border} shadow-sm`}>
        {status}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-white hover:-translate-y-1 transition-transform duration-300 group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
        
        <div className="relative z-10 flex items-start justify-between mb-4">
            <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-100`}>
                <Icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            {/* Decorative circle */}
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
        </div>
        
        <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
                <span className="text-sm font-semibold text-slate-400">{sub}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] gap-8 font-sans">
      
      {/* KPIs - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <KPICard 
            title="Total Dispatch" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale}
            gradient="from-indigo-500 to-purple-500"
        />
        <KPICard 
            title="Total Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
            gradient="from-blue-500 to-cyan-500"
        />
        <KPICard 
            title="Total Pieces" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            gradient="from-emerald-500 to-teal-500"
        />
        <KPICard 
            title="Avg. Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            gradient="from-orange-500 to-amber-500"
        />
      </div>

      {/* Main Content - Fit Screen Table with Soft UI */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center bg-white/50">
            <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-md shadow-slate-100 border border-slate-50 text-indigo-600">
                    <Search className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Dispatch Records</h2>
                    <p className="text-sm text-slate-400 font-medium">{filteredData.length} records found</p>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <select 
                    className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 outline-none cursor-pointer transition-all shadow-sm min-w-[160px]"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 outline-none cursor-pointer transition-all shadow-sm min-w-[140px]"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-white rounded-2xl px-4 gap-3 border border-slate-100 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                     <input 
                        type="date"
                        className="bg-transparent border-0 text-sm font-bold text-slate-600 focus:ring-0 outline-none w-32 py-3"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-300 font-light">|</span>
                     <input 
                        type="date"
                        className="bg-transparent border-0 text-sm font-bold text-slate-600 focus:ring-0 outline-none w-32 py-3"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                        title="Clear Filters"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto no-scrollbar bg-white/40">
            {sortedData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-8 rounded-3xl mb-4 shadow-inner">
                        <Search className="w-12 h-12 text-slate-300" />
                    </div>
                    <p className="text-base font-bold">No records matching your filters</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
                        <tr>
                            {[
                                { label: 'Date', key: 'date', width: 'w-[12%]', className: 'pl-8' },
                                { label: 'Party Name', key: 'partyName', width: 'w-[22%]' },
                                { label: 'Size', key: 'size', width: 'w-[12%]' },
                                { label: 'Rolls', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                { label: 'Pcs', key: 'pcs', width: 'w-[10%]', align: 'center' },
                                { label: 'Disp. Wt', key: 'weight', width: 'w-[12%]', align: 'right' },
                                { label: 'Prod. Wt', key: 'productionWeight', width: 'w-[12%]', align: 'right' },
                                { label: 'Status', key: 'status', width: 'w-[10%]', align: 'center', className: 'pr-8' },
                            ].map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key as SortKey)}
                                    className={`py-6 px-4 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors select-none ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                        {sortedData.map((entry) => {
                            const isMM = entry.size.toLowerCase().includes('mm');
                            return (
                                <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group cursor-default">
                                    <td className="py-5 px-4 pl-8 align-middle text-sm font-bold text-slate-400 font-mono whitespace-nowrap">
                                        {entry.date}
                                    </td>
                                    <td className="py-5 px-4 align-middle">
                                        <div className="font-black text-slate-800 text-base truncate leading-tight" title={entry.partyName}>
                                            {entry.partyName}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 align-middle">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 text-sm font-extrabold shadow-sm">
                                            {entry.size}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-center align-middle">
                                        <span className="font-black text-slate-700 text-base">
                                            {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-center align-middle">
                                        {isMM ? (
                                            <span className="text-[11px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">Rolls</span>
                                        ) : (
                                            <span className="font-black text-slate-700 text-base">{entry.pcs || '-'}</span>
                                        )}
                                    </td>
                                    <td className="py-5 px-4 text-right align-middle">
                                        <span className="font-black text-slate-900 text-base block tabular-nums">
                                            {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-right align-middle">
                                        <span className="font-bold text-slate-400 text-sm block tabular-nums">
                                            {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 pr-8 text-center align-middle">
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