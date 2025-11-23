
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
  isLoaded?: boolean; // Track if item is loaded in vehicle
  timestamp: number;
}

export interface ChallanItem {
  id: string;
  size: string;
  weight: number;
  price: number;
  total: number;
}

export type ChallanType = 'invoice' | 'jobwork' | 'credit_note' | 'debit_note';
export type PaymentType = 'credit' | 'cash';

export interface ChallanEntry {
  id: string;
  challanNo: string;
  date: string;
  partyName: string;
  paymentType: PaymentType;
  challanType: ChallanType;
  items: ChallanItem[];
  grandTotal: number;
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
  CHALLAN = 'CHALLAN',
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