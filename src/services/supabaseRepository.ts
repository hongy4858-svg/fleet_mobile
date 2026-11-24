import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  Vehicle,
  TripLog,
  EnergyLog,
  MaintenanceLog,
  ReplacementCandidate,
  AnalysisRecord,
} from '../types';
import { IFleetRepository, VehicleDeletionCheck } from './repository';
import {
  INITIAL_VEHICLES,
  INITIAL_TRIP_LOGS,
  INITIAL_ENERGY_LOGS,
  INITIAL_MAINTENANCE_LOGS,
  INITIAL_REPLACEMENT_CANDIDATES,
} from '../data/mockData';

export class SupabaseFleetRepository implements IFleetRepository {
  private client: SupabaseClient | null;

  constructor(clientInstance: SupabaseClient | null = supabase) {
    this.client = clientInstance;
  }

  private async getAuthenticatedUserId(): Promise<string> {
    if (!this.client) {
      throw new Error(
        'Supabase 클라이언트가 설정되지 않았습니다. mobile/.env에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.'
      );
    }
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error || !user) {
      throw new Error('클라우드 DB 작업을 위해 먼저 로그인해 주세요.');
    }
    return user.id;
  }

  // --- Vehicles ---
  async getVehicles(): Promise<Vehicle[]> {
    const ownerId = await this.getAuthenticatedUserId();
    const { data, error } = await this.client!
      .from('vehicles')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getVehicles error:', error);
      throw new Error(`차량 목록을 불러오지 못했습니다: ${error.message}`);
    }
    return (data || []).map((row) => ({
      ...row,
      purchase_price: Number(row.purchase_price),
      official_efficiency: Number(row.official_efficiency),
    }));
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const ownerId = await this.getAuthenticatedUserId();
    const { data, error } = await this.client!
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('getVehicleById error:', error);
      throw new Error(`차량 정보를 불러오지 못했습니다: ${error.message}`);
    }
    return data
      ? {
          ...data,
          purchase_price: Number(data.purchase_price),
          official_efficiency: Number(data.official_efficiency),
        }
      : null;
  }

  async createVehicle(
    data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Vehicle> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertPayload = {
      id: newId,
      owner_id: ownerId,
      plate_number: data.plate_number.trim(),
      model_name: data.model_name.trim(),
      fuel_type: data.fuel_type,
      purchase_date: data.purchase_date,
      purchase_price: Number(data.purchase_price),
      official_efficiency: Number(data.official_efficiency),
      memo: data.memo || '',
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await this.client!
      .from('vehicles')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('createVehicle error:', error);
      if (error.code === '23505') {
        throw new Error(`차량번호 "${data.plate_number}"는 이미 등록되어 있습니다.`);
      }
      throw new Error(`차량 등록에 실패했습니다: ${error.message}`);
    }

    return {
      ...inserted,
      purchase_price: Number(inserted.purchase_price),
      official_efficiency: Number(inserted.official_efficiency),
    };
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const ownerId = await this.getAuthenticatedUserId();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.plate_number !== undefined) updatePayload.plate_number = data.plate_number.trim();
    if (data.model_name !== undefined) updatePayload.model_name = data.model_name.trim();
    if (data.fuel_type !== undefined) updatePayload.fuel_type = data.fuel_type;
    if (data.purchase_date !== undefined) updatePayload.purchase_date = data.purchase_date;
    if (data.purchase_price !== undefined) updatePayload.purchase_price = Number(data.purchase_price);
    if (data.official_efficiency !== undefined)
      updatePayload.official_efficiency = Number(data.official_efficiency);
    if (data.memo !== undefined) updatePayload.memo = data.memo;

    const { data: updated, error } = await this.client!
      .from('vehicles')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      console.error('updateVehicle error:', error);
      if (error.code === '23505') {
        throw new Error(`차량번호 "${data.plate_number}"는 이미 등록되어 있습니다.`);
      }
      throw new Error(`차량 정보 수정에 실패했습니다: ${error.message}`);
    }

    return {
      ...updated,
      purchase_price: Number(updated.purchase_price),
      official_efficiency: Number(updated.official_efficiency),
    };
  }

  async checkVehicleDeletion(id: string): Promise<VehicleDeletionCheck> {
    const ownerId = await this.getAuthenticatedUserId();

    const [tripsRes, energyRes, maintRes, analysesRes] = await Promise.all([
      this.client!.from('trip_logs').select('id', { count: 'exact', head: true }).eq('vehicle_id', id).eq('owner_id', ownerId),
      this.client!.from('energy_logs').select('id', { count: 'exact', head: true }).eq('vehicle_id', id).eq('owner_id', ownerId),
      this.client!.from('maintenance_logs').select('id', { count: 'exact', head: true }).eq('vehicle_id', id).eq('owner_id', ownerId),
      this.client!.from('analyses').select('id', { count: 'exact', head: true }).eq('existing_vehicle_id', id).eq('owner_id', ownerId),
    ]);

    const tripCount = tripsRes.count || 0;
    const energyCount = energyRes.count || 0;
    const maintCount = maintRes.count || 0;
    const analysisCount = analysesRes.count || 0;
    const total = tripCount + energyCount + maintCount + analysisCount;

    return {
      canDelete: total === 0,
      tripCount,
      energyCount,
      maintCount,
      analysisCount,
      totalRelatedCount: total,
    };
  }

  async deleteVehicle(id: string, cascade: boolean = false): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const check = await this.checkVehicleDeletion(id);

    if (!check.canDelete && !cascade) {
      throw new Error(
        `연관된 운영 데이터(${check.totalRelatedCount}건)가 존재하여 바로 삭제할 수 없습니다.`
      );
    }

    const { error } = await this.client!
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteVehicle error:', error);
      throw new Error(`차량 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- Trip Logs ---
  async getTripLogs(vehicleId?: string): Promise<TripLog[]> {
    const ownerId = await this.getAuthenticatedUserId();
    let query = this.client!
      .from('trip_logs')
      .select('*')
      .eq('owner_id', ownerId)
      .order('trip_date', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getTripLogs error:', error);
      throw new Error(`운행 기록을 불러오지 못했습니다: ${error.message}`);
    }
    return (data || []).map((r) => ({
      ...r,
      distance_km: Number(r.distance_km),
    }));
  }

  async createTripLog(data: Omit<TripLog, 'id' | 'created_at'>): Promise<TripLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error } = await this.client!
      .from('trip_logs')
      .insert({
        id: newId,
        vehicle_id: data.vehicle_id,
        owner_id: ownerId,
        trip_date: data.trip_date,
        distance_km: Number(data.distance_km),
        memo: data.memo || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createTripLog error:', error);
      throw new Error(`운행 기록 등록에 실패했습니다: ${error.message}`);
    }
    return {
      ...inserted,
      distance_km: Number(inserted.distance_km),
    };
  }

  async updateTripLog(id: string, data: Partial<TripLog>): Promise<TripLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const updatePayload: Record<string, any> = {};

    if (data.vehicle_id !== undefined) updatePayload.vehicle_id = data.vehicle_id;
    if (data.trip_date !== undefined) updatePayload.trip_date = data.trip_date;
    if (data.distance_km !== undefined) updatePayload.distance_km = Number(data.distance_km);
    if (data.memo !== undefined) updatePayload.memo = data.memo;

    const { data: updated, error } = await this.client!
      .from('trip_logs')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      console.error('updateTripLog error:', error);
      throw new Error(`운행 기록 수정에 실패했습니다: ${error.message}`);
    }
    return {
      ...updated,
      distance_km: Number(updated.distance_km),
    };
  }

  async deleteTripLog(id: string): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const { error } = await this.client!
      .from('trip_logs')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteTripLog error:', error);
      throw new Error(`운행 기록 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- Energy Logs ---
  async getEnergyLogs(vehicleId?: string): Promise<EnergyLog[]> {
    const ownerId = await this.getAuthenticatedUserId();
    let query = this.client!
      .from('energy_logs')
      .select('*')
      .eq('owner_id', ownerId)
      .order('log_date', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getEnergyLogs error:', error);
      throw new Error(`주유·충전 기록을 불러오지 못했습니다: ${error.message}`);
    }
    return (data || []).map((r) => ({
      ...r,
      amount: Number(r.amount),
      total_cost: Number(r.total_cost),
      unit_price: Number(r.unit_price),
    }));
  }

  async createEnergyLog(data: Omit<EnergyLog, 'id' | 'created_at'>): Promise<EnergyLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `eng-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error } = await this.client!
      .from('energy_logs')
      .insert({
        id: newId,
        vehicle_id: data.vehicle_id,
        owner_id: ownerId,
        log_date: data.log_date,
        amount: Number(data.amount),
        total_cost: Number(data.total_cost),
        unit_price: Number(data.unit_price),
        memo: data.memo || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createEnergyLog error:', error);
      throw new Error(`주유·충전 기록 등록에 실패했습니다: ${error.message}`);
    }
    return {
      ...inserted,
      amount: Number(inserted.amount),
      total_cost: Number(inserted.total_cost),
      unit_price: Number(inserted.unit_price),
    };
  }

  async updateEnergyLog(id: string, data: Partial<EnergyLog>): Promise<EnergyLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const updatePayload: Record<string, any> = {};

    if (data.vehicle_id !== undefined) updatePayload.vehicle_id = data.vehicle_id;
    if (data.log_date !== undefined) updatePayload.log_date = data.log_date;
    if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
    if (data.total_cost !== undefined) updatePayload.total_cost = Number(data.total_cost);
    if (data.unit_price !== undefined) updatePayload.unit_price = Number(data.unit_price);
    if (data.memo !== undefined) updatePayload.memo = data.memo;

    const { data: updated, error } = await this.client!
      .from('energy_logs')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      console.error('updateEnergyLog error:', error);
      throw new Error(`주유·충전 기록 수정에 실패했습니다: ${error.message}`);
    }
    return {
      ...updated,
      amount: Number(updated.amount),
      total_cost: Number(updated.total_cost),
      unit_price: Number(updated.unit_price),
    };
  }

  async deleteEnergyLog(id: string): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const { error } = await this.client!
      .from('energy_logs')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteEnergyLog error:', error);
      throw new Error(`주유·충전 기록 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- Maintenance Logs ---
  async getMaintenanceLogs(vehicleId?: string): Promise<MaintenanceLog[]> {
    const ownerId = await this.getAuthenticatedUserId();
    let query = this.client!
      .from('maintenance_logs')
      .select('*')
      .eq('owner_id', ownerId)
      .order('maintenance_date', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getMaintenanceLogs error:', error);
      throw new Error(`정비 기록을 불러오지 못했습니다: ${error.message}`);
    }
    return (data || []).map((r) => ({
      ...r,
      cost: Number(r.cost),
    }));
  }

  async createMaintenanceLog(
    data: Omit<MaintenanceLog, 'id' | 'created_at'>
  ): Promise<MaintenanceLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `maint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error } = await this.client!
      .from('maintenance_logs')
      .insert({
        id: newId,
        vehicle_id: data.vehicle_id,
        owner_id: ownerId,
        maintenance_date: data.maintenance_date,
        item_name: data.item_name.trim(),
        cost: Number(data.cost),
        memo: data.memo || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createMaintenanceLog error:', error);
      throw new Error(`정비 기록 등록에 실패했습니다: ${error.message}`);
    }
    return {
      ...inserted,
      cost: Number(inserted.cost),
    };
  }

  async updateMaintenanceLog(
    id: string,
    data: Partial<MaintenanceLog>
  ): Promise<MaintenanceLog> {
    const ownerId = await this.getAuthenticatedUserId();
    const updatePayload: Record<string, any> = {};

    if (data.vehicle_id !== undefined) updatePayload.vehicle_id = data.vehicle_id;
    if (data.maintenance_date !== undefined) updatePayload.maintenance_date = data.maintenance_date;
    if (data.item_name !== undefined) updatePayload.item_name = data.item_name.trim();
    if (data.cost !== undefined) updatePayload.cost = Number(data.cost);
    if (data.memo !== undefined) updatePayload.memo = data.memo;

    const { data: updated, error } = await this.client!
      .from('maintenance_logs')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      console.error('updateMaintenanceLog error:', error);
      throw new Error(`정비 기록 수정에 실패했습니다: ${error.message}`);
    }
    return {
      ...updated,
      cost: Number(updated.cost),
    };
  }

  async deleteMaintenanceLog(id: string): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const { error } = await this.client!
      .from('maintenance_logs')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteMaintenanceLog error:', error);
      throw new Error(`정비 기록 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- Replacement Candidates ---
  async getReplacementCandidates(): Promise<ReplacementCandidate[]> {
    const ownerId = await this.getAuthenticatedUserId();
    const { data, error } = await this.client!
      .from('replacement_candidates')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getReplacementCandidates error:', error);
      throw new Error(`교체 후보 차량 목록을 불러오지 못했습니다: ${error.message}`);
    }
    return (data || []).map((r) => ({
      ...r,
      purchase_price: Number(r.purchase_price),
      subsidy: Number(r.subsidy),
      incidental_cost: Number(r.incidental_cost),
      efficiency: Number(r.efficiency),
      energy_price: Number(r.energy_price),
      annual_maintenance: Number(r.annual_maintenance),
      annual_tax: Number(r.annual_tax),
      annual_insurance: Number(r.annual_insurance),
      expected_salvage: Number(r.expected_salvage),
    }));
  }

  async createReplacementCandidate(
    data: Omit<ReplacementCandidate, 'id' | 'created_at'>
  ): Promise<ReplacementCandidate> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error } = await this.client!
      .from('replacement_candidates')
      .insert({
        id: newId,
        owner_id: ownerId,
        name: data.name.trim(),
        fuel_type: data.fuel_type,
        purchase_price: Number(data.purchase_price),
        subsidy: Number(data.subsidy || 0),
        incidental_cost: Number(data.incidental_cost || 0),
        efficiency: Number(data.efficiency),
        energy_price: Number(data.energy_price),
        annual_maintenance: Number(data.annual_maintenance || 0),
        annual_tax: Number(data.annual_tax || 0),
        annual_insurance: Number(data.annual_insurance || 0),
        expected_salvage: Number(data.expected_salvage || 0),
        memo: data.memo || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('createReplacementCandidate error:', error);
      throw new Error(`교체 후보 차량 등록에 실패했습니다: ${error.message}`);
    }
    return {
      ...inserted,
      purchase_price: Number(inserted.purchase_price),
      subsidy: Number(inserted.subsidy),
      incidental_cost: Number(inserted.incidental_cost),
      efficiency: Number(inserted.efficiency),
      energy_price: Number(inserted.energy_price),
      annual_maintenance: Number(inserted.annual_maintenance),
      annual_tax: Number(inserted.annual_tax),
      annual_insurance: Number(inserted.annual_insurance),
      expected_salvage: Number(inserted.expected_salvage),
    };
  }

  async updateReplacementCandidate(
    id: string,
    data: Partial<ReplacementCandidate>
  ): Promise<ReplacementCandidate> {
    const ownerId = await this.getAuthenticatedUserId();
    const updatePayload: Record<string, any> = {};

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.fuel_type !== undefined) updatePayload.fuel_type = data.fuel_type;
    if (data.purchase_price !== undefined) updatePayload.purchase_price = Number(data.purchase_price);
    if (data.subsidy !== undefined) updatePayload.subsidy = Number(data.subsidy);
    if (data.incidental_cost !== undefined) updatePayload.incidental_cost = Number(data.incidental_cost);
    if (data.efficiency !== undefined) updatePayload.efficiency = Number(data.efficiency);
    if (data.energy_price !== undefined) updatePayload.energy_price = Number(data.energy_price);
    if (data.annual_maintenance !== undefined)
      updatePayload.annual_maintenance = Number(data.annual_maintenance);
    if (data.annual_tax !== undefined) updatePayload.annual_tax = Number(data.annual_tax);
    if (data.annual_insurance !== undefined)
      updatePayload.annual_insurance = Number(data.annual_insurance);
    if (data.expected_salvage !== undefined)
      updatePayload.expected_salvage = Number(data.expected_salvage);
    if (data.memo !== undefined) updatePayload.memo = data.memo;

    const { data: updated, error } = await this.client!
      .from('replacement_candidates')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      console.error('updateReplacementCandidate error:', error);
      throw new Error(`교체 후보 차량 수정에 실패했습니다: ${error.message}`);
    }
    return {
      ...updated,
      purchase_price: Number(updated.purchase_price),
      subsidy: Number(updated.subsidy),
      incidental_cost: Number(updated.incidental_cost),
      efficiency: Number(updated.efficiency),
      energy_price: Number(updated.energy_price),
      annual_maintenance: Number(updated.annual_maintenance),
      annual_tax: Number(updated.annual_tax),
      annual_insurance: Number(updated.annual_insurance),
      expected_salvage: Number(updated.expected_salvage),
    };
  }

  async deleteReplacementCandidate(id: string): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const { error } = await this.client!
      .from('replacement_candidates')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteReplacementCandidate error:', error);
      throw new Error(`교체 후보 차량 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- Analyses ---
  async getAnalyses(): Promise<AnalysisRecord[]> {
    const ownerId = await this.getAuthenticatedUserId();
    const { data, error } = await this.client!
      .from('analyses')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAnalyses error:', error);
      throw new Error(`분석 이력을 불러오지 못했습니다: ${error.message}`);
    }
    return data || [];
  }

  async getAnalysisById(id: string): Promise<AnalysisRecord | null> {
    const ownerId = await this.getAuthenticatedUserId();
    const { data, error } = await this.client!
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('getAnalysisById error:', error);
      throw new Error(`분석 상세 내역을 불러오지 못했습니다: ${error.message}`);
    }
    return data || null;
  }

  async saveAnalysis(
    data: Omit<AnalysisRecord, 'id' | 'created_at'>
  ): Promise<AnalysisRecord> {
    const ownerId = await this.getAuthenticatedUserId();
    const newId = `ana-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const clonedInput = JSON.parse(JSON.stringify(data.input_snapshot));
    const clonedResult = JSON.parse(JSON.stringify(data.result_snapshot));

    const insertPayload = {
      id: newId,
      owner_id: ownerId,
      title: data.title.trim(),
      created_at: now,
      existing_vehicle_id: data.existing_vehicle_id || null,
      replacement_candidate_id: data.replacement_candidate_id || null,
      input_snapshot: clonedInput,
      result_snapshot: clonedResult,
    };

    const { data: inserted, error } = await this.client!
      .from('analyses')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('saveAnalysis error:', error);
      throw new Error(`분석 이력 저장에 실패했습니다: ${error.message}`);
    }
    return inserted;
  }

  async deleteAnalysis(id: string): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();
    const { error } = await this.client!
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('deleteAnalysis error:', error);
      throw new Error(`분석 이력 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // --- 시연 데이터 중복 없이 사용자 계정에 주입 ---
  async seedDemoDataForUser(): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();

    // 1. 현재 사용자 차량 확인
    const { data: existingVehicles, error: vErr } = await this.client!
      .from('vehicles')
      .select('id, plate_number')
      .eq('owner_id', ownerId);

    if (vErr) throw new Error(`시연 데이터 주입 전 검사 실패: ${vErr.message}`);

    // 2. 미등록된 차량만 주입
    const vehIdMap = new Map<string, string>();
    for (const v of INITIAL_VEHICLES) {
      const normalized = v.plate_number.replace(/\s+/g, '');
      const existing = (existingVehicles || []).find((ev) => ev.plate_number.replace(/\s+/g, '') === normalized);
      if (existing) {
        vehIdMap.set(v.id, existing.id);
        continue;
      }

      const newId = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const { error: insErr } = await this.client!.from('vehicles').insert({
        id: newId,
        owner_id: ownerId,
        plate_number: v.plate_number,
        model_name: v.model_name,
        fuel_type: v.fuel_type,
        purchase_date: v.purchase_date,
        purchase_price: v.purchase_price,
        official_efficiency: v.official_efficiency,
        memo: v.memo || '',
        created_at: v.created_at,
        updated_at: v.updated_at,
      });
      if (insErr) {
        console.error('Seed vehicle error:', insErr);
        continue;
      }
      vehIdMap.set(v.id, newId);
    }

    // 3. 운행 기록 주입
    const { data: existingTrips } = await this.client!
      .from('trip_logs')
      .select('id, trip_date, vehicle_id')
      .eq('owner_id', ownerId);
    const existingTripKeys = new Set((existingTrips || []).map((t) => `${t.vehicle_id}_${t.trip_date}`));

    for (const t of INITIAL_TRIP_LOGS) {
      const targetVehId = vehIdMap.get(t.vehicle_id);
      if (!targetVehId) continue;
      const key = `${targetVehId}_${t.trip_date}`;
      if (existingTripKeys.has(key)) continue;

      await this.client!.from('trip_logs').insert({
        id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        vehicle_id: targetVehId,
        owner_id: ownerId,
        trip_date: t.trip_date,
        distance_km: t.distance_km,
        memo: t.memo || '',
        created_at: t.created_at,
      });
    }

    // 4. 주유·충전 기록 주입
    const { data: existingEnergy } = await this.client!
      .from('energy_logs')
      .select('id, log_date, vehicle_id')
      .eq('owner_id', ownerId);
    const existingEnergyKeys = new Set((existingEnergy || []).map((e) => `${e.vehicle_id}_${e.log_date}`));

    for (const e of INITIAL_ENERGY_LOGS) {
      const targetVehId = vehIdMap.get(e.vehicle_id);
      if (!targetVehId) continue;
      const key = `${targetVehId}_${e.log_date}`;
      if (existingEnergyKeys.has(key)) continue;

      await this.client!.from('energy_logs').insert({
        id: `eng-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        vehicle_id: targetVehId,
        owner_id: ownerId,
        log_date: e.log_date,
        amount: e.amount,
        total_cost: e.total_cost,
        unit_price: e.unit_price,
        memo: e.memo || '',
        created_at: e.created_at,
      });
    }

    // 5. 정비 기록 주입
    const { data: existingMaint } = await this.client!
      .from('maintenance_logs')
      .select('id, maintenance_date, vehicle_id')
      .eq('owner_id', ownerId);
    const existingMaintKeys = new Set((existingMaint || []).map((m) => `${m.vehicle_id}_${m.maintenance_date}`));

    for (const m of INITIAL_MAINTENANCE_LOGS) {
      const targetVehId = vehIdMap.get(m.vehicle_id);
      if (!targetVehId) continue;
      const key = `${targetVehId}_${m.maintenance_date}`;
      if (existingMaintKeys.has(key)) continue;

      await this.client!.from('maintenance_logs').insert({
        id: `maint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        vehicle_id: targetVehId,
        owner_id: ownerId,
        maintenance_date: m.maintenance_date,
        item_name: m.item_name,
        cost: m.cost,
        memo: m.memo || '',
        created_at: m.created_at,
      });
    }

    // 6. 교체 후보 주입
    const { data: existingCand } = await this.client!
      .from('replacement_candidates')
      .select('name')
      .eq('owner_id', ownerId);
    const existingCandNames = new Set((existingCand || []).map((c) => c.name));

    for (const c of INITIAL_REPLACEMENT_CANDIDATES) {
      if (existingCandNames.has(c.name)) continue;
      await this.client!.from('replacement_candidates').insert({
        id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        owner_id: ownerId,
        name: c.name,
        fuel_type: c.fuel_type,
        purchase_price: c.purchase_price,
        subsidy: c.subsidy,
        incidental_cost: c.incidental_cost,
        efficiency: c.efficiency,
        energy_price: c.energy_price,
        annual_maintenance: c.annual_maintenance,
        annual_tax: c.annual_tax,
        annual_insurance: c.annual_insurance,
        expected_salvage: c.expected_salvage,
        memo: c.memo || '',
        created_at: c.created_at,
      });
    }
  }

  // --- 현재 로그인한 사용자의 클라우드 데이터만 초기화 ---
  async resetToDemoData(): Promise<void> {
    const ownerId = await this.getAuthenticatedUserId();

    // 1. 기존 데이터 삭제 (해당 사용자의 데이터만)
    await this.client!.from('analyses').delete().eq('owner_id', ownerId);
    await this.client!.from('replacement_candidates').delete().eq('owner_id', ownerId);
    await this.client!.from('vehicles').delete().eq('owner_id', ownerId);

    // 2. 깨끗한 시연 데이터 재생성
    await this.seedDemoDataForUser();
  }
}

export const supabaseFleetRepository = new SupabaseFleetRepository();

