
export type DispatchStatus = 'pending' | 'running' | 'completed';

export interface DispatchEntry {
  id: string;
  date: string; // ISO Date string
  partyName: string;
  size: string; // Free text input
  weight: number; // Dispatched weight in kg
  productionWeight: number; // Raw material/Production weight in kg
  pcs: number; // Renamed from meter
  bundle: number;
  status: DispatchStatus;
  timestamp: number;
}

export interface AnalyticsSummary {
  totalWeight: number;
  totalBundles: number;
  topParty: string;
  topSize: string;
}

export enum AppView {
  ENTRY = 'ENTRY',
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
}

export type UserRole = 'admin' | 'user';

export const MOCK_PARTIES = [
  'Acme Construction',
  'BuildRight Inc',
  'Global Steel Co',
  'Urban Developers',
  'Metro Infra',
  'TechStruct Ltd',
  'Prime Materials'
];
