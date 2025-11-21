
import React, { ReactNode, useRef } from 'react';
import { LayoutDashboard, PenTool, BarChart3, Box, Menu, X, Shield, User, LogOut, ChevronRight, Download, Upload } from 'lucide-react';
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

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full px-4 py-3.5 text-sm font-bold transition-all rounded-2xl mb-2 relative overflow-hidden ${
      isActive 
        ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-900/10' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>
    <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="relative z-10 tracking-tight">{label}</span>
    {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole, onLogout, onExport, onImport }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-700">
      {/* Desktop Sidebar - Floating Design */}
      <aside className="hidden md:flex flex-col w-72 bg-[#111827] text-white h-[calc(100vh-2rem)] m-4 rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-slate-800/50 relative overflow-hidden z-20">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[10%] -right-[20%] w-[70%] h-[30%] bg-indigo-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[40%] bg-blue-600/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10 flex items-center h-28 px-8">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-2xl mr-4 shadow-lg shadow-indigo-500/30">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight block leading-none text-white">Dispatch</span>
            <span className="text-[10px] text-indigo-400 font-bold tracking-[0.2em] uppercase mt-1.5 block">Pro System</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 px-6 py-4">
          <div className="mb-6 pl-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {userRole === 'admin' ? 'Admin Console' : 'Operator Console'}
          </div>

          {userRole === 'user' && (
            <SidebarItem 
              icon={PenTool} 
              label="Data Entry" 
              isActive={true} 
              onClick={() => {}} 
            />
          )}

          {userRole === 'admin' && (
            <>
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Live Dashboard" 
                isActive={currentView === AppView.DASHBOARD} 
                onClick={() => setView(AppView.DASHBOARD)} 
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Analytics & AI" 
                isActive={currentView === AppView.ANALYTICS} 
                onClick={() => setView(AppView.ANALYTICS)} 
              />
              
              {/* Data Management Divider */}
              <div className="my-6 border-t border-slate-800/50"></div>
              <div className="mb-3 pl-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Data Management
              </div>

              <button onClick={onExport} className="group flex items-center w-full px-4 py-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl mb-2 transition-all">
                 <Download className="w-4 h-4 mr-3" />
                 Backup Data
              </button>
              
              <button onClick={triggerImport} className="group flex items-center w-full px-4 py-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl mb-2 transition-all">
                 <Upload className="w-4 h-4 mr-3" />
                 Restore Data
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onImport} 
                className="hidden" 
                accept=".json" 
              />
            </>
          )}
        </div>

        {/* User Profile / Logout */}
        <div className="relative z-10 p-4 mt-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-center mb-4">
                <div className={`p-2 rounded-xl mr-3 ${userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {userRole === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">
                        {userRole === 'admin' ? 'Administrator' : 'Operator'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center font-bold mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        Connected
                    </div>
                </div>
            </div>
            
            <button 
                onClick={onLogout}
                className="flex items-center justify-center w-full py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/20 group"
            >
                <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Sidebar Overlay */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-1.5 rounded-lg mr-3 shadow-md shadow-indigo-500/20">
                 <Box className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold tracking-tight text-slate-900">DispatchPro</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 active:bg-slate-100 rounded-xl transition-colors">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </header>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-slate-900/95 backdrop-blur-xl text-white z-40 md:hidden p-6 flex flex-col animate-in slide-in-from-top-5 duration-300">
             <div className="space-y-3 flex-1">
              {userRole === 'user' ? (
                 <SidebarItem 
                  icon={PenTool} 
                  label="Data Entry" 
                  isActive={true} 
                  onClick={() => { setIsMobileMenuOpen(false); }} 
                />
              ) : (
                <>
                  <SidebarItem 
                    icon={LayoutDashboard} 
                    label="Live Dashboard" 
                    isActive={currentView === AppView.DASHBOARD} 
                    onClick={() => { setView(AppView.DASHBOARD); setIsMobileMenuOpen(false); }} 
                  />
                  <SidebarItem 
                    icon={BarChart3} 
                    label="Analytics & AI" 
                    isActive={currentView === AppView.ANALYTICS} 
                    onClick={() => { setView(AppView.ANALYTICS); setIsMobileMenuOpen(false); }} 
                  />
                  <div className="h-px bg-slate-800 my-4"></div>
                  <button onClick={() => { onExport(); setIsMobileMenuOpen(false); }} className="w-full py-3 text-left text-sm font-bold text-emerald-400 flex items-center">
                    <Download className="w-5 h-5 mr-3" /> Backup Data
                  </button>
                  <button onClick={() => { triggerImport(); setIsMobileMenuOpen(false); }} className="w-full py-3 text-left text-sm font-bold text-indigo-400 flex items-center">
                    <Upload className="w-5 h-5 mr-3" /> Restore Data
                  </button>
                  <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
                </>
              )}
            </div>
            <div className="mt-auto pt-6 border-t border-slate-800">
               <button 
                  onClick={onLogout}
                  className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl text-center font-bold flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Secure Logout
                </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#f8fafc] scroll-smooth relative">
           {/* Decorative Gradients */}
           <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 via-white/0 to-transparent pointer-events-none"></div>
           
          <div className="p-4 md:p-8 max-w-[1800px] mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
