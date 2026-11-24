import {
  Vehicle,
  TripLog,
  EnergyLog,
  MaintenanceLog,
  ReplacementCandidate,
} from '../types';

export const DEMO_OWNER_ID = 'demo-user-001';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001',
    owner_id: DEMO_OWNER_ID,
    plate_number: '12가 3456',
    model_name: '그랜저 2.5 가솔린 (노후 업무용 세단)',
    fuel_type: 'gasoline',
    purchase_date: '2019-04-15',
    purchase_price: 36000000,
    official_efficiency: 11.2, // km/L
    memo: '[과제 시연 가상] 임원/영업 공용 차량, 누적 11만km 주행, 교체 검토 대상',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
  },
  {
    id: 'veh-002',
    owner_id: DEMO_OWNER_ID,
    plate_number: '34나 7890',
    model_name: '카니발 2.2 디젤 (다목적 업무용 밴)',
    fuel_type: 'diesel',
    purchase_date: '2020-08-20',
    purchase_price: 41500000,
    official_efficiency: 12.5, // km/L
    memo: '[과제 시연 가상] 외근 출장 및 장비 운송용',
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
  },
  {
    id: 'veh-003',
    owner_id: DEMO_OWNER_ID,
    plate_number: '56다 1234',
    model_name: '쏘나타 하이브리드 2.0 (영업용 세단)',
    fuel_type: 'hybrid',
    purchase_date: '2021-03-10',
    purchase_price: 33800000,
    official_efficiency: 19.8, // km/L
    memo: '[과제 시연 가상] 수도권 순환 영업용',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-12T11:00:00Z',
  },
  {
    id: 'veh-004',
    owner_id: DEMO_OWNER_ID,
    plate_number: '78라 5678',
    model_name: '아이오닉 6 Long Range (전기 업무차)',
    fuel_type: 'electric',
    purchase_date: '2023-05-18',
    purchase_price: 54500000,
    official_efficiency: 6.2, // km/kWh
    memo: '[과제 시연 가상] ESG 친환경 시범 도입 차량',
    created_at: '2024-01-13T12:00:00Z',
    updated_at: '2024-01-13T12:00:00Z',
  },
  {
    id: 'veh-005',
    owner_id: DEMO_OWNER_ID,
    plate_number: '90마 9012',
    model_name: '넥쏘 수소전기차 (FCEV 관용차)',
    fuel_type: 'hydrogen',
    purchase_date: '2022-11-05',
    purchase_price: 72000000,
    official_efficiency: 96.0, // km/kg
    memo: '[과제 시연 가상] 지자체 보조금 연계 실증 운영 차량',
    created_at: '2024-01-14T13:00:00Z',
    updated_at: '2024-01-14T13:00:00Z',
  },
];

