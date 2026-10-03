# Chat Client

React 19 + TypeScript + Tailwind CSS 4로 만든 공개 채팅 베타입니다. 패키지 매니저는 Bun입니다.

## 구조

- `/`: 채팅 목록과 방 생성 모달
- `/rooms/lounge`: 공통 라운지
- `/rooms/:id?name=...&description=...`: 초대 링크로 입장하는 사용자 생성 방
- Supabase Realtime **클라이언트 Broadcast**: 접속 중인 사용자 사이의 WebSocket 메시지 중계
- Vercel: 프론트엔드 정적 배포

**채팅용 DB 테이블이나 별도 백엔드 함수는 사용하지 않습니다.** Supabase 프로젝트에 제공되는 데이터베이스에 방이나 메시지를 저장하지 않습니다. SQL, Postgres Changes, Database Broadcast, 사용자 로그인도 필요하지 않습니다.

## 실행과 연결 설정

Bun 1.4.2와 Node.js 22.13 이상인 22.x를 사용합니다.

```sh
bun install --frozen-lockfile
cp .env.example .env.local
bun run dev
```

기존 `.env.local`이 있으면 복사 대신 아래 두 설정을 추가합니다.

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 프로젝트를 준비합니다.
2. 프로젝트의 **Connect** 창에서 Project URL과 **Publishable key** (`sb_publishable_...`)를 확인합니다.
3. `.env.local`에 다음 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://프로젝트ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_공개키
```

4. Realtime Settings에서 **Enable Realtime service**, **Allow public access to channels**가 켜져 있는지 확인합니다. 현재 앱은 로그인 없는 공개 채널을 사용합니다. 이 설정을 바꾸면 프로젝트의 기존 Realtime 연결도 끊길 수 있으므로 기존 서비스와 공유하는 프로젝트라면 설정 영향을 확인합니다. [공식 설정 문서](https://supabase.com/docs/guides/realtime/settings)
5. 개발 서버를 재시작하고 터미널에 출력된 주소(기본 `http://localhost:5173/`)를 엽니다.

`VITE_` 환경 변수는 브라우저에 포함됩니다. **공개 Publishable key만 사용하며 `sb_secret_...` 또는 `service_role` 키를 넣으면 안 됩니다.** 이 앱은 기존 JWT 형식 anon 키 대신 새 Publishable key를 사용합니다. `.env.local`은 Git에서 제외됩니다.

환경 변수가 없거나 형식이 잘못되어도 목록/모달/초대 링크는 사용할 수 있습니다. 채팅방에는 연결 설정이 필요하다는 안내가 나타나고 메시지 전송은 비활성화됩니다. `index.html`을 파일로 직접 열면 앱이 실행되지 않습니다.

## 사용

방 이름은 최대 40자, 설명은 최대 120자입니다. 방을 만들고 입장한 뒤 **초대 링크**를 공유하면 다른 브라우저에서도 같은 방에 접속합니다. 초대 URL에 방 이름과 설명이 포함되므로 URL 전체를 공유합니다. 전역 방 목록은 없으며 현재 브라우저에서 만들거나 초대받은 방만 목록에 표시됩니다.

Enter 또는 전송 버튼으로 전송하고 Shift+Enter로 줄바꿈합니다. 한글 조합 중 Enter는 전송하지 않습니다. 메시지는 최대 2,000자입니다. 내 메시지는 오른쪽, 상대 게스트의 메시지는 왼쪽에 표시됩니다.

구독 완료 후 WebSocket 연결 상태에서만 전송합니다. `ack: true`로 서비스의 수락을 확인한 뒤 입력을 지우며, `self: true`로 돌아온 자기 메시지와 ACK 결과는 메시지 ID로 중복 제거합니다. 서비스 수락은 모든 참가자의 수신 확인을 뜻하지 않습니다.

전송 확인을 기다리는 동안 중복 전송을 막고, 확인 실패 시 초안을 보존합니다. 확인 실패는 전달 여부가 불확실한 경우도 포함하므로 대화에 표시됐는지 확인하고 재시도합니다. SDK 자동 재연결과 **다시 연결** 버튼을 지원합니다.

