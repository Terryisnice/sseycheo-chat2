import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  Timestamp,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { adminUidSet, db } from '../lib/firebase'
import type { AppUser, ShuffleEvent } from '../types/domain'

function ensureDb() {
  if (!db) {
    throw new Error('Firestore is not configured. Check Firebase .env values.')
  }
  return db
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!db) return null
  const ref = doc(db, 'users', uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  const expectedRole = adminUidSet.has(uid) ? 'admin' : 'user'
  const currentRole = data.role ?? 'user'
  if (currentRole !== expectedRole) {
    await updateDoc(ref, { role: expectedRole })
  }

  return {
    uid,
    nickname: data.nickname ?? '',
    role: expectedRole,
    isBlocked: Boolean(data.isBlocked),
    createdAt: data.createdAt?.toDate?.()?.toISOString(),
  }
}

export async function upsertUserProfile(user: Pick<AppUser, 'uid' | 'nickname'>) {
  const firestore = ensureDb()
  const ref = doc(firestore, 'users', user.uid)
  const role = adminUidSet.has(user.uid) ? 'admin' : 'user'
  await setDoc(
    ref,
    {
      nickname: user.nickname.trim(),
      role,
      isBlocked: false,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function createEvent(payload: {
  title: string
  roundMinutes: number
  totalRounds: number
  createdBy: string
}) {
  const firestore = ensureDb()
  const ref = collection(firestore, 'events')
  const roundEndsAt = Timestamp.fromMillis(Date.now() + payload.roundMinutes * 60 * 1000)
  await addDoc(ref, {
    title: payload.title.trim(),
    status: 'open',
    currentRound: 0,
    roundMinutes: payload.roundMinutes,
    roundEndsAt,
    totalRounds: payload.totalRounds,
    participants: [],
    createdBy: payload.createdBy,
    createdAt: serverTimestamp(),
  })
}

export async function checkInEvent(eventId: string, uid: string) {
  const firestore = ensureDb()
  const ref = doc(firestore, 'events', eventId)
  await updateDoc(ref, {
    participants: arrayUnion(uid),
  })
}

export function subscribeEvents(callback: (events: ShuffleEvent[]) => void) {
  if (!db) {
    callback([])
    return () => undefined
  }
  const ref = collection(db, 'events')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((item) => {
      const data = item.data()
      return {
        id: item.id,
        title: data.title ?? 'Untitled event',
        status: data.status ?? 'draft',
        currentRound: data.currentRound ?? 0,
        totalRounds: data.totalRounds ?? 4,
        roundMinutes: data.roundMinutes ?? 10,
        roundEndsAt: data.roundEndsAt?.toDate?.()?.toISOString(),
        participants: data.participants ?? [],
        createdBy: data.createdBy ?? '',
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
      } satisfies ShuffleEvent
    })
    callback(events)
  })
}

export async function fetchEvents(): Promise<ShuffleEvent[]> {
  if (!db) return []
  const ref = collection(db, 'events')
  const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')))
  return snapshot.docs.map((item) => {
    const data = item.data()
    return {
      id: item.id,
      title: data.title ?? 'Untitled event',
      status: data.status ?? 'draft',
      currentRound: data.currentRound ?? 0,
      totalRounds: data.totalRounds ?? 4,
      roundMinutes: data.roundMinutes ?? 10,
      roundEndsAt: data.roundEndsAt?.toDate?.()?.toISOString(),
      participants: data.participants ?? [],
      createdBy: data.createdBy ?? '',
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
    } satisfies ShuffleEvent
  })
}

export async function getEventById(eventId: string): Promise<ShuffleEvent | null> {
  if (!db) return null
  const ref = doc(db, 'events', eventId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    id: snapshot.id,
    title: data.title ?? 'Untitled event',
    status: data.status ?? 'draft',
    currentRound: data.currentRound ?? 0,
    totalRounds: data.totalRounds ?? 4,
    roundMinutes: data.roundMinutes ?? 10,
    roundEndsAt: data.roundEndsAt?.toDate?.()?.toISOString(),
    participants: data.participants ?? [],
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt?.toDate?.()?.toISOString(),
  } satisfies ShuffleEvent
}

export async function getUserNicknamesByUids(uids: string[]) {
  const result: Record<string, string> = {}
  await Promise.all(
    uids.map(async (uid) => {
      const profile = await getUserProfile(uid)
      result[uid] = profile?.nickname?.trim() ?? ''
    }),
  )
  return result
}

export async function sendChatMessage(roomId: string, senderUid: string, text: string) {
  const firestore = ensureDb()
  const roomRef = doc(firestore, 'chatRooms', roomId)
  await setDoc(
    roomRef,
    {
      isLocked: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  const ref = collection(firestore, 'chatRooms', roomId, 'messages')
  await addDoc(ref, {
    senderUid,
    text: text.trim(),
    type: 'user',
    createdAt: serverTimestamp(),
  })
}

export async function ensureRoomRoundTimer(roomId: string, roundMinutes: number) {
  const firestore = ensureDb()
  const roomRef = doc(firestore, 'chatRooms', roomId)
  const snapshot = await getDoc(roomRef)
  const existingEndsAt = snapshot.exists() ? (snapshot.data().roundEndsAt as Timestamp | undefined) : undefined
  const endsAt = existingEndsAt ?? Timestamp.fromMillis(Date.now() + roundMinutes * 60 * 1000)

  if (!existingEndsAt) {
    await setDoc(
      roomRef,
      {
        isLocked: false,
        roundEndsAt: endsAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  // 로비 카드와 채팅방 타이머 기준을 맞추기 위해 event roundEndsAt을 동기화한다.
  const matched = roomId.match(/^(.*)-round-(\d+)$/)
  if (matched) {
    const eventId = matched[1]
    const roundNo = Number(matched[2])
    const eventRef = doc(firestore, 'events', eventId)
    await setDoc(
      eventRef,
      {
        currentRound: roundNo,
        roundEndsAt: endsAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
}

export function subscribeChatRoomMeta(
  roomId: string,
  callback: (meta: { isLocked: boolean; roundEndsAtMs: number | null }) => void,
) {
  if (!db) {
    callback({ isLocked: false, roundEndsAtMs: null })
    return () => undefined
  }

  const roomRef = doc(db, 'chatRooms', roomId)
  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback({ isLocked: false, roundEndsAtMs: null })
      return
    }
    const data = snapshot.data()
    callback({
      isLocked: Boolean(data.isLocked),
      roundEndsAtMs: data.roundEndsAt?.toMillis?.() ?? null,
    })
  })
}

export async function lockChatRoom(roomId: string) {
  const firestore = ensureDb()
  const roomRef = doc(firestore, 'chatRooms', roomId)
  await setDoc(
    roomRef,
    {
      isLocked: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function submitRoundChoice(payload: {
  roomId: string
  uid: string
  choice: 'yes' | 'no'
}) {
  const firestore = ensureDb()
  const ref = doc(firestore, 'roundChoices', `${payload.roomId}_${payload.uid}`)
  await setDoc(
    ref,
    {
      roomId: payload.roomId,
      uid: payload.uid,
      choice: payload.choice,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeRoundChoices(
  roomId: string,
  callback: (items: { uid: string; choice: 'yes' | 'no' }[]) => void,
) {
  if (!db) {
    callback([])
    return () => undefined
  }
  const ref = collection(db, 'roundChoices')
  const q = query(ref)
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs
      .map((item) => item.data())
      .filter((item) => item.roomId === roomId)
      .map((item) => ({
        uid: item.uid ?? '',
        choice: (item.choice === 'yes' ? 'yes' : 'no') as 'yes' | 'no',
      }))
    callback(items)
  })
}

export function subscribeMessages(
  roomId: string,
  callback: (messages: { id: string; senderUid: string; text: string; type: 'system' | 'user' }[]) => void,
) {
  if (!db) {
    callback([])
    return () => undefined
  }
  const ref = collection(db, 'chatRooms', roomId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((item) => {
        const data = item.data()
        return {
          id: item.id,
          senderUid: data.senderUid ?? '',
          text: data.text ?? '',
          type: data.type === 'system' ? 'system' : 'user',
        }
      }),
    )
  })
}

export async function reportUser(payload: {
  reporterUid: string
  targetUid: string
  eventId?: string
  roomId: string
  reason: string
}) {
  const firestore = ensureDb()
  const ref = collection(firestore, 'reports')
  await addDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
  })
}
