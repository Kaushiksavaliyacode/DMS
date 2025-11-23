import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { ChallanView } from './views/Challan';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, ChallanEntry, UserRole } from './types';
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

const AUTH_STORAGE_KEY = 'dispatch_pro_auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- Data State (Synced via Firebase) ---
  const [dispatchData, setDispatchData] = useState<DispatchEntry[]>([]);
  const [challanData, setChallanData] = useState<ChallanEntry[]>([]);

  // --- Firebase Subscriptions ---
  // This replaces all LocalStorage logic. 
  // When data changes on the server (by any user), these hooks update the state instantly.
  useEffect(() => {
    // Subscribe to Jobs/Dispatch
    const unsubscribeDispatch = subscribeToDispatch((data) => {
      setDispatchData(data);
    });

    // Subscribe to Challans
    const unsubscribeChallan = subscribeToChallan((data) => {
      setChallanData(data);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeDispatch();
      unsubscribeChallan();
    };
  }, []);

  // Auth Persistence (Local only, simple auth for now)
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const { isLoggedIn, role } = JSON.parse(savedAuth);
        if (isLoggedIn) {
          setIsAuthenticated(true);
          setUserRole(role);
        }
      } catch (e) {
        console.error("Auth parse error", e);
      }
    }
  }, []);

  // View switching default
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'user') {
        if (currentView !== AppView.ENTRY) {
             setCurrentView(AppView.ENTRY);
        }
      } else {
        if (currentView === AppView.ENTRY) setCurrentView(AppView.DASHBOARD);
      }
    }
  }, [userRole, isAuthenticated]);

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isLoggedIn: true, role }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // --- Dispatch Actions (Connected to Firebase) ---
  const handleAddEntry = (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => {
    // We don't need to manually update state here; Firebase listener will do it
    addDispatchToFire({
      ...entry,
      timestamp: Date.now()
    });
  };

  const handleUpdateEntry = (id: string, updates: Partial<DispatchEntry>) => {
    updateDispatchInFire(id, updates);
  };

  const handleDeleteEntry = (id: string) => {
    deleteDispatchFromFire(id);
  };
  
  const handleBulkDelete = (ids: string[]) => {
     if (window.confirm(`Are you sure you want to delete ${ids.length} items?`)) {
        ids.forEach(id => deleteDispatchFromFire(id));
     }
  };

  const handleBulkStatusUpdate = (ids: string[], status: any) => { 
      ids.forEach(id => updateDispatchInFire(id, { status }));
  };

  // --- Challan Actions (Connected to Firebase) ---
  const handleAddChallan = (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => {
      addChallanToFire({
          ...entry,
          timestamp: Date.now()
      });
  };

  const handleUpdateChallan = (id: string, updates: Partial<ChallanEntry>) => {
      updateChallanInFire(id, updates);
  };

  const handleDeleteChallan = (id: string) => {
      deleteChallanFromFire(id);
  };

  // --- Export/Import (Optional now with Cloud Sync, but kept for backup) ---
  const handleExportData = () => {
    const exportObj = { dispatch: dispatchData, challan: challanData };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `rdms_cloud_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    alert("Import is disabled in Cloud Mode to prevent overwriting live data accidentally.");
    // In a real app, you would parse and loop through to `addDoc` for each item
  };

  const renderView = () => {
    if (currentView === AppView.CHALLAN) {
        return <ChallanView data={challanData} onAdd={handleAddChallan} onUpdate={handleUpdateChallan} onDelete={handleDeleteChallan} />;
    }

    if (userRole === 'user' && currentView === AppView.ENTRY) {
      return (
        <DispatchEntryView 
          entries={dispatchData}
          onAddEntry={handleAddEntry} 
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          onBulkDelete={handleBulkDelete}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          // Challan Props
          challanData={challanData}
          onAddChallan={handleAddChallan}
          onUpdateChallan={handleUpdateChallan}
          onDeleteChallan={handleDeleteChallan}
        />
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView data={dispatchData} challanData={challanData} onDeleteChallan={handleDeleteChallan} onUpdateChallan={handleUpdateChallan} />;
      case AppView.ANALYTICS:
        return <AnalyticsView data={dispatchData} />;
      default:
        return <DashboardView data={dispatchData} challanData={challanData} onDeleteChallan={handleDeleteChallan} onUpdateChallan={handleUpdateChallan} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView} 
      userRole={userRole}
      onLogout={handleLogout}
      onExport={handleExportData}
      onImport={handleImportData}
    >
      {renderView()}
    </Layout>
  );
};

export default App;