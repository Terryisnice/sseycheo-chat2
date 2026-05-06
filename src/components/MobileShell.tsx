import type { ReactNode } from 'react'

type MobileShellProps = {
  title: string
  rightSlot?: ReactNode
  children: ReactNode
}

export function MobileShell({ title, rightSlot, children }: MobileShellProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <div>{rightSlot}</div>
      </header>
      <section className="flex-1 bg-gray-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </section>
    </main>
  )
}