export const INITIAL_TRIP_LOGS: TripLog[] = [
  // 그랜저 2.5
  { id: 'trip-001', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-05', distance_km: 180, memo: '판교 본사-화성 연구소 왕복', created_at: '2024-08-05T18:00:00Z' },
  { id: 'trip-002', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-19', distance_km: 320, memo: '대전 테크노밸리 고객사 실사', created_at: '2024-08-19T19:00:00Z' },
  { id: 'trip-003', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, trip_date: '2024-09-10', distance_km: 240, memo: '인천 송도 비즈니스 미팅', created_at: '2024-09-10T18:30:00Z' },
  { id: 'trip-004', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, trip_date: '2024-10-15', distance_km: 410, memo: '광주 지사 순회 점검', created_at: '2024-10-15T21:00:00Z' },
  { id: 'trip-005', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, trip_date: '2024-11-02', distance_km: 150, memo: '서울 시내 거래처 미팅', created_at: '2024-11-02T17:00:00Z' },

  // 카니발 2.2 디젤
  { id: 'trip-006', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-08', distance_km: 280, memo: '천안 물류센터 자재 이송', created_at: '2024-08-08T19:00:00Z' },
  { id: 'trip-007', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, trip_date: '2024-09-12', distance_km: 450, memo: '대구 공장 기술 지원 출장', created_at: '2024-09-12T20:00:00Z' },
  { id: 'trip-008', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, trip_date: '2024-10-20', distance_km: 310, memo: '충북 청주 현장 점검', created_at: '2024-10-20T18:00:00Z' },
  { id: 'trip-009', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, trip_date: '2024-11-10', distance_km: 210, memo: '수도권 외곽 물류 이송', created_at: '2024-11-10T17:30:00Z' },

  // 쏘나타 하이브리드
  { id: 'trip-010', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-14', distance_km: 190, memo: '경기 서남부 영업소 방문', created_at: '2024-08-14T18:00:00Z' },
  { id: 'trip-011', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, trip_date: '2024-09-18', distance_km: 260, memo: '원주 강원영업소 방문', created_at: '2024-09-18T19:00:00Z' },
  { id: 'trip-012', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, trip_date: '2024-10-25', distance_km: 220, memo: '아산 고객 상담 미팅', created_at: '2024-10-25T18:30:00Z' },

  // 아이오닉 6 전기차
  { id: 'trip-013', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-22', distance_km: 210, memo: '세종 정부청사 공공사업 미팅', created_at: '2024-08-22T19:00:00Z' },
  { id: 'trip-014', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, trip_date: '2024-09-24', distance_km: 160, memo: '분당 카카오/네이버 파트너 미팅', created_at: '2024-09-24T18:00:00Z' },
  { id: 'trip-015', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, trip_date: '2024-10-28', distance_km: 350, memo: '전주 탄소산업 진흥원 방문', created_at: '2024-10-28T20:30:00Z' },
  { id: 'trip-016', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, trip_date: '2024-11-12', distance_km: 140, memo: '서울 마곡 R&D 센터 왕복', created_at: '2024-11-12T17:00:00Z' },

  // 넥쏘 수소차
  { id: 'trip-017', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, trip_date: '2024-08-30', distance_km: 250, memo: '평택 수소 특화단지 시찰', created_at: '2024-08-30T18:00:00Z' },
  { id: 'trip-018', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, trip_date: '2024-10-05', distance_km: 290, memo: '충주 그린수소 포럼 참석', created_at: '2024-10-05T19:00:00Z' },
  { id: 'trip-019', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, trip_date: '2024-11-08', distance_km: 180, memo: '안산 수소시범도시 미팅', created_at: '2024-11-08T18:00:00Z' },
];

export const INITIAL_ENERGY_LOGS: EnergyLog[] = [
  // 그랜저 가솔린 (단위: L, 1,720원/L 수준)
  { id: 'eng-001', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, log_date: '2024-08-06', amount: 45.2, total_cost: 77700, unit_price: 1719, memo: 'GS칼텍스 판교주유소', created_at: '2024-08-06T09:00:00Z' },
  { id: 'eng-002', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, log_date: '2024-09-11', amount: 50.0, total_cost: 86500, unit_price: 1730, memo: 'SK에너지 송도주유소', created_at: '2024-09-11T10:00:00Z' },
  { id: 'eng-003', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, log_date: '2024-10-16', amount: 55.4, total_cost: 95300, unit_price: 1720, memo: 'S-OIL 광주고속주유소', created_at: '2024-10-16T11:00:00Z' },
  { id: 'eng-004', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, log_date: '2024-11-03', amount: 48.0, total_cost: 82560, unit_price: 1720, memo: 'HD현대오일뱅크 서초', created_at: '2024-11-03T12:00:00Z' },

  // 카니발 디젤 (단위: L, 1,550원/L 수준)
  { id: 'eng-005', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, log_date: '2024-08-09', amount: 60.0, total_cost: 93000, unit_price: 1550, memo: '경부고속도로 안성휴게소', created_at: '2024-08-09T09:30:00Z' },
  { id: 'eng-006', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, log_date: '2024-09-13', amount: 65.5, total_cost: 102200, unit_price: 1560, memo: '대구 화원주유소', created_at: '2024-09-13T10:30:00Z' },
  { id: 'eng-007', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, log_date: '2024-10-21', amount: 58.2, total_cost: 90200, unit_price: 1550, memo: '청주IC 알뜰주유소', created_at: '2024-10-21T11:30:00Z' },

  // 쏘나타 하이브리드 (단위: L, 1,720원/L 수준)
  { id: 'eng-008', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, log_date: '2024-08-15', amount: 35.0, total_cost: 60200, unit_price: 1720, memo: '수원 영통주유소', created_at: '2024-08-15T09:00:00Z' },
  { id: 'eng-009', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, log_date: '2024-09-19', amount: 38.5, total_cost: 66220, unit_price: 1720, memo: '원주 만종주유소', created_at: '2024-09-19T10:00:00Z' },
  { id: 'eng-010', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, log_date: '2024-10-26', amount: 36.2, total_cost: 62260, unit_price: 1720, memo: '아산 온천주유소', created_at: '2024-10-26T11:00:00Z' },

  // 아이오닉 6 전기 (단위: kWh, 340원/kWh 수준)
  { id: 'eng-011', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, log_date: '2024-08-23', amount: 52.4, total_cost: 17800, unit_price: 340, memo: '환경부 세종청사 급속충전소', created_at: '2024-08-23T09:00:00Z' },
  { id: 'eng-012', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, log_date: '2024-09-25', amount: 48.0, total_cost: 16320, unit_price: 340, memo: '판교 본사 지하 완속충전기', created_at: '2024-09-25T10:00:00Z' },
  { id: 'eng-013', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, log_date: '2024-10-29', amount: 62.0, total_cost: 21080, unit_price: 340, memo: '호남고속도로 여산휴게소 E-pit', created_at: '2024-10-29T11:00:00Z' },
  { id: 'eng-014', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, log_date: '2024-11-13', amount: 42.5, total_cost: 14450, unit_price: 340, memo: '마곡 중앙공원 충전소', created_at: '2024-11-13T12:00:00Z' },

  // 넥쏘 수소 (단위: kg, 9,500원/kg 수준)
  { id: 'eng-015', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, log_date: '2024-08-31', amount: 4.8, total_cost: 45600, unit_price: 9500, memo: '평택 월곡 수소충전소', created_at: '2024-08-31T09:00:00Z' },
  { id: 'eng-016', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, log_date: '2024-10-06', amount: 5.2, total_cost: 49400, unit_price: 9500, memo: '충주 바이오 수소충전소', created_at: '2024-10-06T10:00:00Z' },
  { id: 'eng-017', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, log_date: '2024-11-09', amount: 4.5, total_cost: 42750, unit_price: 9500, memo: '안산 원시 수소충전소', created_at: '2024-11-09T11:00:00Z' },
];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  // 그랜저 가솔린 (노후차라 정비비 발생)
  { id: 'maint-001', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-08-10', item_name: '엔진오일 및 에어컨 필터 교환', cost: 135000, memo: '블루핸즈 판교점 정기교환', created_at: '2024-08-10T14:00:00Z' },
  { id: 'maint-002', vehicle_id: 'veh-001', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-10-18', item_name: '점화플러그 및 브레이크 패드 앞뒤 교체', cost: 380000, memo: '10만km 도래 종합 소모품 교체', created_at: '2024-10-18T15:00:00Z' },

  // 카니발 디젤
  { id: 'maint-003', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-09-02', item_name: '디젤 연료필터 및 엔진오일 세트 교환', cost: 185000, memo: '오토큐 분당점', created_at: '2024-09-02T11:00:00Z' },
  { id: 'maint-004', vehicle_id: 'veh-002', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-11-05', item_name: '앞 타이어 2본 교체 및 휠얼라인먼트', cost: 420000, memo: '마모 한계 도달 교체', created_at: '2024-11-05T16:00:00Z' },

  // 쏘나타 하이브리드
  { id: 'maint-005', vehicle_id: 'veh-003', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-08-20', item_name: '하이브리드 전용 엔진오일 교환', cost: 110000, memo: '정기교환', created_at: '2024-08-20T10:00:00Z' },

  // 아이오닉 6 전기차
  { id: 'maint-006', vehicle_id: 'veh-004', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-09-15', item_name: '고전압 배터리 냉각수 점검 및 에어컨 필터 교환', cost: 75000, memo: 'EV 정기점검 및 소모품', created_at: '2024-09-15T14:00:00Z' },

  // 넥쏘 수소차
  { id: 'maint-007', vehicle_id: 'veh-005', owner_id: DEMO_OWNER_ID, maintenance_date: '2024-10-12', item_name: '수소 감압밸브 및 스택 냉각수 점검', cost: 95000, memo: '수소차 특화 공식서비스센터 정기점검', created_at: '2024-10-12T13:00:00Z' },
];

export const INITIAL_REPLACEMENT_CANDIDATES: ReplacementCandidate[] = [
  {
    id: 'cand-001',
    owner_id: DEMO_OWNER_ID,
    name: '현대 아이오닉 6 익스클루시브 (전기차)',
    fuel_type: 'electric',
    purchase_price: 52000000, // 차량 정가
    subsidy: 6800000, // 국비 + 지자체 보조금
    incidental_cost: 2200000, // 취등록세 감면 반영
    efficiency: 6.2, // km/kWh
    energy_price: 340, // 원/kWh
    annual_maintenance: 350000, // 연간 예상 정비비
    annual_tax: 130000, // 전기차 지방세 연간 13만원 정액
    annual_insurance: 900000, // 연간 보험료
    expected_salvage: 19000000, // 5년 후 예상 잔존가치
    memo: '[후보 1] 기업 친환경 전환 1순위 모델, 저렴한 전기료 및 저공해차 혜택',
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'cand-002',
    owner_id: DEMO_OWNER_ID,
    name: '기아 EV6 스탠다드 (전기 크로스오버)',
    fuel_type: 'electric',
    purchase_price: 49500000,
    subsidy: 6500000,
    incidental_cost: 2100000,
    efficiency: 5.6, // km/kWh
    energy_price: 340, // 원/kWh
    annual_maintenance: 400000,
    annual_tax: 130000,
    annual_insurance: 950000,
    expected_salvage: 17500000,
    memo: '[후보 2] 업무용 다목적 크로스오버 전기차',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'cand-003',
    owner_id: DEMO_OWNER_ID,
    name: '현대 넥쏘 프리미엄 (수소전기차)',
    fuel_type: 'hydrogen',
    purchase_price: 71500000,
    subsidy: 32500000, // 수소차 대규모 보조금 반영
    incidental_cost: 2800000,
    efficiency: 95.0, // km/kg
    energy_price: 9500, // 원/kg
    annual_maintenance: 500000,
    annual_tax: 130000,
    annual_insurance: 1000000,
    expected_salvage: 21000000,
    memo: '[후보 3] 보조금 규모가 매우 큰 친환경 관용차 대안',
    created_at: '2024-01-15T11:00:00Z',
  },
];

