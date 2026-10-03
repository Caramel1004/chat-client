import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MessageComposer } from './MessageComposer'

function deferred() {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('비동기 메시지 전송', () => {
  it('전송 확인을 기다리는 동안 초안을 유지하고 중복 전송을 막는다', async () => {
    const pending = deferred()
    const onSend = vi.fn(() => pending.promise)
    render(<MessageComposer onSend={onSend} />)
    const input = screen.getByRole('textbox', { name: '메시지' })
    fireEvent.change(input, { target: { value: '  안녕하세요  ' } })

    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    expect(onSend).toHaveBeenCalledExactlyOnceWith('안녕하세요')
    expect(input).toHaveValue('  안녕하세요  ')
    expect(input).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeDisabled()

    await act(async () => { pending.resolve() })
    expect(input).toHaveValue('')
    expect(input).not.toHaveAttribute('readonly')
    expect(input).toHaveFocus()
  })

  it('전송이 실패하면 초안과 오류 안내를 남기고 사용자가 재시도할 수 있다', async () => {
    const user = userEvent.setup()
    const pending = deferred()
    const onSend = vi.fn<() => void | Promise<void>>()
      .mockReturnValueOnce(pending.promise)
      .mockReturnValueOnce(undefined)
    render(<MessageComposer onSend={onSend} />)
    const input = screen.getByRole('textbox', { name: '메시지' })
    await user.type(input, '남겨 둘 초안{Enter}')
    await act(async () => { pending.reject(new Error('connection lost')) })

    expect(input).toHaveValue('남겨 둘 초안')
    expect(screen.getByRole('alert')).toHaveTextContent(/전송.*실패/)
    expect(input).toHaveAccessibleDescription(/전송.*실패/)
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(onSend).toHaveBeenCalledTimes(2)
    expect(input).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('전송 함수의 동기 오류도 초안을 지우지 않고 안내한다', () => {
    render(<MessageComposer onSend={() => { throw new Error('not connected') }} />)
    const input = screen.getByRole('textbox', { name: '메시지' })
    fireEvent.change(input, { target: { value: '오류가 나도 유지' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('오류가 나도 유지')
    expect(screen.getByRole('alert')).toHaveTextContent(/전송.*실패/)
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeEnabled()
  })

  it('연결되지 않았을 때도 초안을 작성할 수 있고 연결 후 전송한다', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { rerender } = render(<MessageComposer onSend={onSend} disabled />)
    const input = screen.getByRole('textbox', { name: '메시지' })
    await user.type(input, '연결 대기 중{Enter}')
    expect(input).toHaveValue('연결 대기 중')
    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeDisabled()

    rerender(<MessageComposer onSend={onSend} />)
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledExactlyOnceWith('연결 대기 중')
    expect(input).toHaveValue('')
  })
})
