import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'
import { useAuth } from '../contexts/AuthContext'
import { upsertUserProfile } from '../services/firestore'

export function OnboardingPage() {
  const { firebaseUser, profile, refreshProfile } = useAuth()
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (profile) {
    return <Navigate to="/lobby" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await upsertUserProfile({ uid: firebaseUser.uid, nickname })
      await refreshProfile()
      navigate('/lobby', { replace: true })
    } catch (err) {
      setError('닉네임 저장에 실패했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell title="닉네임 설정">
      <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-800">익명 닉네임</span>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={12}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-gray-900 focus:ring-2"
            placeholder="예: 밤산책러"
          />
        </label>
        <p className="text-xs text-gray-500">실명/프로필 사진은 앱 내에 노출되지 않습니다.</p>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장하고 시작하기'}
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </form>
    </MobileShell>
  )
}
