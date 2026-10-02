import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderApp(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

describe('채팅 페이지', () => {
  it('채팅방 정보를 입력해 생성하고 새 방에 입장해 독립적인 대화를 한다', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '채팅방 만들기' }))
    const modal = screen.getByRole('dialog', { name: '채팅방 만들기' })
    expect(within(modal).getByRole('textbox', { name: /방 이름/ })).toHaveFocus()
    await user.type(within(modal).getByRole('textbox', { name: /방 이름/ }), '  프론트엔드 모임  ')
    await user.type(within(modal).getByRole('textbox', { name: /설명/ }), 'React 이야기를 나눠요.')
    await user.click(within(modal).getByRole('button', { name: '만들기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /프론트엔드 모임/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^프론트엔드 모임$/)
    expect(screen.getByText('React 이야기를 나눠요.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('프론트엔드 모임')
    await user.type(screen.getByRole('textbox', { name: '메시지' }), '새 방의 대화{Enter}')
    await user.click(screen.getByRole('link', { name: '채팅 목록으로' }))
    await user.click(screen.getByRole('link', { name: /라운지/ }))
    expect(within(screen.getByRole('log')).queryByText('새 방의 대화')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '채팅 목록으로' }))
    await user.click(screen.getByRole('link', { name: /프론트엔드 모임/ }))
    expect(within(screen.getByRole('log')).getByText('새 방의 대화')).toBeInTheDocument()
  })

  it('취소하면 방을 생성하지 않고 다시 열 때 입력을 초기화한다', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '채팅방 만들기' }))
    await user.type(screen.getByRole('textbox', { name: /방 이름/ }), '취소할 방')
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /취소할 방/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '채팅방 만들기' }))
    expect(screen.getByRole('textbox', { name: /방 이름/ })).toHaveValue('')
  })

  it('빈 이름과 공백 이름은 생성하지 못하고 설명 없이도 생성할 수 있다', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '채팅방 만들기' }))
    const create = screen.getByRole('button', { name: '만들기' })
    expect(create).toBeDisabled()
    const name = screen.getByRole('textbox', { name: /방 이름/ })
    await user.type(name, '   ')
    expect(create).toBeDisabled()
    await user.type(name, '새로운 방')
    await user.click(create)
    expect(screen.getByRole('link', { name: /새로운 방/ })).toBeInTheDocument()
  })

  it('목록에서 방으로 이동해 보낸 메시지를 목록을 다녀와도 유지한다', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: /라운지/ }))
    const input = screen.getByRole('textbox', { name: '메시지' })
    await user.type(input, '안녕하세요{Enter}')
    expect(within(screen.getByRole('log')).getByText('안녕하세요')).toBeInTheDocument()
    expect(input).toHaveValue('')
    await user.click(screen.getByRole('link', { name: '채팅 목록으로' }))
    await user.click(screen.getByRole('link', { name: /라운지/ }))
    expect(within(screen.getByRole('log')).getByText('안녕하세요')).toBeInTheDocument()
  })

  it('빈 메시지는 전송하지 않고 전송 버튼으로 메시지를 보낸다', async () => {
    const user = userEvent.setup()
    renderApp('/rooms/lounge')
    const input = screen.getByRole('textbox', { name: '메시지' })
    await user.type(input, '   {Enter}')
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeDisabled()
    expect(within(screen.getByRole('log')).queryAllByRole('listitem')).toHaveLength(0)
    await user.clear(input)
    await user.type(input, '버튼으로 전송')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(within(screen.getByRole('log')).getByText('버튼으로 전송')).toBeInTheDocument()
  })

  it('한글 조합 중 Enter와 IME의 keyCode 229를 전송으로 처리하지 않는다', () => {
    renderApp('/rooms/lounge')
    const input = screen.getByRole('textbox', { name: '메시지' })
    fireEvent.change(input, { target: { value: '안녕' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(within(screen.getByRole('log')).queryByText('안녕')).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(within(screen.getByRole('log')).queryByText('안녕')).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(within(screen.getByRole('log')).getByText('안녕')).toBeInTheDocument()
  })

  it('Shift+Enter는 전송하지 않고 줄바꿈을 유지한다', async () => {
    const user = userEvent.setup()
    renderApp('/rooms/lounge')
    const input = screen.getByRole('textbox', { name: '메시지' })
    await user.type(input, '첫 줄{Shift>}{Enter}{/Shift}둘째 줄')
    expect(input).toHaveValue('첫 줄\n둘째 줄')
    expect(within(screen.getByRole('log')).queryAllByRole('listitem')).toHaveLength(0)
    await user.keyboard('{Enter}')
    expect(within(screen.getByRole('log')).getByText(/첫 줄/)).toHaveTextContent('첫 줄 둘째 줄')
  })

  it('없는 방에는 입력창 대신 목록으로 돌아갈 안내를 표시한다', () => {
    renderApp('/rooms/not-a-room')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '채팅 목록으로' })).toHaveAttribute('href', '/')
  })
})
