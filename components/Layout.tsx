
import React, { ReactNode, useRef } from 'react';
import { LayoutDashboard, BarChart3, Box, LogOut, Download, Upload, Shield, User } from 'lucide-react';
import { AppView, UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
  userRole: UserRole;
  onLogout: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole, onLogout, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const NavTab = ({ view, label, icon: Icon }: { view: AppView, label: string, icon: React.ElementType }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide border-2 transition-all active:translate-y-0.5 ${
        currentView === view 
          ? 'bg-yellow-400 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
          : 'bg-white text-slate-500 border-transparent hover:border-slate-900 hover:text-black'
      }`}
    >
      <Icon className="w-4 h-4" strokeWidth={3} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      {/* Top Header - Bold & Sturdy */}
      <header className="h-20 bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 border-b-4 border-black">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
           <div className="bg-black p-2.5 border-2 border-black shadow-[4px_4px_0px_0px_#fbbf24]">
              <Box className="w-6 h-6 text-yellow-400" strokeWidth={3} />
           </div>
           <div>
              <h1 className="text-2xl font-black tracking-tighter text-black uppercase leading-none">RDMS</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Production</p>
           </div>
        </div>

        {/* Center: Navigation (Admin Only) */}
        {userRole === 'admin' && (
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 hidden md:flex gap-4">
              <NavTab view={AppView.DASHBOARD} label="Dashboard" icon={LayoutDashboard} />
              <NavTab view={AppView.ANALYTICS} label="Analytics" icon={BarChart3} />
           </div>
        )}

        {/* Right: Actions & Logout */}
        <div className="flex items-center gap-3 md:gap-6">
           {userRole === 'admin' && (
              <div className="flex items-center gap-2 mr-2 border-r-2 border-slate-200 pr-6">
                 <button 
                    onClick={onExport} 
                    title="Backup Data"
                    className="p-2 text-black border-2 border-transparent hover:border-black hover:bg-emerald-100 rounded-lg transition-all"
                 >
                    <Download className="w-5 h-5" strokeWidth={2.5} />
                 </button>
                 <button 
                    onClick={triggerImport} 
                    title="Restore Data"
                    className="p-2 text-black border-2 border-transparent hover:border-black hover:bg-blue-100 rounded-lg transition-all"
                 >
                    <Upload className="w-5 h-5" strokeWidth={2.5} />
                 </button>
                 <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
              </div>
           )}

           <div className="hidden md:flex items-center gap-3 text-right mr-2">
              <div className={`p-2 border-2 border-black ${userRole === 'admin' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                 {userRole === 'admin' ? <Shield className="w-4 h-4 text-black" strokeWidth={3} /> : <User className="w-4 h-4 text-black" strokeWidth={3} />}
              </div>
              <div>
                 <div className="text-xs font-black text-black uppercase tracking-wide">{userRole === 'admin' ? 'Admin' : 'User'}</div>
              </div>
           </div>

           <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
           >
              <LogOut className="w-4 h-4" strokeWidth={3} />
              <span className="hidden md:inline">Logout</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full bg-slate-50">
         {/* Pattern Background */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
         
         <div className="h-full overflow-auto p-4 md:p-8 max-w-[1920px] mx-auto relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
};
