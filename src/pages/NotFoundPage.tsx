import { Link } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'

export function NotFoundPage() {
  return (
    <MobileShell title="페이지 없음">
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
        <Link to="/lobby" className="text-xs text-gray-500 underline">
          로비로 이동
        </Link>
      </div>
    </MobileShell>
  )
}
