
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DispatchEntryView } from './views/DispatchEntry';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { LoginView } from './views/Login';
import { AppView, DispatchEntry, UserRole } from './types';

const LOCAL_STORAGE_KEY = 'dispatch_pro_data';
const AUTH_STORAGE_KEY = 'dispatch_pro_auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin'); // Default role, will be set by login
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // FIX: Lazy initialization to ensure data is loaded synchronously before first render.
  // This prevents the "Save" effect from overwriting existing LocalStorage data with an empty array on mount.
  const [dispatchData, setDispatchData] = useState<DispatchEntry[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : [];
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
          // Only update if data is actually different to avoid loops
          setDispatchData(newData);
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
    // We do NOT clear LOCAL_STORAGE_KEY here, so job data persists.
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
