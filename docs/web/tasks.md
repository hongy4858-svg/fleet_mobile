# Tasks: 단계별 작업 및 진행 상태 (Supabase Cloud 연동)

본 문서는 "기업 차량 운영 관리 및 친환경차 전환 경제성 분석 시스템"의 단계별 작업 분할 구조(WBS)와 진행 상태를 관리합니다.

---

## 작업 진행 현황 요약
- **전체 진척률**: 100% (Supabase 클라우드 DB 연동, Auth, RLS 스키마, 빌드 및 검증 완료)
- **현재 단계**: 사용자의 Supabase 프로젝트 환경변수 및 SQL 적용 대기

---

## 세부 단계별 작업 내역

### 1단계: 프로젝트 기획 및 설계 문서화 [완료]
- [x] `docs/prd.md`: 목적, 사용자, 기능 요구사항, 범위, 완료 기준 정의
- [x] `docs/design.md`: 화면 와이어프레임, ERD, 데이터 구조, 경제성공학 공식 및 계산 기준 정의
- [x] `docs/tasks.md`: 작업 단계 및 진행 상태 체크리스트 작성
- [x] `docs/rules.md`: 개발 규칙, 단위 체계, 데이터 유효성 검증, 보안 원칙 정의

### 2단계: 프론트엔드 프로젝트 셋업 [완료]
- [x] Vite + React + TypeScript 템플릿 프로젝트 생성 (`fleet_app`)
- [x] Tailwind CSS 설정 및 스타일 테마(Navy, Teal, Slate) 구성
- [x] 필수 패키지(`lucide-react`, `recharts`, `clsx`, `tailwind-merge`) 설치 완료
- [x] 글로벌 레이아웃(헤더, 사이드바, 푸터) 구성

### 3단계: 도메인 모델 및 Repository 추상화 [완료]
- [x] TypeScript 도메인 인터페이스 정의 (`src/types/index.ts`)
- [x] `IFleetRepository` 인터페이스 및 `LocalStorageFleetRepository` 오프라인 보존 (`src/services/repository.ts`)
- [x] 가상 시연 데이터 5대 차량 및 실적 시딩 로직 구현

### 4단계: 경제성 계산 및 운영지표 엔진 구현 [완료]
- [x] 경제성공학 계산 유틸리티 (`src/utils/economics.ts`): 현가계수, 할인율 0% 및 양수 분기, PV 계산
- [x] 운영 지표 계산 유틸리티 (`src/utils/metrics.ts`): km당 운영비, 참고 실적치 산출
- [x] 계산식 손계산 대조 검증 스크립트 (`scripts/test-economics.cjs`) 100% 통과

### 5단계: 5대 핵심 화면 컴포넌트 개발 [완료]
- [x] 대시보드 화면 (`DashboardView.tsx`)
- [x] 차량 관리 화면 (`VehicleListView.tsx`)
- [x] 운행·비용 기록 화면 (`LogsView.tsx`)
- [x] 유지·교체 경제성 비교 화면 (`AnalysisView.tsx`)
- [x] 분석 이력 화면 (`HistoryView.tsx`)

### 6단계: Supabase 클라우드 DB 연동 및 RLS 마이그레이션 [완료]
- [x] `@supabase/supabase-js` 패키지 설치
- [x] `src/services/supabaseClient.ts`: Supabase 클라이언트 초기화 및 환경변수 검증
- [x] `src/services/supabaseRepository.ts`: `SupabaseFleetRepository` 비동기 CRUD 및 복합 외래키 연계 구현
- [x] `src/services/repository.ts`: 메인 리포지토리를 `supabaseFleetRepository`로 교체
- [x] `supabase/migrations/20240101000000_create_fleet_schema.sql`:
  - 6대 테이블(`vehicles`, `trip_logs`, `energy_logs`, `maintenance_logs`, `replacement_candidates`, `analyses`) 생성
  - PK, CHECK, UNIQUE 제약조건
  - 타 사용자 차량 연결 방지 복합 외래키 (`FOREIGN KEY (vehicle_id, owner_id) REFERENCES vehicles(id, owner_id)`)
  - 모든 테이블 RLS 활성화 및 `auth.uid() = owner_id` 정책 작성
  - 불변 스냅샷 JSONB 보존
- [x] 환경변수 구성: `.env.example` 작성, `.gitignore`에 `.env.local` 등록

### 7단계: Supabase Auth 및 사용자 격리 구현 [완료]
- [x] `src/contexts/AuthContext.tsx`: 이메일/비밀번호 회원가입, 로그인, 로그아웃 상태 관리
- [x] `src/components/auth/AuthModal.tsx`: 로그인/회원가입 팝업 모달
- [x] `src/components/common/Header.tsx`:
  - 클라우드 연결 상태 뱃지, 로그인 사용자 정보 표시
  - 계정별 시연 데이터 생성(`seedDemoDataForUser`) 및 내 데이터 초기화(`resetToDemoData`) 버튼
- [x] 계정 전환/로그아웃 시 화면 데이터 초기화 처리 (`key={`${user.id}_${refreshKey}`}`)

### 8단계: 시스템 검증 및 문서화 [완료]
- [x] 경제성공학 계산 검증 스크립트 실행 (손계산 사례 1, 2 완벽 일치)
- [x] TypeScript 빌드 및 프로덕션 번들링 검증 (`npm run build`)
- [x] `docs/design.md`, `docs/rules.md`, `docs/tasks.md`, `README.md` 갱신


---

## PWA 추가 작업
기존 클라우드 웹앱 구현은 완료되었으며, 아래 PWA 작업은 별도로 진행한다.

- [ ] P1. manifest.json 및 192×192, 512×512 PNG 아이콘 추가. display는 standalone으로 설정하고 HTML에 manifest를 연결한다.
- [ ] P2. 오프라인 캐시를 사용하지 않는 최소 서비스 워커를 작성하고 앱에서 등록한다.
- [ ] P3. 배포 후 사용자가 휴대폰에서 홈 화면 추가, 아이콘 표시, 독립 창 실행 및 기존 로그인·데이터 기능을 직접 확인한다.

진행 순서: 문서 내용 확인 → P1·P2 구현 → 빌드 및 변경 파일 확인 → pwa 브랜치 push → 배포 및 P3 확인.