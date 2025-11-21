
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, UserRole } from './types';

const LOCAL_STORAGE_KEY = 'dispatch_pro_data';
const AUTH_STORAGE_KEY = 'dispatch_pro_auth';

// Helper to ensure old data formats don't crash the new app
const migrateData = (data: any[]): DispatchEntry[] => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    // Ensure ID exists
    id: item.id || crypto.randomUUID(),
    // Default missing fields
    status: item.status || 'pending', 
    pcs: typeof item.pcs === 'number' ? item.pcs : 0,
    bundle: typeof item.bundle === 'number' ? item.bundle : 0,
    weight: typeof item.weight === 'number' ? item.weight : 0,
    productionWeight: typeof item.productionWeight === 'number' ? item.productionWeight : 0,
    // Ensure date is valid string
    date: item.date || new Date().toISOString().split('T')[0],
    // Ensure timestamp exists for sorting
    timestamp: item.timestamp || Date.now()
  }));
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin'); 
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Lazy initialization with MIGRATION logic
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

  // Save data whenever it changes
  useEffect(() => {
    try {
      // Double check we aren't saving an empty array over existing data due to a bug
      // (Only strict safety check, allowing empty if user actually deleted everything)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dispatchData));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [dispatchData]);

  // Real-time synchronization: Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const newData = JSON.parse(event.newValue);
          setDispatchData(migrateData(newData));
        } catch (error) {
          console.error("Error syncing real-time data:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Switch default view when role changes or login happens
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'user') {
        setCurrentView(AppView.ENTRY);
      } else {
        setCurrentView(AppView.DASHBOARD);
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
    // NOTE: We deliberately DO NOT clear dispatch data here to ensure lifetime persistence
  };

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

  const renderView = () => {
    if (userRole === 'user') {
      return (
        <DispatchEntryView 
          entries={dispatchData}
          onAddEntry={handleAddEntry} 
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          onBulkDelete={handleBulkDelete}
          onBulkStatusUpdate={handleBulkStatusUpdate}
        />
      );
    }

    // Admin Views
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
    >
      {renderView()}
    </Layout>
  );
};

export default App;
