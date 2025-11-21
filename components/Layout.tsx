
import React, { ReactNode, useRef } from 'react';
import { LayoutDashboard, Box, LogOut, Download, Upload, Shield, User, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const NavTab = ({ view, label, icon: Icon }: { view: AppView, label: string, icon: React.ElementType }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Top Header - Soft Premium */}
      <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-[1920px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <Box className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">RDMS</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Production</p>
             </div>
          </div>

          {/* Center: Navigation (Admin Desktop) */}
          {userRole === 'admin' && (
             <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                <NavTab view={AppView.DASHBOARD} label="Dashboard" icon={LayoutDashboard} />
                {/* Analytics merged into Dashboard in Power BI style, but keeping tab if needed for future */}
             </div>
          )}

          {/* Right: Actions & Logout */}
          <div className="flex items-center gap-3">
             {userRole === 'admin' && (
                <div className="hidden md:flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                   <button 
                      onClick={onExport} 
                      title="Backup Data"
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                   >
                      <Download className="w-5 h-5" />
                   </button>
                   <button 
                      onClick={triggerImport} 
                      title="Restore Data"
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                   >
                      <Upload className="w-5 h-5" />
                   </button>
                   <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
                </div>
             )}

             <div className="hidden md:flex items-center gap-3 text-right">
                <div className={`p-2 rounded-xl ${userRole === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {userRole === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="leading-tight">
                   <div className="text-xs font-bold text-slate-800">{userRole === 'admin' ? 'Administrator' : 'Operator'}</div>
                </div>
             </div>

             <button 
                onClick={onLogout}
                className="hidden md:flex items-center gap-2 bg-white text-red-500 px-4 py-2 text-xs font-bold rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
             >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
             </button>

             {/* Mobile Menu Toggle */}
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
             >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 absolute top-16 left-0 w-full z-40 shadow-xl animate-in slide-in-from-top-5">
           <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className={`p-2 rounded-xl ${userRole === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {userRole === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                 <div className="font-bold text-slate-800">{userRole === 'admin' ? 'Administrator' : 'Operator'}</div>
                 <div className="text-xs text-slate-400">Logged In</div>
              </div>
           </div>

           {userRole === 'admin' && (
             <div className="space-y-2">
               <button onClick={() => { setView(AppView.DASHBOARD); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-semibold">
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
               </button>
               <div className="grid grid-cols-2 gap-2">
                 <button onClick={onExport} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 font-semibold">
                    <Download className="w-4 h-4" /> Backup
                 </button>
                 <button onClick={triggerImport} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 font-semibold">
                    <Upload className="w-4 h-4" /> Restore
                 </button>
               </div>
             </div>
           )}

           <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl font-bold"
           >
              <LogOut className="w-5 h-5" /> Logout
           </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full">
         <div className="h-full overflow-auto p-3 md:p-6 max-w-[1920px] mx-auto relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
};
    