import { useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

export function MessageComposer({ onSend, disabled = false }: {
  onSend: (text: string) => void | Promise<void>
  disabled?: boolean
}) {
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const inFlight = useRef(false)
  const composing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)

  function finish(succeeded: boolean) {
    inFlight.current = false
    setPending(false)
    setFailed(!succeeded)
    if (succeeded) {
      setDraft('')
      input.current?.focus()
    }
  }

  function send() {
    const text = draft.trim()
    if (!text || composing.current || disabled || inFlight.current) return
    inFlight.current = true
    setFailed(false)
    try {
      const result = onSend(text)
      if (result) {
        setPending(true)
        void result.then(() => finish(true), () => finish(false))
      } else {
        finish(true)
      }
    } catch {
      finish(false)
    }
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
    <form onSubmit={handleSubmit} aria-busy={pending} className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <label htmlFor={inputId} className="sr-only">메시지</label>
      <div className="flex items-end gap-3 rounded-xl border border-slate-300 bg-slate-50 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea id={inputId} ref={input} value={draft} onChange={event => setDraft(event.target.value)}
          onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }}
          onKeyDown={handleKeyDown} rows={2} maxLength={2000} readOnly={pending}
          aria-describedby={failed ? `${inputId}-hint ${inputId}-error` : `${inputId}-hint`}
          placeholder="메시지를 입력해 주세요"
          className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-slate-500" />
        <button type="submit" disabled={!draft.trim() || disabled || pending} aria-label="메시지 보내기"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19 0-14m-6 6 6-6 6 6" />
          </svg>
        </button>
      </div>
      {failed && <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-red-700">메시지 전송 확인에 실패했습니다. 대화에 표시되었는지 확인한 뒤 다시 보내 주세요.</p>}
      <p id={`${inputId}-hint`} className="mt-2 text-xs leading-5 text-slate-500">{pending ? '전송 확인 중…' : 'Enter로 전송 · Shift+Enter로 줄바꿈 · 최대 2,000자'}</p>
    </form>
  )
}
