import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'
import { useAuth } from '../contexts/AuthContext'
import {
  ensureRoomRoundTimer,
  getEventById,
  getUserNicknamesByUids,
  lockChatRoom,
  reportUser,
  sendChatMessage,
  subscribeChatRoomMeta,
  submitRoundChoice,
  subscribeMessages,
  subscribeRoundChoices,
} from '../services/firestore'
import { getDisplayNickname, getUserBadge } from '../utils/chatDisplay'

type Message = { id: string; senderUid: string; text: string; type: 'system' | 'user' }

export function ChatPage() {
  const { roomId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [roundMinutes, setRoundMinutes] = useState(10)
  const [isLocked, setIsLocked] = useState(false)
  const [roundEndsAtMs, setRoundEndsAtMs] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(0)
  const [choice, setChoice] = useState<'yes' | 'no' | ''>('')
  const [choices, setChoices] = useState<{ uid: string; choice: 'yes' | 'no' }[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({})

  const roomMeta = useMemo(() => {
    if (!roomId) return null
    const matched = roomId.match(/^(.*)-round-(\d+)$/)
    if (!matched) return null
    return {
      eventId: matched[1],
      roundNo: Number(matched[2]) + 1,
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    const unsubscribe = subscribeMessages(roomId, setMessages)
    return unsubscribe
  }, [roomId])

  useEffect(() => {
    if (!roomMeta) return
    void getEventById(roomMeta.eventId).then((event) => {
      setEventTitle(event?.title ?? '')
      setRoundMinutes(event?.roundMinutes ?? 10)
    })
  }, [roomMeta])

  useEffect(() => {
    const senderUids = Array.from(new Set(messages.map((message) => message.senderUid).filter(Boolean)))
    if (senderUids.length === 0) return
    void getUserNicknamesByUids(senderUids).then((map) => setNicknameMap(map))
  }, [messages])

  useEffect(() => {
    if (!roomId) return
    void ensureRoomRoundTimer(roomId, roundMinutes)
    const unsubscribe = subscribeChatRoomMeta(roomId, (meta) => {
      setNowMs(Date.now())
      setRoundEndsAtMs(meta.roundEndsAtMs)
      setIsLocked(meta.isLocked)
    })
    return unsubscribe
  }, [roomId, roundMinutes])

  useEffect(() => {
    if (!roomId || !roundEndsAtMs) return
    const timer = window.setInterval(() => {
      const now = Date.now()
      setNowMs(now)
      const nextSeconds = Math.max(0, Math.ceil((roundEndsAtMs - now) / 1000))
      if (nextSeconds === 0 && !isLocked) {
        void lockChatRoom(roomId)
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isLocked, roomId, roundEndsAtMs])

  useEffect(() => {
    if (!roomId) return
    const unsubscribe = subscribeRoundChoices(roomId, setChoices)
    return unsubscribe
  }, [roomId])

  useEffect(() => {
    if (!roomId || !isLocked) return
    void lockChatRoom(roomId)
  }, [isLocked, roomId])

  const secondsLeft = roundEndsAtMs
    ? Math.max(0, Math.ceil((roundEndsAtMs - nowMs) / 1000))
    : roundMinutes * 60

  const effectiveLocked = isLocked || secondsLeft <= 0
  const isWarning = secondsLeft > 0 && secondsLeft <= 60
  const timerLabel = useMemo(() => {
    const minute = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
    const second = String(secondsLeft % 60).padStart(2, '0')
    return `${minute}:${second}`
  }, [secondsLeft])

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!roomId || !profile || !text.trim() || effectiveLocked) return
    setSubmitting(true)
    try {
      await sendChatMessage(roomId, profile.uid, text)
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!roomId || !profile) return
    await reportUser({
      reporterUid: profile.uid,
      targetUid: 'unknown',
      roomId,
      reason: 'test-report',
    })
    alert('신고가 접수되었습니다.')
  }

  const handleChoice = async (nextChoice: 'yes' | 'no') => {
    if (!roomId || !profile) return
    setChoice(nextChoice)
    await submitRoundChoice({ roomId, uid: profile.uid, choice: nextChoice })
  }

  const moveNextRound = () => {
    if (!roomId) return
    const matched = roomId.match(/^(.*)-round-(\d+)$/)
    if (!matched) {
      navigate('/lobby')
      return
    }
    const eventId = matched[1]
    const currentRound = Number(matched[2])
    const nextRound = currentRound + 1
    navigate(`/chat/${eventId}-round-${nextRound}`)
  }

  const bothAnswered = choices.length >= 2
  const roomTitle = roomMeta
    ? `${eventTitle || '셔플챗'} · ${roomMeta.roundNo}라운드`
    : '채팅방'

  useEffect(() => {
    if (!effectiveLocked || !bothAnswered || !roomId) return

    const timer = window.setTimeout(() => {
      const matched = roomId.match(/^(.*)-round-(\d+)$/)
      if (!matched) {
        navigate('/lobby')
        return
      }
      const eventId = matched[1]
      const currentRound = Number(matched[2])
      const nextRound = currentRound + 1
      navigate(`/chat/${eventId}-round-${nextRound}`)
    }, 800)

    return () => window.clearTimeout(timer)
  }, [bothAnswered, effectiveLocked, navigate, roomId])

  return (
    <MobileShell
      title={roomTitle}
      rightSlot={
        <button
          type="button"
          onClick={handleReport}
          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
        >
          신고
        </button>
      }
    >
      <div className="flex h-full flex-col gap-3">
        <div
          className={`rounded-lg border px-3 py-2 text-center text-xs ${
            isWarning ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-600'
          }`}
        >
          남은 시간 {timerLabel}
          {isWarning ? ' · 곧 대화가 종료됩니다.' : ''}
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.type === 'system'
                  ? 'mx-auto bg-gray-100 text-gray-600'
                  : message.senderUid === profile?.uid
                    ? 'ml-auto bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.type === 'user' ? (
                <p
                  className={`mb-1 text-[11px] font-medium ${
                    message.senderUid === profile?.uid ? 'text-gray-200' : 'text-gray-500'
                  }`}
                >
                  {getUserBadge(message.senderUid)}{' '}
                  {message.senderUid === profile?.uid
                    ? '나'
                    : getDisplayNickname(nicknameMap[message.senderUid], message.senderUid)}
                </p>
              ) : null}
              {message.text}
            </div>
          ))}
        </div>
        {effectiveLocked ? (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-sm font-medium text-gray-900">라운드가 종료되었습니다. 이 사람을 어장에 추가할까요?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChoice('yes')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  choice === 'yes' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                예
              </button>
              <button
                type="button"
                onClick={() => handleChoice('no')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  choice === 'no' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                아니오
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {bothAnswered
                ? '상호 선택 완료. 다음 라운드로 자동 이동합니다...'
                : choice
                  ? '내 선택 저장 완료. 상대방 선택을 기다리는 중...'
                  : '선택 후 다음 라운드로 이동할 수 있습니다.'}
            </p>
            {bothAnswered ? (
              <button
                type="button"
                onClick={moveNextRound}
                className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
              >
                지금 이동
              </button>
            ) : null}
          </div>
        ) : null}
        <form onSubmit={handleSend} className="space-y-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={effectiveLocked}
            placeholder={effectiveLocked ? '라운드 종료로 입력이 잠겼습니다.' : '텍스트만 입력 가능합니다.'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
          <div className="flex items-center justify-between">
            <Link to="/lobby" className="text-xs text-gray-500 underline">
              로비로 이동
            </Link>
            <button
              type="submit"
              disabled={!text.trim() || submitting || effectiveLocked}
              className="rounded-md bg-gray-900 px-4 py-2 text-xs text-white disabled:opacity-50"
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </MobileShell>
  )
}
