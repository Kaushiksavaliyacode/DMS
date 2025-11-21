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
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105' 
          : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Top Header - Glassmorphism */}
      <header className="h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 border-b border-slate-100">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
           <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Box className="w-6 h-6 text-white" />
           </div>
           <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">RDMS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Production</p>
           </div>
        </div>

        {/* Center: Navigation (Admin Only) */}
        {userRole === 'admin' && (
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex bg-white/50 rounded-full p-1.5 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
              <NavTab view={AppView.DASHBOARD} label="Dashboard" icon={LayoutDashboard} />
              <NavTab view={AppView.ANALYTICS} label="Analytics" icon={BarChart3} />
           </div>
        )}

        {/* Right: Actions & Logout */}
        <div className="flex items-center gap-3 md:gap-6">
           {userRole === 'admin' && (
              <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-6">
                 <button 
                    onClick={onExport} 
                    title="Backup Data"
                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                 >
                    <Download className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={triggerImport} 
                    title="Restore Data"
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                 >
                    <Upload className="w-5 h-5" />
                 </button>
                 <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
              </div>
           )}

           <div className="hidden md:flex items-center gap-3 text-right mr-2">
              <div className={`p-2 rounded-full ${userRole === 'admin' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                 {userRole === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{userRole === 'admin' ? 'Admin' : 'User'}</div>
                 <div className="text-[10px] font-medium text-slate-400">Logged In</div>
              </div>
           </div>

           <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-red-100 shadow-sm hover:shadow-md group"
           >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden md:inline">Logout</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full">
         {/* Soft ambient background blobs */}
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none"></div>
         
         <div className="h-full overflow-auto p-4 md:p-8 max-w-[1920px] mx-auto relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
};