import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Room } from '../types/chat'

interface CreateRoomModalProps {
  onClose: () => void
  onCreate: (details: Omit<Room, 'id'>) => void
}

export function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    dialog.current?.showModal()
    nameInput.current?.focus()
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onCreate({ name: trimmedName, description: description.trim() })
    dialog.current?.close()
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="create-room-title" aria-describedby="create-room-description"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm">
      <form onSubmit={submit} className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-room-title" className="text-xl font-bold">채팅방 만들기</h2>
            <p id="create-room-description" className="mt-2 text-sm leading-6 text-slate-600">어떤 이야기를 나누고 싶으세요?<br />새로운 대화의 공간을 만들어 보세요.</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="닫기"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100">×</button>
        </div>

        <div className="mt-7">
          <label htmlFor="room-name" className="block text-sm font-semibold">방 이름 <span className="font-normal text-slate-500">(필수)</span></label>
          <input id="room-name" ref={nameInput} required maxLength={40} value={name} onChange={event => setName(event.target.value)}
            aria-describedby="room-name-hint" placeholder="예: 오늘의 이야기"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          <p id="room-name-hint" className="mt-1.5 text-xs text-slate-500">최대 40자</p>
        </div>
        <div className="mt-5">
          <label htmlFor="room-description" className="block text-sm font-semibold">설명 <span className="font-normal text-slate-500">(선택)</span></label>
          <textarea id="room-description" rows={3} maxLength={120} value={description} onChange={event => setDescription(event.target.value)}
            aria-describedby="room-description-hint" placeholder="채팅방에서 나눌 이야기를 소개해 주세요."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base leading-6 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          <p id="room-description-hint" className="mt-1.5 text-xs text-slate-500">최대 120자</p>
        </div>

        <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">방을 만든 뒤 초대 링크를 공유해 함께 입장할 수 있어요. 대화 기록은 저장하지 않습니다.</p>
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">취소</button>
          <button type="submit" disabled={!name.trim()} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">만들기</button>
        </div>
      </form>
    </dialog>
  )
}
