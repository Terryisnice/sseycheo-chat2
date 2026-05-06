import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'
import { useAuth } from '../contexts/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/lobby', { replace: true })
    } catch (err) {
      setError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MobileShell title="스쳐챗">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm leading-6 text-gray-700">
          4라운드 셔플챗 테스트에 참여하려면 소셜 로그인으로 인증해주세요.
        </p>
        {!isFirebaseConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Firebase 환경변수가 설정되지 않았습니다. 프로젝트 루트에 `.env`를 만들고 `.env.example` 값을 채워주세요.
          </div>
        ) : null}
        <button
          type="button"
          disabled={loading || !isFirebaseConfigured}
          onClick={handleSignIn}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? '로그인 중...' : 'Google로 로그인'}
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </MobileShell>
  )
}
