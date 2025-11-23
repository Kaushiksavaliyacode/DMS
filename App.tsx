
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { ChallanView } from './views/Challan';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, ChallanEntry, UserRole, MOCK_PARTIES, DispatchStatus, PaymentType, ChallanType } from './types';

const LOCAL_STORAGE_KEY = 'dispatch_pro_data';
const CHALLAN_STORAGE_KEY = 'dispatch_pro_challan';
const AUTH_STORAGE_KEY = 'dispatch_pro_auth';

// --- Mock Data Generators ---
const generateMockDispatch = (): DispatchEntry[] => {
  const entries: DispatchEntry[] = [];
  const sizes = ['12x12', '14x14', '100mm', '150mm', '200x100', 'Standard'];
  const statuses: DispatchStatus[] = ['pending', 'running', 'completed'];

  for (let i = 0; i < 20; i++) {
    const isMM = Math.random() > 0.5;
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const weight = Math.floor(Math.random() * 2000) + 100;
    const bundle = Math.floor(Math.random() * 50) + 1;
    // Generate date within last 30 days
    const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    entries.push({
      id: crypto.randomUUID(),
      date,
      partyName: MOCK_PARTIES[Math.floor(Math.random() * MOCK_PARTIES.length)],
      size,
      weight,
      productionWeight: weight + (Math.random() * 50), 
      pcs: isMM ? 0 : bundle * (Math.floor(Math.random() * 10) + 1),
      bundle,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: Date.now() - (i * 1000000) // Stagger timestamps
    });
  }
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

const generateMockChallan = (): ChallanEntry[] => {
  const entries: ChallanEntry[] = [];
  const sizes = ['12x12', '14x14', '100mm', '150mm'];

  for (let i = 0; i < 20; i++) {
    const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const typeRandom = Math.random();
    let paymentType: PaymentType = 'credit';
    let challanType: ChallanType = 'debit_note';

    if (typeRandom < 0.33) {
      paymentType = 'cash';
      challanType = 'debit_note';
    } else if (typeRandom < 0.66) {
      paymentType = 'credit';
      challanType = 'jobwork';
    } else {
      paymentType = 'credit';
      challanType = 'debit_note';
    }

    const items = [];
    const numItems = Math.floor(Math.random() * 3) + 1;
    let grandTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const weight = Math.floor(Math.random() * 500) + 10;
      const price = challanType === 'jobwork' ? 0 : Math.floor(Math.random() * 50) + 100;
      const total = weight * price;
      grandTotal += total;
      items.push({
        id: crypto.randomUUID(),
        size: sizes[Math.floor(Math.random() * sizes.length)],
        weight,
        price,
        total
      });
    }

    entries.push({
      id: crypto.randomUUID(),
      challanNo: (1000 + i).toString(),
      date,
      partyName: MOCK_PARTIES[Math.floor(Math.random() * MOCK_PARTIES.length)],
      paymentType,
      challanType,
      items,
      grandTotal,
      timestamp: Date.now() - (i * 1000000)
    });
  }
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

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
          const migrated = migrateData(parsed);
          // Auto-seed if empty
          if (migrated.length === 0) return generateMockDispatch();
          return migrated;
        }
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
    }
    return generateMockDispatch();
  });

  // --- Challan Data State ---
  const [challanData, setChallanData] = useState<ChallanEntry[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(CHALLAN_STORAGE_KEY);
        if (savedData) {
           const parsed = JSON.parse(savedData);
           const migrated = migrateChallan(parsed);
           if (migrated.length === 0) return generateMockChallan();
           return migrated;
        }
      }
    } catch (e) {
      console.error("Failed to load challan data", e);
    }
    return generateMockChallan();
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

  const handleUpdateChallan = (id: string, updates: Partial<ChallanEntry>) => {
      setChallanData(prev => prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
      ));
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
