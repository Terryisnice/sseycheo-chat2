# 스쳐챗 MVP 구현 TODO (PRD 6 기준)

## P0 - MVP 동작 필수 (React + Tailwind + Firebase)

### 0) 프로젝트/스택 세팅 (모바일 웹 우선)
- [x] React + Tailwind CSS 기반 모바일 웹 프로젝트 초기화 `[S1]`
- [x] Tailwind 테마를 "Stealth & Utility" 톤으로 기본 설정 (흰 배경/무채색/심플 타이포) `[S1]`
- [x] 라우팅 구조 정의 (`/login`, `/onboarding`, `/lobby`, `/chat/:roomId`, `/fishbowl`, `/admin`) `[S1]`
- [x] 공통 레이아웃 구성 (모바일 viewport, 하단 safe-area, 기본 헤더/입력창 컴포넌트) `[S1]`
- [x] Firebase SDK 연결 (`Auth`, `Firestore`, 필요 시 `Functions`) `[S1]`

### 1) 인증/프로필
- [x] Google 소셜 로그인 구현 (Firebase Auth) `[S1]`
- [x] 최초 로그인 시 익명 닉네임 설정 화면 구현 `[S1]`
- [x] `users/{uid}` 문서 저장: `nickname`, `role`, `isBlocked`, `createdAt` `[S1]`
- [x] 앱 내 실명/프로필 이미지 미노출 처리 `[S1]`

### 2) 관리자 기능 + 이벤트 방
- [x] 관리자 UID 화이트리스트 기반 접근 제어 (`role=admin`) `[S1]`
- [x] 숨김 진입(예: 로고 5탭)으로 관리자 모드 접근 UX 구현 `[S1]`
- [x] 이벤트 방 생성 UI 구현: 이벤트명, 인원수(기본 4:4), 라운드 시간(기본 10분), 총 라운드(4) `[S1]`
- [x] `events/{eventId}` 스키마 설계: `status`, `currentRound`, `roundEndsAt`, `participants` `[S1]`
- [x] 참가자 체크인/대기열 등록 로직 구현 `[S1]`

### 3) 셔플챗 코어 로직
- [ ] 라운드 시작 시 1:1 매칭 생성 및 채팅방 자동 개설 `[S2]`
- [ ] `chatRooms/{roomId}` + `messages` 서브컬렉션 구조 설계 `[S2]`
- [x] 텍스트 전용 입력만 허용 (이미지/파일/음성 UI 제거) `[S2]`
- [x] 라운드 타이머 실시간 표시 (클라이언트 + 서버시간 기준 보정) `[S2]`
- [x] 종료 1분 전 시스템 경고 메시지 자동 노출 `[S2]`
- [x] 종료 시 입력 잠금 + "어장 추가(예/아니오)" 강제 팝업 표시 `[S2]`
- [x] 양측 응답 완료 시 다음 매칭 진행, 4라운드 반복 `[S2]`
- [ ] 4라운드 종료 후 상호 YES 페어만 영구 채팅방 생성 `[S2]`

### 4) 안전장치 (신고/차단)
- [x] 채팅방 내 신고 버튼 구현 (원탭) `[S2]`
- [x] `reports` 컬렉션에 신고 로그 저장 (신고자/피신고자/eventId/roomId/timestamp) `[S2]`
- [ ] 차단 유저 재매칭 제외 로직 반영 `[S2]`
- [ ] 관리자 화면에서 UID 차단 처리 (`isBlocked=true`) `[S3]`

## P1 - MVP 완성도 개선

### 5) 어장(Fishbowl) 기능
- [ ] 상호 선택 유저를 `fishbowl` 데이터로 저장 `[S3]`
- [ ] 만남 날짜/이벤트명 자동 태그 저장 `[S3]`
- [ ] 어장 카드별 비밀 메모 CRUD 구현 (작성자 본인만 조회) `[S3]`

