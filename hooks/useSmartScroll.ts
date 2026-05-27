import { useRef, useState, useEffect, useCallback } from 'react'

const THRESHOLD = 80

export function useSmartScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < THRESHOLD)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isAtBottom) return
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setIsAtBottom(true)
  }, [])

  return { containerRef, isAtBottom, scrollToBottom }
}
