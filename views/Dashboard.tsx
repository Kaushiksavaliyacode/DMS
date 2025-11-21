
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

  const StatusBadge = ({ status }: { status: DispatchStatus }) => {
    const config = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending' },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Running' },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Completed' }
    };
    const style = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
        {style.label}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900 font-mono">{value}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{sub}</span>
                </div>
            </div>
            <div className={`p-2 rounded-lg ${bgClass}`}>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-24">
      
      {/* KPI Section - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            title="Avg Weight" 
            value={(totals.count > 0 ? totals.weight / totals.count : 0).toFixed(0)} 
            sub="kg" 
            icon={TrendingUp} 
            colorClass="text-pink-600" 
            bgClass="bg-pink-50" 
        />
      </div>

      {/* Main Data Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Filters Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
            <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
                    <Filter className="w-3 h-3 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">Data Filters</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <select 
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-white rounded border border-slate-200 px-2">
                     <input 
                        type="date"
                        className="py-1 bg-transparent border-0 text-[10px] font-bold text-slate-600 focus:ring-0 outline-none w-24"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-300 mx-1">-</span>
                     <input 
                        type="date"
                        className="py-1 bg-transparent border-0 text-[10px] font-bold text-slate-600 focus:ring-0 outline-none w-24"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center px-2 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors text-[10px] font-bold"
                    >
                        <XCircle className="w-3 h-3 mr-1" />
                        Clear
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50/30 relative">
            {sortedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Search className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No records found</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View - STRICTLY SINGLE SCREEN / NO SCROLL */}
                    <div className="hidden md:block w-full">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-white text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {/* Optimized widths to include Date and Wastage within single screen */}
                                    {[
                                        { label: 'Date', key: 'date', width: 'w-[10%]', className: 'pl-3' },
                                        { label: 'Party Name', key: 'partyName', width: 'w-[18%]' },
                                        { label: 'Size', key: 'size', width: 'w-[8%]' },
                                        { label: 'Rolls', key: 'bundle', width: 'w-[8%]', align: 'center' },
                                        { label: 'Pcs', key: 'pcs', width: 'w-[8%]', align: 'center' },
                                        { label: 'Disp Wt', key: 'weight', width: 'w-[10%]', align: 'right' },
                                        { label: 'Prod Wt', key: 'productionWeight', width: 'w-[10%]', align: 'right' },
                                        { label: 'Wastage', key: 'wastage', width: 'w-[10%]', align: 'right' },
                                        { label: 'Status', key: 'status', width: 'w-[12%]', align: 'center', className: 'pr-3' },
                                    ].map((col) => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key as SortKey)}
                                            className={`py-3 px-1 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none truncate ${col.width} ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                                    
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-2.5 px-1 pl-3 align-middle text-xs font-medium text-slate-500 whitespace-nowrap">
                                                {entry.date}
                                            </td>
                                            <td className="py-2.5 px-1 align-middle">
                                                <div className="font-bold text-slate-700 text-xs truncate" title={entry.partyName}>{entry.partyName}</div>
                                            </td>
                                            <td className="py-2.5 px-1 align-middle">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {entry.size}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-1 text-center align-middle text-xs font-bold text-slate-600">
                                                {entry.bundle || '-'}
                                            </td>
                                            <td className="py-2.5 px-1 text-center align-middle text-xs font-bold text-slate-600">
                                                {entry.pcs || '-'}
                                            </td>
                                            <td className="py-2.5 px-1 text-right align-middle text-xs font-bold text-slate-800 font-mono">
                                                {entry.weight > 0 ? entry.weight.toLocaleString() : '-'}
                                            </td>
                                            <td className="py-2.5 px-1 text-right align-middle text-xs font-medium text-slate-500 font-mono">
                                                {entry.productionWeight > 0 ? entry.productionWeight.toLocaleString() : '-'}
                                            </td>
                                            <td className="py-2.5 px-1 text-right align-middle text-xs font-mono">
                                                {wastage !== 0 ? (
                                                    <span className={`font-bold ${wastage > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {wastage > 0 ? '+' : ''}{wastage.toFixed(1)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-2.5 px-1 pr-3 text-center align-middle">
                                                <StatusBadge status={entry.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View - Optimized to show Date & Wastage */}
                    <div className="md:hidden grid grid-cols-1 gap-2 p-2">
                        {sortedData.map((entry) => {
                            const isExpanded = mobileExpandedId === entry.id;
                            const wastage = (entry.productionWeight || 0) > 0 ? (entry.productionWeight - entry.weight) : 0;

                            return (
                                <div key={entry.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 relative" onClick={() => setMobileExpandedId(isExpanded ? null : entry.id)}>
                                    {/* Header: Date, Party & Status */}
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {entry.date}
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{entry.partyName}</h3>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>

                                    {/* Primary Stats Row */}
                                    <div className="grid grid-cols-3 gap-2 text-xs mb-2 bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Size</span>
                                            <span className="font-bold text-slate-700">{entry.size}</span>
                                        </div>
                                        <div className="flex flex-col text-center">
                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Disp. Wt</span>
                                            <span className="font-bold text-indigo-600">{entry.weight}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Prod. Wt</span>
                                            <span className="font-bold text-slate-600">{entry.productionWeight || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Secondary Stats Row */}
                                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                                         <div className="flex gap-3">
                                            <span className="font-semibold bg-slate-100 px-1.5 rounded text-slate-600">{entry.bundle || 0} Rolls</span>
                                            <span className="font-semibold bg-slate-100 px-1.5 rounded text-slate-600">{entry.pcs || 0} Pcs</span>
                                         </div>
                                         
                                         {wastage !== 0 && (
                                             <div className={`flex items-center font-bold ${wastage > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                ws: {wastage > 0 ? '+' : ''}{wastage.toFixed(1)}
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
