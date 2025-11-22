
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { ChallanView } from './views/Challan';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, ChallanEntry, UserRole } from './types';

const LOCAL_STORAGE_KEY = 'dispatch_pro_data';
const CHALLAN_STORAGE_KEY = 'dispatch_pro_challan';
const AUTH_STORAGE_KEY = 'dispatch_pro_auth';

// Helper to ensure old data formats don't crash the new app
const migrateData = (data: any[]): DispatchEntry[] => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    status: item.status || 'pending', 
    pcs: typeof item.pcs === 'number' ? item.pcs : 0,
    bundle: typeof item.bundle === 'number' ? item.bundle : 0,
    weight: typeof item.weight === 'number' ? item.weight : 0,
    productionWeight: typeof item.productionWeight === 'number' ? item.productionWeight : 0,
    date: item.date || new Date().toISOString().split('T')[0],
    timestamp: item.timestamp || Date.now()
  }));
};

const migrateChallan = (data: any[]): ChallanEntry[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
        ...item,
        challanType: item.challanType || 'sales'
    }));
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // --- Dispatch Data State ---
  const [dispatchData, setDispatchData] = useState<DispatchEntry[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          return migrateData(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
    }
    return [];
  });

  // --- Challan Data State ---
  const [challanData, setChallanData] = useState<ChallanEntry[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(CHALLAN_STORAGE_KEY);
        if (savedData) return migrateChallan(JSON.parse(savedData));
      }
    } catch (e) {
      console.error("Failed to load challan data", e);
    }
    return [];
  });

  useEffect(() => {
    setIsDataLoaded(true);
  }, []);

  // Auth Persistence
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

  // Save Dispatch Data
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dispatchData));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [dispatchData, isDataLoaded]);

  // Save Challan Data
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem(CHALLAN_STORAGE_KEY, JSON.stringify(challanData));
    } catch (e) {
      console.error("Failed to save challan data", e);
    }
  }, [challanData, isDataLoaded]);

  // View switching default
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'user') {
        // Users default to ENTRY which contains both jobs and challan
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

  // --- Dispatch Actions ---
  const handleAddEntry = (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => {
    const newEntry: DispatchEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setDispatchData(prev => [newEntry, ...prev]);
  };

  const handleUpdateEntry = (id: string, updates: Partial<DispatchEntry>) => {
    setDispatchData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteEntry = (id: string) => {
    setDispatchData(prev => prev.filter(item => item.id !== id));
  };
  
  const handleBulkDelete = (ids: string[]) => {
     if (window.confirm(`Are you sure you want to delete ${ids.length} items?`)) {
        setDispatchData(prev => prev.filter(item => !ids.includes(item.id)));
     }
  };

  const handleBulkStatusUpdate = (ids: string[], status: any) => { 
      setDispatchData(prev => prev.map(item => 
          ids.includes(item.id) ? { ...item, status } : item
      ));
  };

  // --- Challan Actions ---
  const handleAddChallan = (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => {
      const newChallan: ChallanEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now()
      };
      setChallanData(prev => [newChallan, ...prev]);
  };

  const handleDeleteChallan = (id: string) => {
      setChallanData(prev => prev.filter(c => c.id !== id));
  };

  // --- Backup & Restore ---
  const handleExportData = () => {
    const exportObj = { dispatch: dispatchData, challan: challanData };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `rdms_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        // Support legacy single-array backup or new object backup
        if (Array.isArray(parsed)) {
             if (window.confirm("Legacy backup found. Restore dispatch data?")) {
                 setDispatchData(migrateData(parsed));
             }
        } else if (parsed.dispatch || parsed.challan) {
             if (window.confirm("Restore data? This replaces current data.")) {
                 if (parsed.dispatch) setDispatchData(migrateData(parsed.dispatch));
                 if (parsed.challan) setChallanData(migrateChallan(parsed.challan));
             }
        }
      } catch (err) {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const renderView = () => {
    if (currentView === AppView.CHALLAN) {
        // For admin direct view of Challans if we kept it (optional, currently not linked in layout for admin)
        return <ChallanView data={challanData} onAdd={handleAddChallan} onDelete={handleDeleteChallan} />;
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
          onDeleteChallan={handleDeleteChallan}
        />
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView data={dispatchData} />;
      case AppView.ANALYTICS:
        return <AnalyticsView data={dispatchData} />;
      default:
        return <DashboardView data={dispatchData} />;
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
