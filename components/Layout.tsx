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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        currentView === view 
          ? 'bg-white/10 text-white' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      {/* Top Header - Single Screen Navigation */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-lg shadow-slate-900/10 border-b border-slate-800">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
           <div className="bg-indigo-600 p-2 rounded-lg">
              <Box className="w-5 h-5 text-white" />
           </div>
           <div className="leading-tight">
              <h1 className="text-lg font-extrabold tracking-tight">RDMS</h1>
           </div>
        </div>

        {/* Center: Navigation (Admin Only) */}
        {userRole === 'admin' && (
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 backdrop-blur-sm">
              <NavTab view={AppView.DASHBOARD} label="Dashboard" icon={LayoutDashboard} />
              <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
              <NavTab view={AppView.ANALYTICS} label="Analytics" icon={BarChart3} />
           </div>
        )}

        {/* Right: Actions & Logout */}
        <div className="flex items-center gap-2 md:gap-4">
           {userRole === 'admin' && (
              <div className="flex items-center gap-1 mr-2 border-r border-slate-800 pr-4">
                 <button 
                    onClick={onExport} 
                    title="Backup Data"
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                 >
                    <Download className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={triggerImport} 
                    title="Restore Data"
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                 >
                    <Upload className="w-5 h-5" />
                 </button>
                 <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
              </div>
           )}

           <div className="hidden md:flex items-center gap-2 text-right mr-2">
              <div className={`p-1.5 rounded-full ${userRole === 'admin' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
                 {userRole === 'admin' ? <Shield className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-xs">
                 <div className="font-bold text-slate-200">{userRole === 'admin' ? 'Admin' : 'User'}</div>
              </div>
           </div>

           <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 group"
           >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Logout</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative p-4 md:p-8 max-w-[1800px] mx-auto w-full">
         {/* Content Background Gradient */}
         <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none -z-10"></div>
         {children}
      </main>
    </div>
  );
};