# Tasks: 모바일 앱 단계별 작업 및 검증 현황

> 웹 버전(`mobile/docs/web/tasks.md`) 대비 변경 사항에 [유지] / [수정] / [신규] 를 표시합니다.
>
> **중요**: 모바일 앱의 모든 화면·기능은 단일 커밋 `6efac44`으로 한꺼번에 구현되었습니다.
> 작업별로 커밋한 것처럼 Git 이력을 재작성하거나 과거 기록을 꾸미지 않습니다.
> 사용자가 직접 실기기에서 확인한 항목만 ✅로 표시하고, 그 외는 ⬜(미확인)으로 유지합니다.

---

## 작업 진행 현황 요약

| 구분 | 상태 |
| :--- | :--- |
| 코드 구현 | 완료 (커밋 `6efac44`) |
| Expo Go 실기기 실행 | ✅ 사용자 확인 완료 |
| 모바일 → 웹 데이터 공유 확인 | ✅ 사용자 확인 완료 (운행 기록 추가 후 웹 조회 성공) |
| 나머지 CRUD / 분석 / 탐색 검증 | ⬜ 미확인 |

---

## T1: 인증 및 Supabase 연결 [수정]

### 구현 완료 항목 (커밋 `6efac44`)

- [x] `AuthContext.tsx`: 이메일/비밀번호 로그인·회원가입·로그아웃 상태 관리 (`useAuth` 훅 제공)
- [x] `AuthModal.tsx`: React Native `Modal` 기반 로그인·회원가입 팝업
- [x] `AppNavigator.tsx` 글로벌 헤더: 로그인 버튼·로그아웃 아이콘·사용자 이메일 표시
- [x] `supabaseClient.ts`: Supabase 클라이언트 초기화 및 환경변수(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) 적용
- [x] `.env.example` 작성 / `.gitignore`에 `.env` 등록

### 변경 파일

| 파일 | 역할 |
| :--- | :--- |
| `mobile/src/contexts/AuthContext.tsx` | Supabase Auth 세션 관리 |
| `mobile/src/components/auth/AuthModal.tsx` | 로그인 팝업 UI |
| `mobile/src/services/supabaseClient.ts` | Supabase 클라이언트 |
| `mobile/src/navigation/AppNavigator.tsx` | 헤더 인증 UI 통합 |
| `mobile/.env.example` | 환경변수 예시 |

### 휴대폰 확인 항목

| 확인 항목 | 상태 |
| :--- | :--- |
| Expo Go QR 스캔 → 앱 정상 기동 | ✅ 확인 완료 |
| 이메일·비밀번호 로그인 성공 | ⬜ 미확인 |
| 로그인 후 사용자 이메일 헤더 표시 | ⬜ 미확인 |
| 로그아웃 후 화면 초기화 | ⬜ 미확인 |
| 환경변수 미설정 시 오류 안내 | ⬜ 미확인 |

---

## T2: 차량 관리 [유지 — 기능 동일, UI 패턴만 변경]

### 구현 완료 항목 (커밋 `6efac44`)

- [x] `VehiclesScreen.tsx`: 차량 카드 목록, 등록·수정·삭제 Modal 폼 구현
- [x] 차량번호 중복 방지 (Supabase UNIQUE 제약 + 프론트 에러 처리)
- [x] 삭제 전 연관 기록 건수 조회 → 경고 다이얼로그 (`VehicleDeletionCheck`)
- [x] 연료 종류 5종 선택 버튼 행 (gasoline / diesel / hybrid / electric / hydrogen)

### 변경 파일

| 파일 | 역할 |
| :--- | :--- |
| `mobile/src/screens/VehiclesScreen.tsx` | 차량 목록·CRUD 화면 |
| `mobile/src/services/supabaseRepository.ts` | 차량 CRUD API 호출 |
| `mobile/src/services/repository.ts` | `VehicleDeletionCheck` 타입 |

### 휴대폰 확인 항목

| 확인 항목 | 상태 |
| :--- | :--- |
| 차량 목록 조회 (로그인 후) | ⬜ 미확인 |
| 차량 등록 → 목록에 즉시 반영 | ⬜ 미확인 |
| 차량 수정 → 변경 내용 저장 | ⬜ 미확인 |
| 차량 삭제 → 연관 기록 경고 → 삭제 확인 | ⬜ 미확인 |
| 차량번호 중복 등록 시 에러 메시지 표시 | ⬜ 미확인 |

---

## T3: 운행·비용 기록 [수정]

### 구현 완료 항목 (커밋 `6efac44`)

- [x] `LogsScreen.tsx`: 운행·주유·정비 탭 전환 UI
- [x] 차량 선택 필터 (전체 / 차량별)
- [x] 운행 기록 CRUD Modal (날짜·거리·메모)
- [x] 주유·충전 기록 CRUD Modal (날짜·주입량·총액·단가·메모, 연료별 단위 자동)
- [x] 정비 기록 CRUD Modal (날짜·항목명·비용·메모)
- [x] Pull-to-Refresh

