
import React, { useMemo, useState } from 'react';
import { DispatchEntry, DispatchStatus } from '../types';
import { 
  Search, Filter, ArrowUpDown, 
  ArrowUp, ArrowDown, Package, Scale, TrendingUp, XCircle, Layers, Calendar, ChevronRight
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
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border} shadow-sm whitespace-nowrap`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-current ${status === 'running' ? 'animate-pulse' : ''}`}></span>
        {style.label}
      </span>
    );
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12`}>
            <Icon size={100} className="text-slate-900" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${bgClass}`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{value}</span>
                <span className="text-xs font-semibold text-slate-400">{sub}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            sub="kg/job" 
            icon={TrendingUp} 
            colorClass="text-pink-600" 
            bgClass="bg-pink-50" 
        />
      </div>

      {/* Main Data Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <Filter className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700 hidden sm:inline">Filters</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto overflow-x-auto pb-1 sm:pb-0">
                <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[140px]"
                    value={filters.party}
                    onChange={(e) => setFilters({...filters, party: e.target.value})}
                >
                    <option value="">All Parties</option>
                    {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select 
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[100px]"
                    value={filters.size}
                    onChange={(e) => setFilters({...filters, size: e.target.value})}
                >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 shadow-sm">
                     <Calendar className="w-3 h-3 text-slate-400 mr-2 flex-shrink-0" />
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-bold text-slate-600 focus:ring-0 outline-none w-24 sm:w-28"
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     />
                     <span className="text-slate-300 mx-1">-</span>
                     <input 
                        type="date"
                        className="py-1.5 bg-transparent border-0 text-xs font-bold text-slate-600 focus:ring-0 outline-none w-24 sm:w-28"
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     />
                </div>

                 {(filters.party || filters.size || filters.startDate || filters.endDate) && (
                    <button 
                        onClick={clearFilters}
                        className="flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold"
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
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No records found matching filters</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {[
                                        { label: 'Party Name', key: 'partyName', className: 'pl-6' },
                                        { label: 'Date', key: 'date' },
                                        { label: 'Size', key: 'size' },
                                        { label: 'Rolls', key: 'bundle', align: 'center' },
                                        { label: 'Pcs', key: 'pcs', align: 'center' },
                                        { label: 'Disp. Wt', key: 'weight', align: 'right' },
                                        { label: 'Prod. Wt', key: 'productionWeight', align: 'right' },
                                        { label: 'Wst', key: 'wastage', align: 'right' },
                                        { label: 'Status', key: 'status', align: 'center', className: 'pr-6' },
                                    ].map((col) => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key as SortKey)}
                                            className={`py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                                    const wastage = (entry.productionWeight || 0) - (entry.weight || 0);
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-3.5 px-4 pl-6 max-w-[200px]">
                                                <div className="font-bold text-slate-700 truncate" title={entry.partyName}>{entry.partyName}</div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                                                {entry.date}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-block px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {entry.size}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-600">
                                                {entry.bundle || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-600">
                                                {entry.pcs || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-800 font-mono">
                                                {entry.weight > 0 ? entry.weight.toLocaleString() : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-xs font-medium text-slate-500 font-mono">
                                                {entry.productionWeight > 0 ? entry.productionWeight.toLocaleString() : '-'}
                                            </td>
                                            <td className={`py-3.5 px-4 text-right text-[11px] font-bold font-mono ${wastage > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {entry.productionWeight && entry.weight ? wastage.toLocaleString() : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 pr-6 text-center">
                                                <StatusBadge status={entry.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View - visible only on small screens */}
                    <div className="md:hidden grid grid-cols-1 gap-3 p-3">
                        {sortedData.map((entry) => {
                            const wastage = (entry.productionWeight || 0) - (entry.weight || 0);
                            const isExpanded = mobileExpandedId === entry.id;
                            
                            return (
                                <div key={entry.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden" onClick={() => setMobileExpandedId(isExpanded ? null : entry.id)}>
                                    {/* Top Row: Status & Date */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {entry.date}
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>

                                    {/* Main Info */}
                                    <div className="mb-4">
                                        <h3 className="font-bold text-slate-800 text-base leading-tight mb-2">{entry.partyName}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-block px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {entry.size}
                                            </span>
                                            {entry.bundle > 0 && <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Package className="w-3 h-3" /> {entry.bundle} Rolls</span>}
                                        </div>
                                    </div>

                                    {/* Key Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-50">
                                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Weight</div>
                                            <div className="text-sm font-extrabold text-indigo-600">{entry.weight.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prod.</div>
                                            <div className="text-sm font-bold text-slate-600">{entry.productionWeight || '-'}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Wst.</div>
                                            <div className={`text-sm font-bold ${wastage > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {entry.productionWeight ? wastage.toLocaleString() : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expand Prompt */}
                                    <div className="text-center mt-1">
                                        <ChevronRight className={`w-4 h-4 mx-auto text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-90'}`} />
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs animate-in slide-in-from-top-2 bg-slate-50/50 -mx-4 -mb-4 p-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-medium">Pieces</span>
                                                <span className="font-bold text-slate-700">{entry.pcs}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-medium">Job ID</span>
                                                <span className="font-mono text-slate-500">#{entry.id.slice(0,6)}</span>
                                            </div>
                                        </div>
                                    )}
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
