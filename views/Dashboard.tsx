
import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, Package, Scale, TrendingUp, XCircle, Layers, Calendar, Users, List
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
    key: 'date',
    direction: 'desc'
  });

  const [isGrouped, setIsGrouped] = useState(true);
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

  // Grouping Logic
  const groupedData = useMemo(() => {
    const groups: Record<string, DispatchEntry[]> = {};
    // If grouping, we prioritize Party Name sort implicitly for the groups keys
    sortedData.forEach(entry => {
        if (!groups[entry.partyName]) groups[entry.partyName] = [];
        groups[entry.partyName].push(entry);
    });
    
    // Sort keys alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
    }, {} as Record<string, DispatchEntry[]>);
  }, [sortedData]);

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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-indigo-600" /> 
      : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'PENDING' },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'RUNNING' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'DONE' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider border-2 ${style.bg} ${style.text} ${style.border}`}>
        {style.label}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${bgClass} border border-slate-100`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                {title}
             </span>
        </div>
        <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            <span className="text-sm font-bold text-slate-500">{sub}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 font-sans">
      
      {/* KPI Section - Bolder */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Total Disp. Wt" 
            value={totals.weight.toLocaleString()} 
            sub="kg" 
            icon={Scale} 
            colorClass="text-indigo-700" 
            bgClass="bg-indigo-50" 
        />
        <KPICard 
            title="Total Bundles" 
            value={totals.bundles.toLocaleString()} 
            sub="pkg" 
            icon={Package} 
            colorClass="text-emerald-700" 
            bgClass="bg-emerald-50" 
        />
        <KPICard 
            title="Total Pcs" 
            value={totals.pcs.toLocaleString()} 
            sub="pcs" 
            icon={Layers} 
            colorClass="text-orange-700" 
            bgClass="bg-orange-50" 
        />
        <KPICard 
            title="Avg Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            colorClass="text-pink-700" 
            bgClass="bg-pink-50" 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* Filters & Controls */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex items-center gap-4 w-full xl:w-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <Filter className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="text-base font-extrabold text-slate-800 hidden sm:inline">FILTERS</span>
                </div>
                
                {/* Grouping Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg border-2 border-slate-200 ml-2">
                    <button
                        onClick={() => setIsGrouped(false)}
                        className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wide ${!isGrouped ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List className="w-4 h-4" /> List
                    </button>
                    <button
                        onClick={() => setIsGrouped(true)}
                        className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wide ${isGrouped ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" /> Party
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <select 
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-slate-50 rounded-xl border-2 border-slate-200 px-3 shadow-sm w-full sm:w-auto">
                     <input 
                        type="date"
                        className="py-2 bg-transparent border-0 text-sm font-bold text-slate-700 focus:ring-0 outline-none w-full sm:w-32 placeholder-slate-400"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-400 mx-2 font-bold">–</span>
                     <input 
                        type="date"
                        className="py-2 bg-transparent border-0 text-sm font-bold text-slate-700 focus:ring-0 outline-none w-full sm:w-32 placeholder-slate-400"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl transition-colors text-xs font-extrabold uppercase tracking-wide ml-auto sm:ml-0"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Clear
                    </button>
                )}
            </div>
        </div>

        {/* DATA VIEW */}
        <div className="relative min-h-[400px]">
            {sortedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-bold">No records found</p>
                </div>
            ) : (
                <>
                    {/* --------------------------
                        GROUPED VIEW (PARTY CARDS) 
                       -------------------------- */}
                    {isGrouped && (
                        <div className="space-y-8">
                            {Object.entries(groupedData).map(([groupKey, groupEntries]: [string, DispatchEntry[]]) => (
                                <div key={groupKey} className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-sm">
                                    {/* Party Header */}
                                    <div className="bg-slate-900 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500 p-2 rounded-lg shadow-lg">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{groupKey}</h2>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{groupEntries.length} Entries found</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 sm:gap-6 w-full sm:w-auto">
                                            <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 sm:flex-none text-center sm:text-left">
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Weight</div>
                                                <div className="text-lg font-black text-white">
                                                    {groupEntries.reduce((s, c) => s + c.weight, 0).toLocaleString()} <span className="text-sm text-slate-400 font-medium">kg</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 sm:flex-none text-center sm:text-left">
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Bundles</div>
                                                <div className="text-lg font-black text-white">
                                                    {groupEntries.reduce((s, c) => s + c.bundle, 0)} <span className="text-sm text-slate-400 font-medium">📦</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Party Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead className="bg-slate-100 border-b-2 border-slate-200">
                                                <tr>
                                                    <th className="py-4 px-6 text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Date</th>
                                                    <th className="py-4 px-4 text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Size</th>
                                                    <th className="py-4 px-4 text-center text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Rolls/Pkg</th>
                                                    <th className="py-4 px-4 text-center text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[10%]">Pcs</th>
                                                    <th className="py-4 px-4 text-right text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Disp Wt</th>
                                                    <th className="py-4 px-4 text-right text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Prod Wt</th>
                                                    <th className="py-4 px-6 text-center text-sm font-extrabold text-slate-600 uppercase tracking-wider w-[15%]">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-slate-100">
                                                {groupEntries.map((entry) => {
                                                    const isMM = entry.size.toLowerCase().includes('mm');
                                                    return (
                                                        <tr key={entry.id} className="hover:bg-blue-50/50 transition-colors">
                                                            <td className="py-4 px-6 text-sm font-bold text-slate-500 font-mono">{entry.date}</td>
                                                            <td className="py-4 px-4">
                                                                <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-lg text-sm font-extrabold border border-slate-300">
                                                                    {entry.size}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center text-base font-extrabold text-slate-800">
                                                                {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {isMM ? (
                                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded uppercase tracking-wide border border-indigo-200">Rolls</span>
                                                                ) : (
                                                                    <span className="text-base font-extrabold text-slate-800">{entry.pcs || '-'}</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 text-right text-base font-extrabold text-indigo-700">
                                                                {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                                            </td>
                                                            <td className="py-4 px-4 text-right text-base font-bold text-slate-500">
                                                                {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                                            </td>
                                                            <td className="py-4 px-6 text-center">
                                                                <StatusBadge status={entry.status} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --------------------------
                        FLAT LIST VIEW 
                       -------------------------- */}
                    {!isGrouped && (
                        <div className="hidden md:block w-full overflow-hidden bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                             <table className="w-full text-left border-collapse table-fixed">
                                <thead className="bg-slate-100 border-b-2 border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        {[
                                            { label: 'Date', key: 'date', width: 'w-[12%]', className: 'pl-6' },
                                            { label: 'Party Name', key: 'partyName', width: 'w-[20%]' },
                                            { label: 'Size', key: 'size', width: 'w-[10%]' },
                                            { label: 'Rolls/Pkg', key: 'bundle', width: 'w-[10%]', align: 'center' },
                                            { label: 'Pcs', key: 'pcs', width: 'w-[8%]', align: 'center' },
                                            { label: 'Disp Wt', key: 'weight', width: 'w-[12%]', align: 'right' },
                                            { label: 'Prod Wt', key: 'productionWeight', width: 'w-[12%]', align: 'right' },
                                            { label: 'Status', key: 'status', width: 'w-[16%]', align: 'center', className: 'pr-6' },
                                        ].map((col) => (
                                            <th 
                                                key={col.key}
                                                onClick={() => handleSort(col.key as SortKey)}
                                                className={`py-5 px-2 text-sm font-extrabold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-200 transition-colors select-none truncate ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                                    {sortedData.map((entry) => {
                                        const isMM = entry.size.toLowerCase().includes('mm');
                                        return (
                                            <tr key={entry.id} className="hover:bg-blue-50 transition-colors group">
                                                <td className="py-4 px-2 pl-6 align-middle text-sm font-bold text-slate-500 whitespace-nowrap font-mono">
                                                    {entry.date}
                                                </td>
                                                <td className="py-4 px-2 align-middle">
                                                    <div className="font-extrabold text-slate-800 text-base truncate" title={entry.partyName}>
                                                        {entry.partyName}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 align-middle">
                                                    <span className="inline-block px-3 py-1 rounded-lg text-sm font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {entry.size}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-center align-middle">
                                                    <span className="font-extrabold text-slate-800 text-base">
                                                        {entry.bundle ? `${entry.bundle} 📦` : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-center align-middle">
                                                    {isMM ? (
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">Rolls</span>
                                                    ) : (
                                                        <span className="font-extrabold text-slate-800 text-base">{entry.pcs || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-2 text-right align-middle">
                                                    <span className="font-extrabold text-slate-900 text-base block tabular-nums">
                                                        {entry.weight > 0 ? `${entry.weight.toLocaleString()} kg` : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-right align-middle">
                                                    <span className="font-bold text-slate-500 text-base block tabular-nums">
                                                        {entry.productionWeight > 0 ? `${entry.productionWeight.toLocaleString()} kg` : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 pr-6 text-center align-middle">
                                                    <StatusBadge status={entry.status} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-2">
                        {(isGrouped ? Object.values(groupedData).flat() : sortedData).map((entry) => {
                            const isExpanded = mobileExpandedId === entry.id;
                            const isMM = entry.size.toLowerCase().includes('mm');
                            return (
                                <div key={entry.id} className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 relative overflow-hidden transition-all active:scale-[0.99]" onClick={() => setMobileExpandedId(isExpanded ? null : entry.id)}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4 gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {entry.date}
                                            </div>
                                            <h3 className="font-extrabold text-slate-900 text-lg truncate leading-tight">{entry.partyName}</h3>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>

                                    {/* Stats Grid - Bolder for Mobile */}
                                    <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">Size</span>
                                            <span className="font-black text-slate-800 text-base">{entry.size}</span>
                                        </div>
                                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                                            <span className="text-[10px] text-indigo-400 uppercase font-black block mb-1">Disp. Wt</span>
                                            <span className="font-black text-indigo-900 text-base">{entry.weight} kg</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-right">
                                            <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">Prod. Wt</span>
                                            <span className="font-bold text-slate-600 text-base">{entry.productionWeight ? `${entry.productionWeight} kg` : '-'}</span>
                                        </div>
                                    </div>

                                    {/* Secondary Stats */}
                                    <div className="flex justify-between items-center text-sm pt-4 border-t-2 border-slate-100 border-dashed">
                                         <div className="flex gap-3">
                                            <span className="font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200">
                                                {entry.bundle || 0} 📦
                                            </span>
                                            <span className="font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200">
                                                {isMM ? 'Rolls' : `${entry.pcs || 0} Pcs`}
                                            </span>
                                         </div>
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