## 데이터 수명과 공개 범위

- 방과 메시지는 브라우저 메모리에만 유지합니다. 메시지는 최근 500개까지만 보관합니다. DB, localStorage, 파일에 대화를 쓰지 않습니다.
- 목록을 다녀와도 메모리의 대화는 유지됩니다. 현재 방만 구독하므로 다른 방이나 목록에 있는 동안의 메시지는 받지 않습니다.
- 새로고침/새 접속 시 과거 기록을 불러오지 않습니다. 초대 링크는 방 메타데이터만 복원합니다.
- 연결이 끊긴 동안 놓친 메시지는 복원하지 않습니다. 재연결 후 새로 전달되는 메시지부터 표시합니다.
- 메시지를 DB에 쓰는 **Database Broadcast**와 달리 이 앱은 **클라이언트 Broadcast**만 사용합니다. History/replay 기능을 사용하지 않습니다. 제공자 내부 운영 로그나 전송 중 임시 버퍼까지 없다고 보장하는 구성은 아닙니다. [공식 Broadcast 문서](https://supabase.com/docs/guides/realtime/broadcast)
- 로그인 없는 공개 베타입니다. 프로젝트 URL·공개 키·채널 이름을 알면 누구나 공개 채널에 참여할 수 있습니다. 초대 링크나 게스트 이름은 접근 제어나 검증된 신원이 아닙니다. 비공개 방이 필요해지면 사용자 인증과 Realtime Authorization 설계가 필요합니다.

## 검사

```sh
bun run typecheck
bun run lint
bun run test
bun run check     # lint + Vitest + TypeScript + production build
bun run preview   # 빌드한 dist 확인
```

Vitest는 `bun run test`로 실행합니다. 테스트에는 두 UI 클라이언트의 가상 중계 송수신, 방 분리, 초대 URL, 전송 실패/중복 방지, SDK 구독 상태와 연결 정리가 포함됩니다. 가상 중계/SDK 대역 테스트는 실제 Supabase 통신 검증을 대신하지 않습니다.

실서비스 확인: 일반 창과 시크릿 창으로 같은 방에 입장합니다. 양쪽이 **실시간 연결됨**인 상태에서 서로 메시지를 보내고, 새로고침하면 이전 기록이 없으며 다른 방에 메시지가 나타나지 않는지 확인합니다.

## Vercel 배포

GitHub 연동 시 코드를 저장소에 push한 뒤 Vercel의 **Import Git Repository**에서 해당 저장소를 선택합니다. Framework는 **Vite**, Build Command는 **bun run build**, Output Directory는 **dist**를 사용합니다.

배포 전에 Vercel 프로젝트에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_PUBLISHABLE_KEY`를 환경변수로 등록합니다. 로컬 `.env` 파일은 Git에 올리지 않습니다. 이후 기본 프로덕션 브랜치(`main`)에 push하면 Vercel이 자동으로 다시 배포합니다.

CLI로 직접 배포하는 경우:

```sh
bunx vercel login
bunx vercel link
bunx vercel env add VITE_SUPABASE_URL production
bunx vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
bunx vercel --prod
```

Preview 배포도 쓴다면 같은 두 변수를 Preview 환경에도 등록합니다. Vite 환경 변수는 **빌드 시점에 반영**되므로 변경 후 다시 빌드/배포해야 합니다. `bun.lock`, `vercel.json`으로 정적 Vite 앱을 배포하며 API 함수는 없습니다. 채팅방 URL의 직접 접속과 새로고침은 SPA rewrite로 처리합니다.

## 주요 파일

- `src/pages/`: 목록과 채팅방 화면
- `src/components/`: 방 생성 모달 및 비동기 메시지 입력
- `src/lib/supabaseRoom.ts`: 환경 설정 확인, WebSocket 연결·송수신·구독 정리
- `src/lib/messages.ts`: 수신 데이터 검사와 중복 제거
- `src/lib/roomLinks.ts`: 초대 URL 생성·검증
