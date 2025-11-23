import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { ChallanView } from './views/Challan';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, ChallanEntry, UserRole } from './types';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  subscribeToDispatch, 
  addDispatchToFire, 
  updateDispatchInFire, 
  deleteDispatchFromFire,
  subscribeToChallan,
  addChallanToFire,
  updateChallanInFire,
  deleteChallanFromFire
} from './services/firebaseService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [dispatchData, setDispatchData] = useState<DispatchEntry[]>([]);
  const [challanData, setChallanData] = useState<ChallanEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserRole(user.email?.startsWith('admin') ? 'admin' : 'user');
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
        setIsDataLoading(false);
        return;
    }
    setIsDataLoading(true);
    let dispatchLoaded = false;
    let challanLoaded = false;
    const checkLoading = () => {
        if (dispatchLoaded && challanLoaded) setIsDataLoading(false);
    };
    const unsubscribeDispatch = subscribeToDispatch((data) => {
      setDispatchData(data);
      dispatchLoaded = true;
      checkLoading();
    });
    const unsubscribeChallan = subscribeToChallan((data) => {
      setChallanData(data);
      challanLoaded = true;
      checkLoading();
    });
    return () => {
      unsubscribeDispatch();
      unsubscribeChallan();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'user' && currentView !== AppView.ENTRY) setCurrentView(AppView.ENTRY);
      else if (userRole === 'admin' && currentView === AppView.ENTRY) setCurrentView(AppView.DASHBOARD);
    }
  }, [userRole, isAuthenticated]);

  const handleLogin = (role: UserRole) => setUserRole(role);
  const handleLogout = async () => await signOut(auth);

  const handleAddEntry = async (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => await addDispatchToFire({ ...entry, timestamp: Date.now() });
  const handleUpdateEntry = async (id: string, updates: Partial<DispatchEntry>) => await updateDispatchInFire(id, updates);
  const handleDeleteEntry = async (id: string) => await deleteDispatchFromFire(id);
  const handleBulkDelete = (ids: string[]) => { if (window.confirm(`Delete ${ids.length} items?`)) { ids.forEach(id => deleteDispatchFromFire(id)); } };
  const handleBulkStatusUpdate = (ids: string[], status: any) => ids.forEach(id => updateDispatchInFire(id, { status }));
  const handleAddChallan = async (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => await addChallanToFire({ ...entry, timestamp: Date.now() });
  const handleUpdateChallan = async (id: string, updates: Partial<ChallanEntry>) => await updateChallanInFire(id, updates);
  const handleDeleteChallan = async (id: string) => await deleteChallanFromFire(id);

  const handleExportData = () => {
    const exportObj = { dispatch: dispatchData, challan: challanData };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rdms_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  const handleImportData = () => alert("Import disabled in Cloud Mode.");

  const renderView = () => {
    if (currentView === AppView.CHALLAN) return <ChallanView data={challanData} onAdd={handleAddChallan} onUpdate={handleUpdateChallan} onDelete={handleDeleteChallan} />;
    if (userRole === 'user') {
      return <DispatchEntryView entries={dispatchData} onAddEntry={handleAddEntry} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} onBulkDelete={handleBulkDelete} onBulkStatusUpdate={handleBulkStatusUpdate} challanData={challanData} onAddChallan={handleAddChallan} onUpdateChallan={handleUpdateChallan} onDeleteChallan={handleDeleteChallan} />;
    }
    return <DashboardView data={dispatchData} challanData={challanData} onDeleteChallan={handleDeleteChallan} onUpdateChallan={handleUpdateChallan} />;
  };

  if (isAuthLoading || (isAuthenticated && isDataLoading)) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }
  if (!isAuthenticated) return <LoginView onLogin={handleLogin} />;

  return (
    <Layout currentView={currentView} setView={setCurrentView} userRole={userRole} onLogout={handleLogout} onExport={handleExportData} onImport={handleImportData}>
      {renderView()}
    </Layout>
  );
};
export default App;