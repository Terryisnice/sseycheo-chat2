import { Link } from 'react-router-dom'
import { MobileShell } from '../components/MobileShell'

const mockItems = [
  { uid: 'u1', nickname: '새벽러너', metAt: '2026-04-22', memo: '대화 템포가 잘 맞음' },
  { uid: 'u2', nickname: '라떼한잔', metAt: '2026-04-22', memo: '다음 행사에서 다시 이야기해보기' },
]

export function FishbowlPage() {
  return (
    <MobileShell title="어장">
      <div className="space-y-3">
        <Link to="/lobby" className="inline-block text-xs text-gray-600 underline">
          로비로 돌아가기
        </Link>
        <p className="text-xs text-gray-500">MVP 단계에서는 카드별 비밀 메모를 우선 지원합니다.</p>
        {mockItems.map((item) => (
          <article key={item.uid} className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">{item.nickname}</h2>
            <p className="text-xs text-gray-500">만남 날짜: {item.metAt}</p>
            <textarea
              defaultValue={item.memo}
              className="min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </article>
        ))}
      </div>
    </MobileShell>
  )
}
