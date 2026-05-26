'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ease = [0.25, 0.1, 0.25, 1] as const

const itemVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
}

interface Props {
  children: ReactNode
  className?: string
  delay?: number
}

export function Stagger({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeUp({ children, className }: Props) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({
  children,
  className,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({
  children,
  className,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export { containerVariants, itemVariants }
