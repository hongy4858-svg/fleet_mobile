# Rules: 모바일 앱 개발 규칙 및 보안 원칙

> 웹 버전(`mobile/docs/web/rules.md`) 대비 변경 사항에 [유지] / [수정] / [신규] 를 표시합니다.

---

## 1. DB / RLS 불변 원칙 [유지]

> **DB 스키마와 RLS 정책은 절대 변경하지 않는다.**

- 웹과 모바일은 동일한 Supabase PostgreSQL 프로젝트를 공유합니다.
- 6개 테이블의 컬럼·CHECK 제약·UNIQUE 제약·복합 외래키·RLS 정책은 모바일 작업에서 수정하지 않습니다.
- `supabase/migrations/` 파일은 읽기 전용으로 취급합니다.
- DB 레벨 변경이 필요하면 웹 프로젝트 담당자와 별도 협의 후 진행합니다.

---

## 2. React Native 컴포넌트 사용 원칙 [신규]

- 웹 전용 HTML 태그(`<div>`, `<span>`, `<button>` 등)를 사용하지 않는다.
- 모든 UI는 React Native 코어 컴포넌트 또는 Expo SDK 컴포넌트로 구현한다.

| 용도 | 사용 컴포넌트 | 금지 패턴 |
| :--- | :--- | :--- |
| 레이아웃 | `View`, `ScrollView`, `FlatList` | `<div>` |
| 텍스트 | `Text` | `<span>`, `<p>` |
| 터치 / 버튼 | `TouchableOpacity`, `Pressable` | `<button>` |
| 텍스트 입력 | `TextInput` | `<input>` |
| 이미지 | `Image` (React Native) | `<img>` |
| 아이콘 | `Ionicons` (`@expo/vector-icons`) | lucide-react |
| 차트 | `react-native-svg` 기반 커스텀 / 기존 Chart 컴포넌트 | recharts |
| 팝업 | `Modal` (React Native), `Alert` (native dialog) | `dialog`, `confirm()` |
| 스타일 | `StyleSheet.create()` | Tailwind CSS 클래스 |

---

## 3. Expo 호환 패키지 설치 원칙 [신규]

- 패키지를 추가할 때는 반드시 `npx expo install <package>`를 사용한다.  
  (`npm install` / `yarn add` 사용 금지 — Expo SDK 버전과의 호환성이 자동으로 맞춰지지 않음)
- 새 패키지를 추가한 후에는 `npx expo-doctor`로 의존성 충돌을 반드시 확인한다.
- Expo Go에서 지원하지 않는 네이티브 모듈(카메라, Bluetooth 등)이 필요한 경우, Expo Go 대신 Development Build가 필요하다는 사실을 문서에 명시하고 담당자에게 사전 고지한다.
- `ios/` / `android/` 디렉터리는 직접 생성하거나 편집하지 않는다. 네이티브 설정은 `app.json`과 config plugin으로만 조정한다.

---

## 4. 보안 — 공개 키만 사용 [유지]

- 클라이언트(모바일 앱)에는 `EXPO_PUBLIC_SUPABASE_URL`과 `EXPO_PUBLIC_SUPABASE_ANON_KEY`(publishable key)만 주입한다.
- **`service_role` 키나 데이터베이스 비밀번호는 모바일 코드에 절대 포함하지 않는다.**
- Expo 앱에서 `EXPO_PUBLIC_` 접두사가 없는 환경변수는 번들에 포함되지 않는다. 비밀 키에 접두사를 붙이지 않는다.

---

## 5. 환경변수 Git 제외 [유지]

- `.env`, `.env.local`, `.env.development` 등 실제 키 값이 담긴 환경변수 파일은 `mobile/.gitignore`에 등록되어 있으며 커밋하지 않는다.
- 저장소에는 `.env.example`만 커밋한다. `.env.example`에는 키 이름만 기재하고 실제 값은 넣지 않는다.
- CI/CD 환경에서는 Expo EAS Secrets 또는 환경 주입 방식을 사용한다.

---

## 6. 표준 단위 및 표기 [유지]

웹 버전과 동일한 단위 체계를 모바일에서도 준수합니다.

| 분류 | 단위 | 화면 표기 형식 |
| :--- | :--- | :--- |
| 금액 | 원 (KRW) | `#,###원` (정수, 소수점 반올림) |
| 거리 | km | `#,### km` |
| 기간 | 년 | `#년` |
| 할인율 | % | `#.##%` |
| 주입량 (가솔린·디젤·하이브리드) | L | `#,###.# L` |
| 주입량 (전기) | kWh | `#,###.# kWh` |
| 주입량 (수소) | kg | `#,###.## kg` |
| 연비 (가솔린·디젤·하이브리드) | km/L | `##.# km/L` |
| 연비 (전기) | km/kWh | `##.# km/kWh` |
| 연비 (수소) | km/kg | `##.# km/kg` |

---

## 7. 앱 기능 및 계산식 불변 원칙 [신규]

- 경제성 계산 공식(`economics.ts`), 운영 지표 계산(`metrics.ts`)은 수정하지 않는다.
- 기존 화면 컴포넌트의 비즈니스 로직(CRUD 흐름, 에러 처리, 데이터 격리)은 문서화 작업 중 변경하지 않는다.
- 이미 구현된 기능을 삭제하거나 비활성화하지 않는다.

---

## 8. 오류 처리 원칙 [유지]

- Supabase 연결 실패·RLS 거부 발생 시 오류를 은폐하거나 로컬 저장소로 자동 전환하지 않는다.
- 오류 메시지는 화면에 명확히 표시하고, `Alert.alert()` 또는 인라인 에러 카드를 사용한다.
- 주행거리 0km 등 0으로 나누기 발생 가능 상황에서는 "기록 없음 / 계산 불가" 안내를 반드시 표시한다.