### 변경 파일

| 파일 | 역할 |
| :--- | :--- |
| `mobile/src/screens/LogsScreen.tsx` | 운행·비용 기록 화면 (1,006 lines) |
| `mobile/src/services/supabaseRepository.ts` | 기록 CRUD API 호출 |
| `mobile/src/utils/formatters.ts` | `getFuelUnit` 연료별 단위 반환 |

### 휴대폰 확인 항목

| 확인 항목 | 상태 |
| :--- | :--- |
| 운행 기록 추가 후 웹에서 조회 | ✅ 확인 완료 |
| 운행 기록 수정·삭제 | ⬜ 미확인 |
| 주유·충전 기록 추가·수정·삭제 | ⬜ 미확인 |
| 정비 기록 추가·수정·삭제 | ⬜ 미확인 |
| 연료별 단위 자동 전환 (kWh/kg/L) | ⬜ 미확인 |

---

## T4: 대시보드·경제성 분석·이력 [수정]

### 구현 완료 항목 (커밋 `6efac44`)

- [x] `DashboardScreen.tsx`: KPI 카드 4종 · 기간 필터 · `CostPerKmChart`
- [x] `AnalysisScreen.tsx`: 대안 A/B 입력 폼 · PV 계산 · 결과 카드 · `CostComparisonChart` · 분석 저장
- [x] `HistoryScreen.tsx`: 분석 이력 목록 · 복제 재분석 · 삭제
- [x] `economics.ts`: PV 계산 (할인율 0% 및 양수 분기) [유지]
- [x] `metrics.ts`: km당 운영비, 차량별 집계 [유지]
- [x] `CostComparisonChart.tsx` / `CostPerKmChart.tsx`: react-native-svg 기반 차트

### 변경 파일

| 파일 | 역할 |
| :--- | :--- |
| `mobile/src/screens/DashboardScreen.tsx` | 대시보드 화면 |
| `mobile/src/screens/AnalysisScreen.tsx` | 경제성 비교 화면 |
| `mobile/src/screens/HistoryScreen.tsx` | 분석 이력 화면 |
| `mobile/src/components/charts/CostComparisonChart.tsx` | 비용 분해 차트 |
| `mobile/src/components/charts/CostPerKmChart.tsx` | km당 비용 차트 |
| `mobile/src/utils/economics.ts` | PV 계산 유틸리티 |
| `mobile/src/utils/metrics.ts` | 운영 지표 유틸리티 |

### 휴대폰 확인 항목

| 확인 항목 | 상태 |
| :--- | :--- |
| 대시보드 KPI 카드 로드 | ⬜ 미확인 |
| 기간 필터 전환 → KPI 갱신 | ⬜ 미확인 |
| CostPerKmChart 차량별 렌더링 | ⬜ 미확인 |
| 경제성 비교 → PV 계산 결과 표시 | ⬜ 미확인 |
| 분석 저장 → 이력 화면에 반영 | ⬜ 미확인 |
| 분석 복제 → 조건 수정 → 새 분석 저장 | ⬜ 미확인 |
| 과거 분석 스냅샷 불변성 (차량 수정 후에도 보존) | ⬜ 미확인 |

---

## T5: 탐색·실기기·연동 검증 [신규]

웹 버전에는 없는 모바일 고유 검증 항목입니다.

### 구현 완료 항목 (커밋 `6efac44`)

- [x] 하단 탭 5개 구성 (AppNavigator.tsx)
- [x] Pull-to-Refresh 모든 화면 적용
- [x] SafeAreaProvider / SafeAreaView 적용 (노치 대응)
- [x] StatusBar `dark` 모드

### 변경 파일

| 파일 | 역할 |
| :--- | :--- |
| `mobile/src/navigation/AppNavigator.tsx` | 하단 탭 + 헤더 통합 |
| `mobile/App.tsx` | SafeAreaProvider·NavigationContainer·AuthProvider 조합 |
| `mobile/app.json` | Expo 앱 메타데이터 (이름·아이콘·슬래시 스크린) |
| `mobile/assets/` | 아이콘·스플래시 PNG |

### 휴대폰 확인 항목

| 확인 항목 | 상태 |
| :--- | :--- |
| Expo Go 실기기 실행 | ✅ 확인 완료 |
| 모바일 추가 데이터 → 웹에서 조회 성공 | ✅ 확인 완료 |
| 하단 탭 5개 전환 정상 동작 | ⬜ 미확인 |
| iOS Safe Area (노치) 정상 처리 | ⬜ 미확인 |
| Android 하단 네비게이션 바 정상 처리 | ⬜ 미확인 |
| 웹에서 추가한 데이터 → 모바일 Pull-to-Refresh 후 반영 | ⬜ 미확인 |
