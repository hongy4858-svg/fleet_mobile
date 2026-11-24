# 친환경 플릿 매니저 — Expo/React Native 모바일 앱

> **기업 차량 운영 관리 및 친환경차 전환 경제성 분석 시스템 (모바일)**  
> 산업공학과 데이터베이스 및 경제성공학 융합 실무 과제 — Expo 모바일 확장 단계  
> 웹/PWA 버전 저장소: [fleet_app](https://github.com/hongy4858-svg/fleet_app) (`mobile` 브랜치)

---

## 프로젝트 개요

웹 버전과 **동일한 Supabase 클라우드 DB(PostgreSQL 15+, Auth, RLS)**에 연결하여,  
차량 등록·운행·비용 기록과 경제성 분석 기능을 스마트폰에서 조회·입력합니다.

**사용 장면**: 운전 중 조작이 아닌, 출발 전·운행 종료 후 정차 상태에서 사용.

---

## 기술 스택

| 항목 | 내용 |
| :--- | :--- |
| 플랫폼 | Expo ~58 / React Native 0.88 |
| 언어 | TypeScript |
| 네비게이션 | React Navigation (Bottom Tabs) |
| 아이콘 | @expo/vector-icons (Ionicons) |
| 차트 | react-native-svg 기반 커스텀 |
| DB / Auth | Supabase (웹과 동일 프로젝트 공유) |
| 세션 저장 | AsyncStorage |

---

## 화면 구성 (5탭)

| 탭 | 화면 | 주요 기능 |
| :--- | :--- | :--- |
| 대시보드 | `DashboardScreen` | KPI 카드 4종, 기간 필터, km당 비용 차트 |
| 차량 관리 | `VehiclesScreen` | 차량 목록·등록·수정·삭제, 삭제 경고 모달 |
| 운행·비용 | `LogsScreen` | 운행·주유·정비 기록 CRUD, 연료별 단위 자동 |
| 경제성 비교 | `AnalysisScreen` | 유지 vs 교체 PV 비교, 분석 저장 |
| 분석 이력 | `HistoryScreen` | 이력 조회, 복제 재분석, 삭제 |

---

## 실기기 확인 현황

| 항목 | 상태 |
| :--- | :--- |
| Expo Go QR 스캔 → 앱 기동 | ✅ 사용자 직접 확인 |
| 모바일 추가 운행 기록 → 웹 조회 성공 | ✅ 사용자 직접 확인 |
| 로그인 / 로그아웃 | ⬜ 미확인 |
| 차량 CRUD | ⬜ 미확인 |
| 운행·주유·정비 CRUD | ⬜ 미확인 |
| 분석 저장·복제 | ⬜ 미확인 |
| 하단 탭 5개 전환 | ⬜ 미확인 |
| 경제성 비교 PV 계산 결과 | ⬜ 미확인 |

---

## 환경변수 설정

`mobile/` 폴더 안에 `.env` 파일을 생성하세요.  
(`.env.example` 참고 — 실제 키 값은 Git에 절대 커밋하지 마세요.)

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> `service_role` 키나 DB 비밀번호는 클라이언트에 포함하지 않습니다.  
> Supabase SQL 마이그레이션은 웹 저장소의 `supabase/migrations/` 참고.

---

## 설치 및 실행

```bash
# 1. 의존성 설치
cd mobile
npx expo install

# 2. 환경변수 설정 (위 항목 참고)

# 3. 개발 서버 시작
npx expo start

# 4. 실기기에서 Expo Go 앱 설치 후 QR 코드 스캔
```

> **패키지 추가 시 반드시** `npx expo install <package>` 사용 (`npm install` 금지).

---

## 프로젝트 구조

```
mobile/
├── App.tsx                  # 앱 진입점 (SafeAreaProvider·NavContainer·AuthProvider)
├── app.json                 # Expo 메타데이터
├── package.json
├── .env.example             # 환경변수 예시 (실제 키 없음)
├── assets/                  # 아이콘·스플래시 이미지
├── docs/
│   ├── web/                 # 웹 버전 문서 4종 (원문 보존)
│   └── mobile/              # 모바일 문서 (prd, design, tasks, rules, 비교표)
└── src/
    ├── components/
    │   ├── auth/AuthModal.tsx
    │   └── charts/
    │       ├── CostComparisonChart.tsx
    │       └── CostPerKmChart.tsx
    ├── contexts/AuthContext.tsx
    ├── data/mockData.ts
    ├── navigation/AppNavigator.tsx
    ├── screens/
    │   ├── DashboardScreen.tsx
    │   ├── VehiclesScreen.tsx
    │   ├── LogsScreen.tsx
    │   ├── AnalysisScreen.tsx
    │   └── HistoryScreen.tsx
    ├── services/
    │   ├── supabaseClient.ts
    │   ├── supabaseRepository.ts
    │   └── repository.ts
    ├── types/index.ts
    └── utils/
        ├── economics.ts     # PV 계산 (할인율 0% 및 양수)
        ├── metrics.ts       # km당 운영비 집계
        └── formatters.ts    # 단위·통화 포맷
```

---

## 개발 주의사항

- DB 스키마·RLS 정책은 수정하지 않는다 (`supabase/migrations/` 읽기 전용).
- UI는 React Native 코어 컴포넌트만 사용 (`<div>`, Tailwind CSS 금지).
- 패키지 추가: `npx expo install` → `npx expo-doctor` 순서 필수.
- `ios/`, `android/` 폴더 직접 편집 금지 (Expo CNG 원칙).
- `.env` 파일은 `.gitignore`에 등록되어 있으며 커밋하지 않는다.

---

## 관련 저장소

| 저장소 | 설명 |
| :--- | :--- |
| [fleet_app](https://github.com/hongy4858-svg/fleet_app) (`main` / `pwa` 브랜치) | 웹 + PWA 버전 |
| [fleet_app](https://github.com/hongy4858-svg/fleet_app) (`mobile` 브랜치) | 본 Expo 앱 소스 원본 위치 |
