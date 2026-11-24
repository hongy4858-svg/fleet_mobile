# Design: 모바일 앱 화면 구성 및 컴포넌트 설계

> 웹 버전(`mobile/docs/web/design.md`) 대비 변경 사항에 [유지] / [수정] / [신규] 를 표시합니다.
> DB 스키마, Supabase Auth, RLS 정책은 웹과 동일하므로 **[유지]** 로 명시하고 별도 재기술하지 않습니다.

---

## 1. 시스템 아키텍처 [수정]

### 1.1 기술 스택

| 항목 | 웹 | 모바일 | 구분 |
| :--- | :--- | :--- | :--- |
| 언어 | React 18 / TypeScript / Vite | React Native 0.88 / TypeScript / Expo ~58 | [수정] |
| UI 렌더링 | Tailwind CSS + JSX | StyleSheet API (React Native 내장) | [수정] |
| 아이콘 | lucide-react | @expo/vector-icons (Ionicons) | [수정] |
| 차트 | recharts | react-native-svg + 커스텀 컴포넌트 | [수정] |
| 네비게이션 | React Router (사이드바) | React Navigation Bottom Tabs | [신규] |
| 클라우드 DB / Auth | Supabase (PostgreSQL 15+) | 동일 Supabase 프로젝트 | [유지] |
| Repository 패턴 | SupabaseFleetRepository | SupabaseFleetRepository (동일 인터페이스) | [유지] |

### 1.2 아키텍처 다이어그램 [수정]

```
[React Native UI Layer (Screens & Components)]
         │
         ▼
[AuthContext (Supabase Auth: JWT Session)]
         │
         ▼
[Domain / Service Layer (economics.ts, metrics.ts)]
         │
         ▼
[IFleetRepository Interface]
     └── SupabaseFleetRepository (mobile/src/services/supabaseRepository.ts)
              │
              ▼
         [Supabase Cloud DB — 웹과 동일 PostgreSQL 프로젝트]
```

### 1.3 DB 스키마 / Auth / RLS [유지]

6개 테이블(`vehicles`, `trip_logs`, `energy_logs`, `maintenance_logs`, `replacement_candidates`, `analyses`), 복합 외래키, RLS 정책(`auth.uid() = owner_id`), 불변 JSONB 스냅샷은 웹 버전과 완전히 동일합니다.
→ 상세 내용은 `mobile/docs/web/design.md` §2 참조.

---

## 2. 화면 레이아웃 [수정]

### 2.1 전역 헤더 (GlobalHeader) [신규]

`AppNavigator.tsx` 최상단에 고정되는 네이티브 뷰. 웹의 "좌측 사이드바" 를 대신합니다.

| 영역 | 내용 |
| :--- | :--- |
| 좌측 | 초록 단풍잎 아이콘 뱃지 + "친환경 플릿 매니저" 타이틀 + 사용자 이메일(미로그인 시 "로그인 필요") |
| 우측 (로그인 상태) | [시연생성] 버튼 · [초기화] 버튼 · 로그아웃 아이콘 버튼 |
| 우측 (미로그인 상태) | [로그인] teal 버튼 → `AuthModal` 팝업 |

스타일: 배경 `#FFFFFF`, 하단 테두리 `#E2E8F0`, 패딩 `16/12`.

### 2.2 하단 탭 네비게이터 [신규]

5개 탭이 화면 하단에 고정됩니다. 웹의 "좌측 사이드바 메뉴 5항목"을 대체합니다.

| 탭 번호 | 라벨 | 아이콘 (Ionicons) | 화면 컴포넌트 |
| :--- | :--- | :--- | :--- |
| 1 | 대시보드 | `speedometer` / `speedometer-outline` | `DashboardScreen` |
| 2 | 차량 관리 | `car` / `car-outline` | `VehiclesScreen` |
| 3 | 운행·비용 | `receipt` / `receipt-outline` | `LogsScreen` |
| 4 | 경제성 비교 | `calculator` / `calculator-outline` | `AnalysisScreen` |
| 5 | 분석 이력 | `time` / `time-outline` | `HistoryScreen` |

스타일: 활성 `#0D9488`(teal), 비활성 `#94A3B8`, 높이 60, 폰트 크기 10 bold.

### 2.3 로그인 / 회원가입 모달 (`AuthModal`) [수정]

- 웹의 `AuthModal.tsx` 구조를 React Native `Modal` 컴포넌트로 재구현.
- `TextInput`으로 이메일·비밀번호 입력. 로그인 / 회원가입 탭 전환.
- 오류 메시지를 인라인으로 표시. 성공 시 모달 자동 닫힘.

---

## 3. 5대 핵심 화면 [수정]

### 3.1 대시보드 (`DashboardScreen.tsx`) [수정]

#### 화면 구성

- **기간 필터 버튼 행**: [전체] [1개월] [3개월] [6개월] [1년] — `ScrollView` 수평 스크롤
- **KPI 카드 4종** (2×2 그리드):
  - 총 차량 수
  - 총 주행거리 (km)
  - 총 에너지비용 (원)
  - 총 정비비용 (원)
- **CostPerKmChart**: 차량별 km당 운영비 가로 막대 차트 (`react-native-svg` 기반 커스텀)
- **차량 요약 테이블**: 차량별 주행거리 / 에너지비 / 정비비 / km당 비용 텍스트 행

#### 주요 동작

- `Pull-to-Refresh`로 Supabase에서 최신 데이터 로드.
- 로그인 전: 차량 목록 비워두고 "로그인 후 데이터를 확인하세요" 안내.
- 에러 발생 시 에러 메시지 카드 표시.

