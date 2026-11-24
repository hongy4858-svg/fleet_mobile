import {
  Vehicle,
  TripLog,
  EnergyLog,
  MaintenanceLog,
  ReplacementCandidate,
  AnalysisRecord,
} from '../types';

export interface VehicleDeletionCheck {
  canDelete: boolean;
  tripCount: number;
  energyCount: number;
  maintCount: number;
  analysisCount: number;
  totalRelatedCount: number;
}

export interface IFleetRepository {
  // 차량 관리
  getVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | null>;
  createVehicle(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
  checkVehicleDeletion(id: string): Promise<VehicleDeletionCheck>;
  deleteVehicle(id: string, cascade?: boolean): Promise<void>;

  // 운행 기록
  getTripLogs(vehicleId?: string): Promise<TripLog[]>;
  createTripLog(data: Omit<TripLog, 'id' | 'created_at'>): Promise<TripLog>;
  updateTripLog(id: string, data: Partial<TripLog>): Promise<TripLog>;
  deleteTripLog(id: string): Promise<void>;

  // 주유·충전 기록
  getEnergyLogs(vehicleId?: string): Promise<EnergyLog[]>;
  createEnergyLog(data: Omit<EnergyLog, 'id' | 'created_at'>): Promise<EnergyLog>;
  updateEnergyLog(id: string, data: Partial<EnergyLog>): Promise<EnergyLog>;
  deleteEnergyLog(id: string): Promise<void>;

  // 정비 기록
  getMaintenanceLogs(vehicleId?: string): Promise<MaintenanceLog[]>;
  createMaintenanceLog(data: Omit<MaintenanceLog, 'id' | 'created_at'>): Promise<MaintenanceLog>;
  updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>): Promise<MaintenanceLog>;
  deleteMaintenanceLog(id: string): Promise<void>;

  // 교체 후보 차량
  getReplacementCandidates(): Promise<ReplacementCandidate[]>;
  createReplacementCandidate(
    data: Omit<ReplacementCandidate, 'id' | 'created_at'>
  ): Promise<ReplacementCandidate>;
  updateReplacementCandidate(
    id: string,
    data: Partial<ReplacementCandidate>
  ): Promise<ReplacementCandidate>;
  deleteReplacementCandidate(id: string): Promise<void>;

  // 분석 이력
  getAnalyses(): Promise<AnalysisRecord[]>;
  getAnalysisById(id: string): Promise<AnalysisRecord | null>;
  saveAnalysis(data: Omit<AnalysisRecord, 'id' | 'created_at'>): Promise<AnalysisRecord>;
  deleteAnalysis(id: string): Promise<void>;

  // 데모 초기화 및 시연 데이터 생성
  seedDemoDataForUser?(): Promise<void>;
  resetToDemoData(): Promise<void>;
}

export { supabaseFleetRepository } from './supabaseRepository';

