import { AnalysisInputSnapshot, AnalysisResultSnapshot, CostBreakdown } from '../types';

/**
 * 균등 일련비용 현재가치 계수 (P/A, i, n)
 */
export function presentWorthFactorSeries(i: number, n: number): number {
  if (n <= 0) return 0;
  if (i === 0) {
    return n;
  }
  return (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
}

/**
 * 일시불 현재가치 계수 (P/F, i, n)
 */
export function presentWorthFactorSingle(i: number, n: number): number {
  if (n <= 0) return 1;
  if (i === 0) {
    return 1;
  }
  return Math.pow(1 + i, -n);
}

/**
 * 연간 에너지 비용 계산
 * 공식: 연간 주행거리 / 연비 * 에너지가격
 */
export function calculateAnnualEnergyCost(
  annualDistanceKm: number,
  efficiency: number,
  energyPrice: number
): number {
  if (efficiency <= 0 || annualDistanceKm <= 0 || energyPrice <= 0) {
    return 0;
  }
  return Math.round((annualDistanceKm / efficiency) * energyPrice);
}

/**
 * 경제성 비교 분석 실행 (현재가치 PV법)
 */
export function evaluateFleetReplacement(input: AnalysisInputSnapshot): AnalysisResultSnapshot {
  const n = input.analysis_period_years;
  const rateDecimal = input.discount_rate_pct / 100;

  const paFactor = presentWorthFactorSeries(rateDecimal, n);
  const pfFactor = presentWorthFactorSingle(rateDecimal, n);

  // 1. 기존 차량 유지 대안 계산
  const existingEnergy = calculateAnnualEnergyCost(
    input.annual_distance_km,
    input.existing.efficiency,
    input.existing.energy_price
  );

  const existingAnnualOperatingTotal =
    existingEnergy +
    input.existing.annual_maintenance +
    input.existing.annual_tax +
    input.existing.annual_insurance;

  const existingPvOperating = Math.round(existingAnnualOperatingTotal * paFactor);
  const existingPvSalvage = Math.round(input.existing.expected_salvage_value * pfFactor);
  const existingTotalPv = existingPvOperating - existingPvSalvage;

  const keepBreakdown: CostBreakdown = {
    initial_net_investment: 0,
    annual_energy_cost: existingEnergy,
    annual_maintenance_cost: input.existing.annual_maintenance,
    annual_tax_cost: input.existing.annual_tax,
    annual_insurance_cost: input.existing.annual_insurance,
    annual_operating_total: existingAnnualOperatingTotal,
    pv_operating_costs: existingPvOperating,
    salvage_value: input.existing.expected_salvage_value,
    pv_salvage_value: existingPvSalvage,
    pv_total_cost: existingTotalPv,
  };

  // 2. 신규 차량 교체 대안 계산
  const replacementInitialOutlay =
    input.replacement.purchase_price +
    input.replacement.incidental_cost -
    input.replacement.subsidy -
    input.existing.current_market_value;

  const replacementEnergy = calculateAnnualEnergyCost(
    input.annual_distance_km,
    input.replacement.efficiency,
    input.replacement.energy_price
  );

  const replacementAnnualOperatingTotal =
    replacementEnergy +
    input.replacement.annual_maintenance +
    input.replacement.annual_tax +
    input.replacement.annual_insurance;

  const replacementPvOperating = Math.round(replacementAnnualOperatingTotal * paFactor);
  const replacementPvSalvage = Math.round(input.replacement.expected_salvage_value * pfFactor);
  const replacementTotalPv = replacementInitialOutlay + replacementPvOperating - replacementPvSalvage;

  const replaceBreakdown: CostBreakdown = {
    initial_net_investment: replacementInitialOutlay,
    annual_energy_cost: replacementEnergy,
    annual_maintenance_cost: input.replacement.annual_maintenance,
    annual_tax_cost: input.replacement.annual_tax,
    annual_insurance_cost: input.replacement.annual_insurance,
    annual_operating_total: replacementAnnualOperatingTotal,
    pv_operating_costs: replacementPvOperating,
    salvage_value: input.replacement.expected_salvage_value,
    pv_salvage_value: replacementPvSalvage,
    pv_total_cost: replacementTotalPv,
  };

  // 3. 비교 및 절감액 판정
  const deltaPv = replacementTotalPv - existingTotalPv;
  let recommended: 'keep' | 'replace' | 'indifferent';
  let savings = 0;

  if (deltaPv < 0) {
    recommended = 'replace';
    savings = Math.abs(deltaPv);
  } else if (deltaPv > 0) {
    recommended = 'keep';
    savings = deltaPv;
  } else {
    recommended = 'indifferent';
    savings = 0;
  }

  return {
    keep_breakdown: keepBreakdown,
    replace_breakdown: replaceBreakdown,
    delta_pv: deltaPv,
    recommended_alternative: recommended,
    savings_amount: savings,
  };
}

