import { EnergyLog, FuelType, MaintenanceLog, TripLog, Vehicle } from '../types';

export interface VehiclePeriodSummary {
  vehicle_id: string;
  plate_number: string;
  model_name: string;
  fuel_type: FuelType;
  total_distance_km: number;
  total_energy_cost: number;
  total_maintenance_cost: number;
  total_operating_cost: number;
  cost_per_km: number | null; // 주행거리 0이면 null
}

export interface FleetPeriodMetrics {
  total_vehicles: number;
  total_distance_km: number;
  total_energy_cost: number;
  total_maintenance_cost: number;
  total_operating_cost: number;
  average_cost_per_km: number | null;
  vehicle_summaries: VehiclePeriodSummary[];
}

export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (startDate && dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

export function calculateFleetMetrics(
  vehicles: Vehicle[],
  tripLogs: TripLog[],
  energyLogs: EnergyLog[],
  maintenanceLogs: MaintenanceLog[],
  startDate?: string,
  endDate?: string
): FleetPeriodMetrics {
  const filteredTrips = tripLogs.filter((t) => isDateInRange(t.trip_date, startDate, endDate));
  const filteredEnergy = energyLogs.filter((e) => isDateInRange(e.log_date, startDate, endDate));
  const filteredMaintenance = maintenanceLogs.filter((m) =>
    isDateInRange(m.maintenance_date, startDate, endDate)
  );

  let grandTotalDistance = 0;
  let grandTotalEnergyCost = 0;
  let grandTotalMaintenanceCost = 0;

  const summaries: VehiclePeriodSummary[] = vehicles.map((v) => {
    const vTrips = filteredTrips.filter((t) => t.vehicle_id === v.id);
    const vEnergy = filteredEnergy.filter((e) => e.vehicle_id === v.id);
    const vMaint = filteredMaintenance.filter((m) => m.vehicle_id === v.id);

    const dist = vTrips.reduce((sum, t) => sum + t.distance_km, 0);
    const energyCost = vEnergy.reduce((sum, e) => sum + e.total_cost, 0);
    const maintCost = vMaint.reduce((sum, m) => sum + m.cost, 0);
    const opCost = energyCost + maintCost;
    const costPerKm = dist > 0 ? Math.round(opCost / dist) : null;

    grandTotalDistance += dist;
    grandTotalEnergyCost += energyCost;
    grandTotalMaintenanceCost += maintCost;

    return {
      vehicle_id: v.id,
      plate_number: v.plate_number,
      model_name: v.model_name,
      fuel_type: v.fuel_type,
      total_distance_km: dist,
      total_energy_cost: energyCost,
      total_maintenance_cost: maintCost,
      total_operating_cost: opCost,
      cost_per_km: costPerKm,
    };
  });

  const grandTotalOpCost = grandTotalEnergyCost + grandTotalMaintenanceCost;
  const avgCostPerKm = grandTotalDistance > 0 ? Math.round(grandTotalOpCost / grandTotalDistance) : null;

  return {
    total_vehicles: vehicles.length,
    total_distance_km: grandTotalDistance,
    total_energy_cost: grandTotalEnergyCost,
    total_maintenance_cost: grandTotalMaintenanceCost,
    total_operating_cost: grandTotalOpCost,
    average_cost_per_km: avgCostPerKm,
    vehicle_summaries: summaries,
  };
}

export function getVehicleHistoricalEstimates(
  vehicle: Vehicle,
  tripLogs: TripLog[],
  energyLogs: EnergyLog[],
  maintenanceLogs: MaintenanceLog[]
) {
  const vTrips = tripLogs.filter((t) => t.vehicle_id === vehicle.id);
  const vEnergy = energyLogs.filter((e) => e.vehicle_id === vehicle.id);
  const vMaint = maintenanceLogs.filter((m) => m.vehicle_id === vehicle.id);

  const totalDist = vTrips.reduce((sum, t) => sum + t.distance_km, 0);
  const totalAmount = vEnergy.reduce((sum, e) => sum + e.amount, 0);
  const totalMaintCost = vMaint.reduce((sum, m) => sum + m.cost, 0);

  let estimatedEfficiency = vehicle.official_efficiency;
  if (totalDist > 0 && totalAmount > 0) {
    estimatedEfficiency = Number((totalDist / totalAmount).toFixed(1));
  }

  let estimatedEnergyPrice = 1700;
  if (vEnergy.length > 0) {
    const sorted = [...vEnergy].sort((a, b) => b.log_date.localeCompare(a.log_date));
    estimatedEnergyPrice = sorted[0].unit_price;
  } else {
    if (vehicle.fuel_type === 'diesel') estimatedEnergyPrice = 1550;
    else if (vehicle.fuel_type === 'electric') estimatedEnergyPrice = 340;
    else if (vehicle.fuel_type === 'hydrogen') estimatedEnergyPrice = 9000;
    else if (vehicle.fuel_type === 'hybrid') estimatedEnergyPrice = 1700;
  }

  const annualMaint = totalMaintCost > 0 ? totalMaintCost : 800000;

  return {
    referenceEfficiency: estimatedEfficiency,
    referenceEnergyPrice: estimatedEnergyPrice,
    referenceAnnualMaintenance: annualMaint,
    totalTripCount: vTrips.length,
    totalLoggedDistance: totalDist,
  };
}

