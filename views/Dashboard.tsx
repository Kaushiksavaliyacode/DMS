import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, Package, Scale, TrendingUp, XCircle, Layers, Calendar, AlertTriangle
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

  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

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
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
      running: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Running' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Done' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`}>
        {style.label}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${bgClass}`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                {title}
             </span>
        </div>
        <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
            <span className="text-xs font-medium text-slate-500">{sub}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 font-sans">
      
      {/* KPI Section - Clean Professional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Total Disp. Wt" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
        />
        <KPICard 
            title="Total Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
            colorClass="text-emerald-600" 
            bgClass="bg-emerald-50" 
        />
        <KPICard 
            title="Total Pcs" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            colorClass="text-orange-600" 
            bgClass="bg-orange-50" 
        />
        <KPICard 
            title="Avg Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            colorClass="text-pink-600" 
            bgClass="bg-pink-50" 
        />
      </div>

      {/* Main Data Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Filter className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">Live Filters</span>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 shadow-sm">
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-medium text-slate-600 focus:ring-0 outline-none w-28 placeholder-slate-400"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-300 mx-2">–</span>
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-medium text-slate-600 focus:ring-0 outline-none w-28 placeholder-slate-400"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-xs font-bold"
                    >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Clear
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white relative">
            {sortedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No records found matching your criteria</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View - Ultra Professional */}
                    <div className="hidden md:block w-full overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {[
                                        { label: 'Date', key: 'date', width: 'w-[10%]', className: 'pl-6' },
                                        { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                        { label: 'Size', key: 'size', width: 'w-[10%]' },
                                        { label: 'Rolls/Pkg', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                        { label: 'Pcs', key: 'pcs', width: 'w-[8%]', align: 'center' },
                                        { label: 'Disp Wt', key: 'weight', width: 'w-[11%]', align: 'right' },
                                        { label: 'Prod Wt', key: 'productionWeight', width: 'w-[11%]', align: 'right' },
                                        { label: 'Diff', key: 'wastage', width: 'w-[10%]', align: 'right' },
                                        { label: 'Status', key: 'status', width: 'w-[10%]', align: 'center', className: 'pr-6' },
                                    ].map((col) => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key as SortKey)}
                                            className={`py-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors select-none truncate ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                        >
                                            <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                                {col.label}
                                                <SortIcon columnKey={col.key as SortKey} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {sortedData.map((entry) => {
                                    const wastage = (entry.productionWeight || 0) > 0 ? (entry.productionWeight - entry.weight) : 0;
                                    const isMM = entry.size.toLowerCase().includes('mm');
                                    
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-3.5 px-2 pl-6 align-middle text-sm font-medium text-slate-500 whitespace-nowrap font-mono">
                                                {entry.date}
                                            </td>
                                            <td className="py-3.5 px-2 align-middle">
                                                <div className="font-bold text-slate-800 text-sm truncate" title={entry.partyName}>
                                                    {entry.partyName}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-2 align-middle">
                                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {entry.size}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-2 text-center align-middle">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-2 text-center align-middle">
                                                {isMM ? (
                                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">Rolls</span>
                                                ) : (
                                                    <span className="font-bold text-slate-700 text-sm">{entry.pcs || '-'}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-2 text-right align-middle">
                                                <span className="font-bold text-slate-800 text-sm block tabular-nums">
                                                    {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-2 text-right align-middle">
                                                <span className="font-medium text-slate-500 text-sm block tabular-nums">
                                                    {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-2 text-right align-middle">
                                                {wastage !== 0 ? (
                                                    <span className={`font-bold text-xs px-1.5 py-0.5 rounded tabular-nums ${wastage > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                                        {wastage > 0 ? '+' : ''}{wastage.toFixed(1)}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="py-3.5 px-2 pr-6 text-center align-middle">
                                                <StatusBadge status={entry.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View - Professional & Clean */}
                    <div className="md:hidden grid grid-cols-1 gap-3 p-4 bg-slate-50">
                        {sortedData.map((entry) => {
                            const isExpanded = mobileExpandedId === entry.id;
                            const wastage = (entry.productionWeight || 0) > 0 ? (entry.productionWeight - entry.weight) : 0;
                            const isMM = entry.size.toLowerCase().includes('mm');

                            return (
                                <div key={entry.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden transition-all active:scale-[0.99]" onClick={() => setMobileExpandedId(isExpanded ? null : entry.id)}>
                                    {/* Header: Date, Party & Status */}
                                    <div className="flex justify-between items-start mb-3 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-1">
                                                <Calendar className="w-3 h-3" />
                                                {entry.date}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-base truncate">{entry.partyName}</h3>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>

                                    {/* Primary Stats Row */}
                                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Size</span>
                                            <span className="font-bold text-slate-800 text-sm">{entry.size}</span>
                                        </div>
                                        <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-center">
                                            <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-0.5">Disp. Wt</span>
                                            <span className="font-bold text-indigo-900 text-sm">{entry.weight} kg</span>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-right">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Prod. Wt</span>
                                            <span className="font-medium text-slate-600 text-sm">{entry.productionWeight ? `${entry.productionWeight} kg` : '-'}</span>
                                        </div>
                                    </div>

                                    {/* Secondary Stats Row */}
                                    <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100">
                                         <div className="flex gap-2 text-xs">
                                            <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                                {entry.bundle || 0} 📦
                                            </span>
                                            <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                                {isMM ? 'Rolls' : `${entry.pcs || 0} Pcs`}
                                            </span>
                                         </div>
                                         
                                         {wastage !== 0 && (
                                             <div className={`flex items-center font-bold px-2 py-1 rounded text-xs ${wastage > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Diff: {wastage > 0 ? '+' : ''}{wastage.toFixed(1)}
                                             </div>
                                         )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};