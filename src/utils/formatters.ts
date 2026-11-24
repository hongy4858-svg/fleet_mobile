import { FuelType } from '../types';

/**
 * 금액(원) 포맷 (천 단위 콤마)
 */
export function formatCurrency(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

/**
 * 거리(km) 포맷
 */
export function formatDistance(distance: number): string {
  return `${distance.toLocaleString('ko-KR')} km`;
}

/**
 * 연료 종류 한글 라벨
 */
export function getFuelTypeLabel(fuelType: FuelType): string {
  switch (fuelType) {
    case 'gasoline':
      return '가솔린';
    case 'diesel':
      return '디젤';
    case 'hybrid':
      return '하이브리드';
    case 'electric':
      return '전기(EV)';
    case 'hydrogen':
      return '수소(FCEV)';
    default:
      return fuelType;
  }
}

/**
 * 연료 종류별 주입량 단위 (L, kWh, kg)
 */
export function getFuelUnit(fuelType: FuelType): string {
  switch (fuelType) {
    case 'gasoline':
    case 'diesel':
    case 'hybrid':
      return 'L';
    case 'electric':
      return 'kWh';
    case 'hydrogen':
      return 'kg';
    default:
      return '단위';
  }
}

/**
 * 연료 종류별 연비 단위 (km/L, km/kWh, km/kg)
 */
export function getEfficiencyUnit(fuelType: FuelType): string {
  return `km/${getFuelUnit(fuelType)}`;
}

/**
 * 연료 종류별 단가 단위 (원/L, 원/kWh, 원/kg)
 */
export function getEnergyPriceUnit(fuelType: FuelType): string {
  return `원/${getFuelUnit(fuelType)}`;
}

