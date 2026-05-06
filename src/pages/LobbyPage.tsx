import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'
import { useAuth } from '../contexts/AuthContext'
import { checkInEvent, subscribeEvents } from '../services/firestore'
import type { ShuffleEvent } from '../types/domain'

export function LobbyPage() {
  const { profile, signOutUser } = useAuth()
  const [events, setEvents] = useState<ShuffleEvent[]>([])
  const [tapCount, setTapCount] = useState(0)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [nowMs, setNowMs] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeEvents(setEvents)
    return unsubscribe
  }, [])

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      setNowMs(Date.now())
    }, 0)
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 250)
    return () => {
      window.clearTimeout(kickoff)
      window.clearInterval(timer)
    }
  }, [])

  const handleCheckIn = async (eventId: string) => {
    if (!profile) return
    setSelectedEventId(eventId)
    try {
      await checkInEvent(eventId, profile.uid)
    } finally {
      setSelectedEventId('')
    }
  }

  const handleTitleTap = () => {
    const next = tapCount + 1
    if (next >= 5 && profile?.role === 'admin') {
      setTapCount(0)
      navigate('/admin')
      return
    }
    setTapCount(next)
  }

  const getRemainingSeconds = (event: ShuffleEvent) => {
    if (nowMs <= 0) return null

    if (event.roundEndsAt) {
      return Math.max(0, Math.ceil((new Date(event.roundEndsAt).getTime() - nowMs) / 1000))
    }

    // 이전 버전에서 생성된 이벤트(roundEndsAt 누락)도 타이머가 흐르도록 createdAt 기반 fallback 계산
    if (event.createdAt) {
      const fallbackEndsAt = new Date(event.createdAt).getTime() + event.roundMinutes * 60 * 1000
      return Math.max(0, Math.ceil((fallbackEndsAt - nowMs) / 1000))
    }

    return null
  }

  const formatTimer = (seconds: number) => {
    const minute = String(Math.floor(seconds / 60)).padStart(2, '0')
    const second = String(seconds % 60).padStart(2, '0')
    return `${minute}:${second}`
  }

  return (
    <MobileShell
      title="로비"
      rightSlot={
        <button
          type="button"
          onClick={signOutUser}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
        >
          로그아웃
        </button>
      }
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleTitleTap}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-base text-gray-700"
        >
          안녕하세요, {profile?.nickname ?? '게스트'}님
          <p className="mt-1 text-sm text-gray-500">체크인 가능한 이벤트를 선택하세요.</p>
        </button>

        <Link
          to="/fishbowl"
          className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
        >
          내 어장 보기
        </Link>
        {profile?.role === 'admin' ? (
          <Link
            to="/admin"
            className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900"
          >
            관리자 페이지 이동
          </Link>
        ) : null}

        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            현재 오픈된 이벤트가 없습니다.
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
              {(() => {
                const left = getRemainingSeconds(event)
                const warning = (left ?? 0) > 0 && (left ?? 0) <= 60
                return (
                  <p
                    className={`rounded-md border px-2 py-1 text-center text-sm font-medium ${
                      warning ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    {left === null ? '시간 동기화 중...' : left > 0 ? `남은 시간 ${formatTimer(left)}` : '라운드 종료'}
                  </p>
                )
              })()}
              <h2 className="text-base font-semibold text-gray-900">{event.title}</h2>
              <p className="text-sm text-gray-700">
                라운드 {event.currentRound}/{event.totalRounds} · {event.roundMinutes}분 · 참가자{' '}
                <span className="font-semibold text-gray-900">{event.participants.length}명</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={selectedEventId === event.id}
                  onClick={() => handleCheckIn(event.id)}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {selectedEventId === event.id ? '체크인 중...' : '체크인'}
                </button>
                <Link
                  to={`/chat/${event.id}-round-0`}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                >
                  테스트 채팅방
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </MobileShell>
  )
}
