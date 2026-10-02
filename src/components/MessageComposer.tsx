import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

export function MessageComposer({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  const composing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)

  function send() {
    const text = draft.trim()
    if (!text || composing.current) return
    onSend(text)
    setDraft('')
    input.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    send()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    send()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <label htmlFor="message" className="sr-only">메시지</label>
      <div className="flex items-end gap-3 rounded-xl border border-slate-300 bg-slate-50 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea id="message" ref={input} value={draft} onChange={event => setDraft(event.target.value)}
          onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }}
          onKeyDown={handleKeyDown} rows={2} maxLength={2000} aria-describedby="message-hint"
          placeholder="메시지를 입력해 주세요"
          className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-slate-500" />
        <button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19 0-14m-6 6 6-6 6 6" />
          </svg>
        </button>
      </div>
      <p id="message-hint" className="mt-2 text-xs leading-5 text-slate-500">Enter로 전송 · Shift+Enter로 줄바꿈 · 최대 2,000자</p>
    </form>
  )
}
