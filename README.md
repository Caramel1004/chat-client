# Chat Client

React 19 기반 채팅 서비스 프론트엔드입니다. **채팅 목록과 채팅방** 두 페이지로 구성됩니다.

## 기술 스택

- React 19 + TypeScript (strict)
- Tailwind CSS 4 + Vite
- React Router 7
- Bun 1.4.2 (`bun.lock`)
- ESLint + Vitest + Testing Library
- Vercel 정적 배포

## 로컬 실행

Bun 1.4.2와 Node.js 22.13 이상인 22.x 버전을 사용합니다. nvm 사용자는 `nvm use`로 Node 버전을 맞출 수 있습니다.

```sh
bun install --frozen-lockfile
bun run dev
```

터미널에 출력되는 HTTP 주소(기본 `http://localhost:5173`)를 열어 확인합니다. `index.html`을 파일로 직접 열면 앱이 실행되지 않습니다.

## 검사 및 빌드

```sh
bun run typecheck  # TypeScript 검사
bun run lint       # ESLint 검사
bun run test       # Vitest 입력/페이지 흐름 테스트
bun run check      # 린트 + 테스트 + 타입 검사 + 프로덕션 빌드
bun run preview    # 빌드한 dist 미리보기
```

`bun run test`는 Vitest를 실행합니다. Bun 내장 테스트 러너의 `bun test`와 구분해 주세요.

## 페이지와 현재 동작

| 경로 | 페이지 |
| --- | --- |
| `/` | 채팅 목록 — 미리보기 방인 라운지에 입장 |
| `/rooms/lounge` | 채팅방 — 메시지 입력과 대화 보드 |

목록 상단의 **채팅방 만들기** 버튼을 누르면 생성 모달이 열립니다. 방 이름(필수, 최대 40자)과 설명(선택, 최대 120자)을 입력하고 **만들기**를 누르면 목록에 추가됩니다. **취소**, 닫기 버튼, Esc로 닫으면 생성되지 않습니다. 새로 연 모달은 빈 입력으로 시작합니다.

생성한 방은 `/rooms/:roomId`로 입장할 수 있으며, 방마다 메시지가 분리됩니다. 방과 메시지는 모두 메모리에만 유지되어 새로고침하면 사라집니다.

Enter 또는 전송 버튼으로 메시지를 보내고 Shift+Enter로 줄바꿈합니다. 한글 조합 중 Enter는 전송하지 않습니다. 공백 메시지는 전송할 수 없고 입력은 최대 2,000자입니다.

메시지는 React 메모리 상태에만 존재합니다. 목록을 다녀와도 유지되지만 새로고침하면 사라집니다. 다른 탭이나 사용자에게 전달되지 않습니다. 화면에도 로컬 미리보기임을 표시합니다.

## 디렉터리

- `src/pages/`: 채팅 목록·채팅방 페이지
- `src/components/MessageComposer.tsx`: 입력 및 전송 처리
- `src/components/CreateRoomModal.tsx`: 채팅방 생성 모달
- `src/data/rooms.ts`: 미리보기 채팅방
- `src/types/chat.ts`: 채팅방·메시지 타입
- `src/App.tsx`: 라우팅과 메모리 상태
- `src/main.tsx`: React 진입점
- `src/App.test.tsx`: 페이지 흐름 및 메시지 전송 테스트

## Vercel 배포

```sh
bunx vercel login
bunx vercel --prod
```

현재 디렉터리를 Vercel 프로젝트에 연결합니다. `bun.lock`으로 Bun을 감지하고 `bun run build`의 `dist`를 배포합니다. `vercel.json`의 SPA rewrite로 채팅방 URL 직접 접속과 새로고침을 지원합니다.

`.vercel/`과 환경 변수 파일은 Git에서 제외됩니다. `VITE_` 환경 변수는 브라우저에 공개되므로 비밀 키를 넣으면 안 됩니다.

## 실시간 연결 (후속 단계)

WebSocket은 아직 연결하지 않았습니다. 사용자 간 실시간 통신에는 중계 서버 또는 외부 실시간 서비스가 필요합니다. 프론트엔드는 Vercel에 배포하고 연결 방식은 후속 단계에서 결정합니다. 메시지를 영구 저장하지 않는 베타를 목표로 합니다.
