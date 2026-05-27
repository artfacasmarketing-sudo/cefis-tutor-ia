import { useRef, useState, useEffect, useCallback } from 'react'

const THRESHOLD = 80

export function useSmartScroll(deps: unknown[], messageCount?: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const isAtBottomRef = useRef(true)
  const prevMsgCountRef = useRef(messageCount ?? 0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const atBottom = scrollHeight - scrollTop - clientHeight < THRESHOLD
      isAtBottomRef.current = atBottom
      setIsAtBottom(atBottom)
      if (atBottom) setUnreadCount(0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const newCount = messageCount ?? 0
    const hasNewMsg = newCount > prevMsgCountRef.current
    prevMsgCountRef.current = newCount

    if (isAtBottomRef.current) {
      const el = containerRef.current
      if (el) el.scrollTop = el.scrollHeight
      setUnreadCount(0)
    } else if (hasNewMsg) {
      setUnreadCount(c => c + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setIsAtBottom(true)
    setUnreadCount(0)
  }, [])

  return { containerRef, isAtBottom, scrollToBottom, unreadCount }
}
