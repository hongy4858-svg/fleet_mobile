export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'hydrogen';

export interface Vehicle {
  id: string;
  owner_id: string;
  plate_number: string;
  model_name: string;
  fuel_type: FuelType;
  purchase_date: string; // YYYY-MM-DD
  purchase_price: number; // KRW
  official_efficiency: number; // km/L, km/kWh, km/kg
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface TripLog {
  id: string;
  vehicle_id: string;
  owner_id: string;
  trip_date: string; // YYYY-MM-DD
  distance_km: number;
  memo?: string;
  created_at: string;
}

export interface EnergyLog {
  id: string;
  vehicle_id: string;
  owner_id: string;
  log_date: string; // YYYY-MM-DD
  amount: number; // L, kWh, kg
  total_cost: number; // KRW
  unit_price: number; // KRW / unit
  memo?: string;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  owner_id: string;
  maintenance_date: string; // YYYY-MM-DD
  item_name: string;
  cost: number; // KRW
  memo?: string;
  created_at: string;
}

export interface ReplacementCandidate {
  id: string;
  owner_id: string;
  name: string;
  fuel_type: FuelType;
  purchase_price: number; // KRW
  subsidy: number; // KRW
  incidental_cost: number; // KRW (취득세 등)
  efficiency: number; // km/unit
  energy_price: number; // KRW/unit
  annual_maintenance: number; // KRW/yr
  annual_tax: number; // KRW/yr
  annual_insurance: number; // KRW/yr
  expected_salvage: number; // KRW
  memo?: string;
  created_at: string;
}

export interface CostBreakdown {
  initial_net_investment: number;
  annual_energy_cost: number;
  annual_maintenance_cost: number;
  annual_tax_cost: number;
  annual_insurance_cost: number;
  annual_operating_total: number;
  pv_operating_costs: number;
  salvage_value: number;
  pv_salvage_value: number;
  pv_total_cost: number;
}

export interface AnalysisInputSnapshot {
  analysis_name: string;
  analysis_period_years: number; // N
  annual_distance_km: number;
  discount_rate_pct: number; // i (%)

  existing: {
    vehicle_id: string;
    model_name: string;
    plate_number: string;
    fuel_type: FuelType;
    current_market_value: number; // S_0
    efficiency: number;
    energy_price: number;
    annual_maintenance: number;
    annual_tax: number;
    annual_insurance: number;
    expected_salvage_value: number;
  };

  replacement: {
    candidate_id?: string;
    model_name: string;
    fuel_type: FuelType;
    purchase_price: number;
    incidental_cost: number;
    subsidy: number;
    efficiency: number;
    energy_price: number;
    annual_maintenance: number;
    annual_tax: number;
    annual_insurance: number;
    expected_salvage_value: number;
  };
}

export interface AnalysisResultSnapshot {
  keep_breakdown: CostBreakdown;
  replace_breakdown: CostBreakdown;
  delta_pv: number; // PV_replace - PV_keep
  recommended_alternative: 'keep' | 'replace' | 'indifferent';
  savings_amount: number;
}

export interface AnalysisRecord {
  id: string;
  owner_id: string;
  title: string;
  created_at: string;
  existing_vehicle_id: string;
  replacement_candidate_id?: string;
  input_snapshot: AnalysisInputSnapshot;
  result_snapshot: AnalysisResultSnapshot;
}

