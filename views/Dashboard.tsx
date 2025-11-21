
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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-black font-bold" /> 
      : <ArrowDown className="w-4 h-4 text-black font-bold" />;
  };

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-400', text: 'text-black', border: 'border-black', label: 'PENDING' },
      running: { bg: 'bg-blue-400', text: 'text-black', border: 'border-black', label: 'RUNNING' },
      completed: { bg: 'bg-emerald-400', text: 'text-black', border: 'border-black', label: 'DONE' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border-2 ${style.bg} ${style.text} ${style.border} shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
        {style.label}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-xl p-4 border-2 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
                    <span className="text-xs font-bold text-slate-500">{sub}</span>
                </div>
            </div>
            <div className={`p-3 rounded-lg border-2 border-black ${bgClass}`}>
                <Icon className={`w-5 h-5 ${colorClass} stroke-[3px]`} />
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 font-sans">
      
      {/* KPI Section - Bold Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Total Disp. Wt" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale} 
            colorClass="text-indigo-900" 
            bgClass="bg-indigo-200" 
        />
        <KPICard 
            title="Total Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
            colorClass="text-emerald-900" 
            bgClass="bg-emerald-200" 
        />
        <KPICard 
            title="Total Pcs" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            colorClass="text-orange-900" 
            bgClass="bg-orange-200" 
        />
        <KPICard 
            title="Avg Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            colorClass="text-pink-900" 
            bgClass="bg-pink-200" 
        />
      </div>

      {/* Main Data Section */}
      <div className="bg-white rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)] border-2 border-slate-900 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex items-center gap-3">
                <div className="bg-black p-2 rounded shadow-md">
                    <Filter className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-black text-slate-800 uppercase tracking-wide">Live Filters</span>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <select 
                    className="px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-700 focus:bg-yellow-50 outline-none shadow-sm"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">ALL PARTIES</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-3 py-2 bg-white border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-700 focus:bg-yellow-50 outline-none shadow-sm"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">ALL SIZES</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-white rounded-lg border-2 border-slate-900 px-2 shadow-sm">
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 outline-none w-28"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-400 mx-1 font-black">-</span>
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 outline-none w-28"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs font-black uppercase tracking-wide shadow-md"
                    >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reset
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white relative">
            {sortedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="bg-slate-100 p-4 rounded-full mb-4 border-2 border-slate-200">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-base font-bold">No records found matching filters</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View - Bold Desi Style */}
                    <div className="hidden md:block w-full overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-800 text-white border-b-2 border-slate-900 sticky top-0 z-10 shadow-md">
                                <tr>
                                    {[
                                        { label: 'Date', key: 'date', width: 'w-[10%]', className: 'pl-4' },
                                        { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                        { label: 'Size', key: 'size', width: 'w-[10%]' },
                                        { label: 'Rolls/Pkg', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                        { label: 'Pcs', key: 'pcs', width: 'w-[8%]', align: 'center' },
                                        { label: 'Disp Wt', key: 'weight', width: 'w-[11%]', align: 'right' },
                                        { label: 'Prod Wt', key: 'productionWeight', width: 'w-[11%]', align: 'right' },
                                        { label: 'Diff', key: 'wastage', width: 'w-[10%]', align: 'right' },
                                        { label: 'Status', key: 'status', width: 'w-[10%]', align: 'center', className: 'pr-4' },
                                    ].map((col) => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key as SortKey)}
                                            className={`py-4 px-2 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors select-none truncate ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                        >
                                            <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                                {col.label}
                                                <SortIcon columnKey={col.key as SortKey} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-100 bg-white">
                                {sortedData.map((entry, idx) => {
                                    const wastage = (entry.productionWeight || 0) > 0 ? (entry.productionWeight - entry.weight) : 0;
                                    const isMM = entry.size.toLowerCase().includes('mm');
                                    
                                    return (
                                        <tr key={entry.id} className={`hover:bg-blue-50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="py-4 px-2 pl-4 align-middle text-xs font-bold text-slate-500 whitespace-nowrap font-mono">
                                                {entry.date}
                                            </td>
                                            <td className="py-4 px-2 align-middle">
                                                <div className="font-black text-slate-800 text-sm truncate uppercase tracking-tight" title={entry.partyName}>
                                                    {entry.partyName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 align-middle">
                                                <span className="inline-block px-2 py-1 rounded-md text-xs font-black bg-slate-200 text-slate-800 border border-slate-300">
                                                    {entry.size}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-center align-middle">
                                                <span className="font-black text-slate-700 text-sm">
                                                    {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-center align-middle">
                                                {isMM ? (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Rolls</span>
                                                ) : (
                                                    <span className="font-black text-slate-700 text-sm">{entry.pcs || '-'}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-2 text-right align-middle">
                                                <span className="font-black text-indigo-700 text-sm block">
                                                    {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-right align-middle">
                                                <span className="font-bold text-slate-500 text-sm block">
                                                    {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-right align-middle">
                                                {wastage !== 0 ? (
                                                    <span className={`font-black text-xs px-1.5 py-0.5 rounded ${wastage > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {wastage > 0 ? '+' : ''}{wastage.toFixed(1)}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="py-4 px-2 pr-4 text-center align-middle">
                                                <StatusBadge status={entry.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View - Bold Desi Style */}
                    <div className="md:hidden grid grid-cols-1 gap-3 p-3 bg-slate-100">
                        {sortedData.map((entry) => {
                            const isExpanded = mobileExpandedId === entry.id;
                            const wastage = (entry.productionWeight || 0) > 0 ? (entry.productionWeight - entry.weight) : 0;
                            const isMM = entry.size.toLowerCase().includes('mm');

                            return (
                                <div key={entry.id} className="bg-white rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 relative overflow-hidden" onClick={() => setMobileExpandedId(isExpanded ? null : entry.id)}>
                                    {/* Header: Date, Party & Status */}
                                    <div className="flex justify-between items-start mb-3 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {entry.date}
                                            </div>
                                            <h3 className="font-black text-slate-900 text-base uppercase leading-tight truncate">{entry.partyName}</h3>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>

                                    {/* Primary Stats Row */}
                                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-black block mb-0.5">Size</span>
                                            <span className="font-black text-slate-900 text-sm">{entry.size}</span>
                                        </div>
                                        <div className="bg-indigo-50 p-2 rounded border border-indigo-100 text-center">
                                            <span className="text-[10px] text-indigo-400 uppercase font-black block mb-0.5">Disp. Wt</span>
                                            <span className="font-black text-indigo-800 text-sm">{entry.weight} kg</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-right">
                                            <span className="text-[10px] text-slate-400 uppercase font-black block mb-0.5">Prod. Wt</span>
                                            <span className="font-bold text-slate-600 text-sm">{entry.productionWeight || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Secondary Stats Row */}
                                    <div className="flex justify-between items-center text-xs pt-2 border-t-2 border-slate-100 border-dashed">
                                         <div className="flex gap-2">
                                            <span className="font-bold bg-slate-200 px-2 py-1 rounded text-slate-800 border border-slate-300">
                                                {entry.bundle || 0} 📦
                                            </span>
                                            <span className="font-bold bg-slate-200 px-2 py-1 rounded text-slate-800 border border-slate-300">
                                                {isMM ? 'Rolls' : `${entry.pcs || 0} Pcs`}
                                            </span>
                                         </div>
                                         
                                         {wastage !== 0 && (
                                             <div className={`flex items-center font-black px-2 py-1 rounded border ${wastage > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
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
