const BUBBLES = [
  { side: 'right', w: 'w-48' },
  { side: 'left',  w: 'w-64' },
  { side: 'left',  w: 'w-56' },
  { side: 'right', w: 'w-36' },
] as const

export function ConversationSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="shrink-0 h-[45px] border-b"
        style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.07)' }}
      />
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-3">
        {BUBBLES.map((b, i) => (
          <div key={i} className={`flex ${b.side === 'right' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`${b.w} h-10 rounded-2xl animate-pulse`}
              style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.06)' }}
            />
          </div>
        ))}
      </div>
      <div
        className="shrink-0 h-[68px] border-t"
        style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.07)' }}
      />
    </div>
  )
}