### 6) 예외/운영 안정화
- [ ] 중복 매칭 방지 규칙 추가 (같은 이벤트 내 라운드 중복 제한) `[S3]`
- [ ] 미응답/이탈 사용자 처리 (타임아웃/스킵/재큐잉 정책) `[S3]`
- [ ] 이벤트 중단/재개 관리자 컨트롤 추가 `[S3]`
- [ ] 실패 상태 UX 정리 (재시도, 대기, 종료 안내) `[S3]`
- [x] 로비/이벤트 카드 가독성 개선 (참가자 수, 상태, 액션 버튼의 텍스트 크기/강조 대비 상향) `[S3]`
- [x] 프로필 데이터 누락 방어 처리 (닉네임 없는 사용자 자동 온보딩 재유도 또는 임시 닉네임 fallback) `[S2]`
- [x] 채팅방 제목 표시 개선 (Firestore document ID 대신 이벤트명 + 라운드 번호를 사용자용 제목으로 노출) `[S2]`
- [x] 채팅 말풍선 발신자 식별 강화 (닉네임 라벨 노출: 나/상대 구분) `[S2]`
- [x] 채팅 발신자 시각 식별 보강 (프로필 이미지 대신 고정 이모지/배지 추가) `[S2]`
- [x] 닉네임 fallback 규칙 도입 (미설정 시 `익명-xxxx` 등 임시 표시명 자동 생성) `[S2]`
- [x] 라운드 타이머 서버 기준 고정 (`roundEndsAt` 기반 계산, 로비 이동/재입장/새로고침 시에도 남은 시간 유지) `[S2]`
- [x] 로비 이벤트 카드 실시간 타이머 표시 (`roundEndsAt` 기준 남은 시간/1분 경고/종료 상태 노출) `[S2]`

## P2 - 테스트/출시 직전

### 7) 품질 검증
- [ ] 핵심 시나리오 테스트: 로그인 -> 체크인 -> 4라운드 -> 어장 선택 -> 최종 매칭 `[S3]`
- [ ] 권한 테스트: 일반 사용자/관리자/차단 사용자 접근 검증 `[S3]`
- [ ] 모바일 UI 점검: iOS Safari/Android Chrome viewport 대응 `[S3]`

### 8) 관측/운영 준비
- [ ] 기본 이벤트 로그 설계 (체크인 수, 라운드 완료율, 매칭 성공률, 신고율) `[S3]`
- [ ] 운영용 관리자 체크리스트 문서화 (방 생성 -> 시작 -> 종료 -> 사후 확인) `[S3]`

## Firebase 데이터 모델 초안 (구현 기준)

- [x] `users/{uid}`: `nickname`, `role(user|admin)`, `isBlocked`, `createdAt` `[S1]`
- [x] `events/{eventId}`: `title`, `status`, `participants`, `currentRound`, `roundEndsAt`, `createdBy` `[S1]`
- [ ] `events/{eventId}/rounds/{roundNo}`: `pairs`, `startedAt`, `endsAt` `[S2]`
- [ ] `chatRooms/{roomId}`: `eventId`, `roundNo`, `participants`, `isLocked`, `isPermanent` `[S2]`
- [x] `chatRooms/{roomId}/messages/{messageId}`: `senderUid`, `text`, `createdAt`, `type(system|user)` `[S2]`
- [x] `roundChoices/{eventId_roundNo_roomId}`: 각 사용자 `yes/no` 선택값 `[S2]`
- [ ] `fishbowl/{ownerUid}/items/{targetUid}`: `eventId`, `metAt`, `memo`, `mutual` `[S3]`
- [x] `reports/{reportId}`: `reporterUid`, `targetUid`, `eventId`, `roomId`, `reason`, `createdAt` `[S2]`

## Out of Scope (PRD 기준 Phase 2+)

- [ ] BLE 기반 10m 탐색 기능
- [ ] 결제 시스템
