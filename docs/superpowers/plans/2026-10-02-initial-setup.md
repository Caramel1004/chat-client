# Initial Setup Implementation Plan

**Goal:** Bun 기반 React 프론트엔드와 채팅 목록·채팅방을 Vercel에 배포한다.
**Architecture:** Vite 정적 SPA와 React Router. 메시지는 앱 메모리에서만 유지한다.
**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Bun, Vitest, Vercel.
**Spec:** ../specs/2026-10-02-initial-setup-design.md

## 작업
- [x] Vite, React, TypeScript, Tailwind CSS 4, ESLint 초기 설정.
- [x] 사용자 요청에 따라 npm에서 Bun 및 bun.lock으로 전환.
- [x] 입력과 페이지 흐름 테스트를 작성하고 기존 화면에서 5개 실패 확인.
- [x] ChatListPage, ChatRoomPage, MessageComposer, 메시지 타입과 메모리 상태 구현.
- [x] Vercel SPA rewrite와 Bun 빌드, README 실행 안내 구성.
- [x] bun run check, 두 페이지 데스크톱/모바일 확인, 코드 리뷰.
- [ ] Vercel 로그인 후 프로덕션 배포와 직접 URL 검증.

## 검토 대상
한글 IME, 공백, 줄바꿈, 좁은 화면, 긴 메시지, 방 직접 접속, 페이지 이동과 새로고침의 상태 차이, 인증 파일 제외를 확인한다.

## 진행 기록
초기 빈 폴더에서 Git 저장소를 만들었다. 사용자가 진행 중 Bun과 두 페이지 구성을 요청하여 기존 시작 화면을 교체했다. 초기 구현의 입력 테스트 5개가 모두 실패하는 것을 확인한 뒤 구현했다. 실시간 공유를 가장하지 않고 로컬 미리보기로 명시한다. Vercel 인증은 사용자의 로그인을 기다리는 중이다.

## 검증 결과
- bun install --frozen-lockfile 성공.
- bun run check 성공: ESLint, Vitest 5/5, TypeScript, Vite 빌드.
- 프로덕션 미리보기에서 입장, Enter 전송, 버튼 전송, 목록의 마지막 메시지, 새로고침 초기화 확인.
- 390px 및 320px 화면에서 가로 넘침 없음. 390×844에서 채팅 입력창까지 화면 높이 내 표시 확인.
- 브라우저 경고/오류 없음. 읽기 전용 코드 리뷰에서 중대한 문제 없음.
- 실제 모바일 기기의 가상 키보드 동작은 미검증. 낮은 화면에서는 입력창 접근을 위해 문서 스크롤을 허용한다.
