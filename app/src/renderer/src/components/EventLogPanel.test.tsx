import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import EventLogPanel from './EventLogPanel'
import type { RemoteEvent } from '../events'

const events: RemoteEvent[] = [
  { id: 1, time: 0, kind: 'device-new', label: 'iPhone', address: '192.168.1.5' },
  { id: 2, time: 0, kind: 'move', origin: 'remote', from: 'e2', to: 'e4' }
]

describe('EventLogPanel', () => {
  it('shows an empty state', () => {
    const { getByText } = render(<EventLogPanel events={[]} />)

    expect(getByText('Событий пока нет')).toBeInTheDocument()
  })

  it('renders events newest first', () => {
    const { container, getByText } = render(<EventLogPanel events={events} />)

    expect(getByText(/Новое устройство: iPhone/)).toBeInTheDocument()
    expect(getByText(/Ход с телефона: e2 → e4/)).toBeInTheDocument()
    expect(container.querySelectorAll('.event-item')[0]).toHaveTextContent('Ход с телефона')
  })
})
