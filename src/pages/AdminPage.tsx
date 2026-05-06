import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'
import { useAuth } from '../contexts/AuthContext'
import { createEvent, subscribeEvents } from '../services/firestore'
import type { ShuffleEvent } from '../types/domain'

export function AdminPage() {
  const { profile } = useAuth()
  const [title, setTitle] = useState('')
  const [roundMinutes, setRoundMinutes] = useState(10)
  const [totalRounds, setTotalRounds] = useState(4)
  const [events, setEvents] = useState<ShuffleEvent[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeEvents(setEvents)
    return unsubscribe
  }, [])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || !title.trim()) return
    setSaving(true)
    try {
      await createEvent({
        title,
        roundMinutes,
        totalRounds,
        createdBy: profile.uid,
      })
      setTitle('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell title="관리자 모드">
      <div className="space-y-3">
        <Link to="/lobby" className="inline-block text-xs text-gray-600 underline">
          로비로 돌아가기
        </Link>
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">현장 이벤트 방 만들기</h2>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 일산 웨돔 테스트"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-gray-600">
              <span>라운드 시간(분)</span>
              <input
                type="number"
                min={1}
                value={roundMinutes}
                onChange={(event) => setRoundMinutes(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-gray-600">
              <span>총 라운드</span>
              <input
                type="number"
                min={1}
                value={totalRounds}
                onChange={(event) => setTotalRounds(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? '생성 중...' : '이벤트 생성'}
          </button>
        </form>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">최근 이벤트</h3>
          {events.length === 0 ? (
            <p className="text-xs text-gray-500">아직 생성된 이벤트가 없습니다.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                {event.title} · 상태 {event.status} · 참가자 {event.participants.length}명
              </div>
            ))
          )}
        </section>
      </div>
    </MobileShell>
  )
}
