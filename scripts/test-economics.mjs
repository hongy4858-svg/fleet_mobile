// 모바일 경제성공학 손계산 사례 자동 검증 스크립트

function presentWorthFactorSeries(i, n) {
  if (n <= 0) return 0;
  if (i === 0) return n;
  return (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
}

function presentWorthFactorSingle(i, n) {
  if (n <= 0) return 1;
  if (i === 0) return 1;
  return Math.pow(1 + i, -n);
}

function calculateAnnualEnergyCost(annualDistanceKm, efficiency, energyPrice) {
  if (efficiency <= 0 || annualDistanceKm <= 0 || energyPrice <= 0) return 0;
  return Math.round((annualDistanceKm / efficiency) * energyPrice);
}

function evaluateFleetReplacement(input) {
  const n = input.analysis_period_years;
  const rateDecimal = input.discount_rate_pct / 100;

  const paFactor = presentWorthFactorSeries(rateDecimal, n);
  const pfFactor = presentWorthFactorSingle(rateDecimal, n);

  // 1. 기존 차량 유지 대안
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

  const pvExistingOperating = Math.round(existingAnnualOperatingTotal * paFactor);
  const pvExistingSalvage = Math.round(input.existing.expected_salvage_value * pfFactor);
  const pvTotalKeep = pvExistingOperating - pvExistingSalvage;

  const keepBreakdown = {
    initial_net_investment: 0,
    annual_energy_cost: existingEnergy,
    annual_maintenance_cost: input.existing.annual_maintenance,
    annual_tax_cost: input.existing.annual_tax,
    annual_insurance_cost: input.existing.annual_insurance,
    annual_operating_total: existingAnnualOperatingTotal,
    pv_operating_costs: pvExistingOperating,
    salvage_value: input.existing.expected_salvage_value,
    pv_salvage_value: pvExistingSalvage,
    pv_total_cost: pvTotalKeep,
  };

  // 2. 신차 교체 대안
  const initialNet =
    input.replacement.purchase_price +
    input.replacement.incidental_cost -
    input.replacement.subsidy -
    input.existing.current_market_value;

  const replaceEnergy = calculateAnnualEnergyCost(
    input.annual_distance_km,
    input.replacement.efficiency,
    input.replacement.energy_price
  );

  const replaceAnnualOperatingTotal =
    replaceEnergy +
    input.replacement.annual_maintenance +
    input.replacement.annual_tax +
    input.replacement.annual_insurance;

  const pvReplaceOperating = Math.round(replaceAnnualOperatingTotal * paFactor);
  const pvReplaceSalvage = Math.round(input.replacement.expected_salvage_value * pfFactor);
  const pvTotalReplace = initialNet + pvReplaceOperating - pvReplaceSalvage;

  const replaceBreakdown = {
    initial_net_investment: initialNet,
    annual_energy_cost: replaceEnergy,
    annual_maintenance_cost: input.replacement.annual_maintenance,
    annual_tax_cost: input.replacement.annual_tax,
    annual_insurance_cost: input.replacement.annual_insurance,
    annual_operating_total: replaceAnnualOperatingTotal,
    pv_operating_costs: pvReplaceOperating,
    salvage_value: input.replacement.expected_salvage_value,
    pv_salvage_value: pvReplaceSalvage,
    pv_total_cost: pvTotalReplace,
  };

  const deltaPv = pvTotalReplace - pvTotalKeep;
  let recommendedAlternative = 'indifferent';
  if (deltaPv < 0) recommendedAlternative = 'replace';
  else if (deltaPv > 0) recommendedAlternative = 'keep';

  const savingsAmount = Math.abs(deltaPv);

  return {
    keep_breakdown: keepBreakdown,
    replace_breakdown: replaceBreakdown,
    delta_pv: deltaPv,
    recommended_alternative: recommendedAlternative,
    savings_amount: savingsAmount,
  };
}

console.log('=== [1] 모바일 현가계수 공식 검증 ===');
if (presentWorthFactorSeries(0, 5) !== 5) throw new Error('P/A (i=0) 실패');
if (presentWorthFactorSingle(0, 5) !== 1) throw new Error('P/F (i=0) 실패');
const pa1 = presentWorthFactorSeries(0.1, 1);
const pf1 = presentWorthFactorSingle(0.1, 1);
if (Math.abs(pa1 - 1 / 1.1) >= 1e-6) throw new Error('P/A (10%, 1) 실패');
if (Math.abs(pf1 - 1 / 1.1) >= 1e-6) throw new Error('P/F (10%, 1) 실패');
console.log('OK: 계수 공식 검증 통과');

console.log('\n=== [2] 손계산 사례 1 (할인율 0%) 검증 ===');
const case1 = {
  analysis_name: '사례 1 (i=0%)',
  analysis_period_years: 2,
  annual_distance_km: 10000,
  discount_rate_pct: 0,
  existing: {
    vehicle_id: 'test-v1',
    model_name: '기존 테스트차',
    plate_number: '11가 1111',
    fuel_type: 'gasoline',
    current_market_value: 10000000,
    efficiency: 10,
    energy_price: 2000,
    annual_maintenance: 500000,
    annual_tax: 300000,
    annual_insurance: 700000,
    expected_salvage_value: 5000000,
  },
  replacement: {
    model_name: '신규 전기차',
    fuel_type: 'electric',
    purchase_price: 30000000,
    incidental_cost: 1000000,
    subsidy: 5000000,
    efficiency: 5,
    energy_price: 300,
    annual_maintenance: 200000,
    annual_tax: 100000,
    annual_insurance: 800000,
    expected_salvage_value: 15000000,
  },
};

const res1 = evaluateFleetReplacement(case1);
console.log('사례 1 결과:');
console.log('- 유지 대안 PV:', res1.keep_breakdown.pv_total_cost, '(손계산 일치: 2,000,000)');
console.log('- 교체 대안 PV:', res1.replace_breakdown.pv_total_cost, '(손계산 일치: 4,400,000)');
console.log('- Delta PV:', res1.delta_pv, '(손계산 일치: 2,400,000)');
console.log('- 추천 대안:', res1.recommended_alternative, '(손계산 일치: keep)');

if (res1.keep_breakdown.pv_total_cost !== 2000000) throw new Error('사례 1 유지 PV 불일치');
if (res1.replace_breakdown.pv_total_cost !== 4400000) throw new Error('사례 1 교체 PV 불일치');
if (res1.delta_pv !== 2400000) throw new Error('사례 1 Delta PV 불일치');
if (res1.recommended_alternative !== 'keep') throw new Error('사례 1 추천 대안 불일치');

console.log('\n=== [3] 손계산 사례 2 (할인율 10%) 검증 ===');
const case2 = {
  analysis_name: '사례 2 (i=10%, 1년)',
  analysis_period_years: 1,
  annual_distance_km: 10000,
  discount_rate_pct: 10,
  existing: {
    vehicle_id: 'test-v2',
    model_name: '기존 테스트차 2',
    plate_number: '22나 2222',
    fuel_type: 'gasoline',
    current_market_value: 0,
    efficiency: 10,
    energy_price: 1100,
    annual_maintenance: 0,
    annual_tax: 0,
    annual_insurance: 0,
    expected_salvage_value: 0,
  },
  replacement: {
    model_name: '신규 차 2',
    fuel_type: 'gasoline',
    purchase_price: 500000,
    incidental_cost: 0,
    subsidy: 0,
    efficiency: 10,
    energy_price: 220,
    annual_maintenance: 0,
    annual_tax: 0,
    annual_insurance: 0,
    expected_salvage_value: 0,
  },
};

const res2 = evaluateFleetReplacement(case2);
console.log('사례 2 결과:');
console.log('- 유지 대안 PV:', res2.keep_breakdown.pv_total_cost, '(손계산 일치: 1,000,000)');
console.log('- 교체 대안 PV:', res2.replace_breakdown.pv_total_cost, '(손계산 일치: 700,000)');
console.log('- Delta PV:', res2.delta_pv, '(손계산 일치: -300,000)');
console.log('- 추천 대안:', res2.recommended_alternative, '(손계산 일치: replace)');

if (res2.keep_breakdown.pv_total_cost !== 1000000) throw new Error('사례 2 유지 PV 불일치');
if (res2.replace_breakdown.pv_total_cost !== 700000) throw new Error('사례 2 교체 PV 불일치');
if (res2.delta_pv !== -300000) throw new Error('사례 2 Delta PV 불일치');
if (res2.recommended_alternative !== 'replace') throw new Error('사례 2 추천 대안 불일치');

console.log('\n>>> 모든 모바일 경제성공학 손계산 사례 100% 검증 완료 <<<');