### 3.2 차량 관리 (`VehiclesScreen.tsx`) [수정]

#### 화면 구성

- **상단**: 총 차량 수 뱃지 + [+ 차량 등록] teal 버튼
- **차량 카드 목록** (ScrollView):
  - 차량번호 / 모델명 / 연료 종류 뱃지 / 연비 / 구매일 / 구매가격 / 메모
  - 카드 우측 하단: [수정] [삭제] 버튼

#### 등록/수정 모달 (`Modal` 컴포넌트)

| 필드 | 입력 방식 | 비고 |
| :--- | :--- | :--- |
| 차량번호 | TextInput | 필수, 중복 방지 |
| 모델명 | TextInput | 필수 |
| 연료 종류 | 선택 버튼 행 (5종) | gasoline / diesel / hybrid / electric / hydrogen |
| 구매일 | TextInput (YYYY-MM-DD) | 필수 |
| 구매가격 | TextInput (숫자) | ≥ 0 |
| 공인 연비 | TextInput (숫자) | > 0 |
| 메모 | TextInput | 선택 |

#### 삭제 확인 모달

삭제 대상 차량의 연관 운행·주유·정비 건수를 사전 조회 후, 경고 문구와 함께 최종 확인을 요청합니다.

### 3.3 운행·비용 기록 (`LogsScreen.tsx`) [수정]

#### 화면 구성

- **상단**: 차량 선택 필터 (전체 / 차량별) 수평 스크롤 버튼 행
- **탭 전환**: [운행 기록] [주유·충전] [정비 기록] — 화면 내 가로 탭 (웹의 가로 탭과 동일 개념)
- **기록 카드 목록** (ScrollView + Pull-to-Refresh)
  - 각 카드: 날짜 / 주요 수치 / 메모 / [수정] [삭제] 버튼
- **[+ 추가] FAB** 또는 상단 버튼 → 모달 폼 열기

#### 입력 모달 (탭별)

| 탭 | 주요 필드 |
| :--- | :--- |
| 운행 기록 | 차량 선택 · 날짜 · 주행거리(km) · 메모 |
| 주유·충전 | 차량 선택 · 날짜 · 주입량(연료별 단위 자동) · 총결제금액 · 단가 · 메모 |
| 정비 기록 | 차량 선택 · 날짜 · 정비항목명 · 비용(원) · 메모 |

연료 종류에 따라 주입 단위(`L` / `kWh` / `kg`)와 단가 단위(`원/L` 등)가 자동 전환됩니다.

### 3.4 경제성 비교 (`AnalysisScreen.tsx`) [수정]

#### 화면 구성

- **대안 A (기존 차량 유지)**: 차량 선택 Picker + 현재 매각가 · 연비 · 에너지단가 · 연간정비비 · 세금 · 보험료 · 잔존가치 TextInput
- **대안 B (신규 차량 교체)**: 후보 차량 선택(또는 직접 입력) + 구매가 · 보조금 · 부대비용 · 연간정비비 · 세금 · 보험료 · 잔존가치
- **공통 조건**: 분석기간(년) · 연간 주행거리(km) · 할인율(%)
- **[분석 실행]** 버튼 → 결과 카드 표시
- **결과 카드**: PV_keep / PV_replace / ΔPV / 경제적 유리 대안 판정 / 학술 고지 문구
- **차트**: `CostComparisonChart` (카테고리별 비용 분해 막대차트, react-native-svg 기반)
- **[분석 저장]** 버튼 → Supabase `analyses` 테이블에 JSONB 스냅샷 INSERT

#### 계산 공식 [유지]

웹 버전 `mobile/docs/web/design.md` §3과 동일한 경제성공학 공식 사용 (`mobile/src/utils/economics.ts`).

### 3.5 분석 이력 (`HistoryScreen.tsx`) [수정]

#### 화면 구성

- **이력 카드 목록** (ScrollView + Pull-to-Refresh):
  - 분석명 / 저장 일시 / 차량 정보 / PV_keep / PV_replace / ΔPV / 판정
  - [복제 재분석] 버튼 / [삭제] 버튼
- **복제**: 과거 분석의 `input_snapshot`을 로드하여 `AnalysisScreen` 폼에 채워 새 분석으로 저장
- **스냅샷 불변성**: `analyses` 테이블 UPDATE 권한 없음 (DB 레벨 보장) [유지]

---

## 4. 공통 컴포넌트 [신규]

| 컴포넌트 | 파일 | 역할 |
| :--- | :--- | :--- |
| AuthModal | `src/components/auth/AuthModal.tsx` | 이메일 로그인·회원가입 모달 |
| CostComparisonChart | `src/components/charts/CostComparisonChart.tsx` | 카테고리별 비용 분해 막대차트 |
| CostPerKmChart | `src/components/charts/CostPerKmChart.tsx` | 차량별 km당 비용 가로 막대차트 |

---

## 5. 색상 체계 [유지]

| 항목 | 값 | 웹 대응 |
| :--- | :--- | :--- |
| 주조색 (헤더 배경) | `#FFFFFF` / `#F8FAFC` | 동일 |
| 강조색 (teal) | `#0D9488` / `#14B8A6` | 동일 |
| 텍스트 (기본) | `#0F172A` | 동일 |
| 텍스트 (보조) | `#64748B` | 동일 |
| 테두리 | `#E2E8F0` / `#CBD5E1` | 동일 |
| 배경 (카드) | `#FFFFFF` | 동일 |
| 비활성 탭 | `#94A3B8` | — (신규) |
