import * as React from "react"
import { CountUp } from "countup.js"

export interface UseCountUpOptions {
  start?: number
  end: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  decimal?: string
  useEasing?: boolean
  useGrouping?: boolean
  smartEasingThreshold?: number
  smartEasingAmount?: number
  enableScrollSpy?: boolean
  scrollSpyDelay?: number
  scrollSpyOnce?: boolean
}

export interface UseCountUpReturn<T> {
  countUpRef: React.RefObject<T | null>
  start: () => void
  pauseResume: () => void
  reset: () => void
  update: (newEndVal: number) => void
}

export function useCountUp<T extends HTMLElement>(options: UseCountUpOptions): UseCountUpReturn<T> {
  const countUpRef = React.useRef<T | null>(null)
  const countUpInstance = React.useRef<CountUp | null>(null)

  const {
    start = 0,
    end,
    duration = 2,
    decimals = 0,
    prefix = "",
    suffix = "",
    separator = ",",
    decimal = ".",
    useEasing = true,
    useGrouping = true,
    smartEasingThreshold = 999,
    smartEasingAmount = 333,
    enableScrollSpy = false,
    scrollSpyDelay = 200,
    scrollSpyOnce = false,
  } = options

  React.useEffect(() => {
    if (!countUpRef.current) return

    const countUpOptions = {
      startVal: start,
      decimalPlaces: decimals,
      duration,
      useEasing,
      useGrouping,
      separator,
      decimal,
      prefix,
      suffix,
      smartEasingThreshold,
      smartEasingAmount,
      enableScrollSpy,
      scrollSpyDelay,
      scrollSpyOnce,
    }

    countUpInstance.current = new CountUp(countUpRef.current, end, countUpOptions)

    if (!countUpInstance.current.error) {
      if (enableScrollSpy) {
        // CountUp will automatically start when element comes into view
      } else {
        countUpInstance.current.start()
      }
    } else {
      console.error("CountUp error:", countUpInstance.current.error)
    }

    return () => {
      if (countUpInstance.current) {
        countUpInstance.current.reset()
      }
    }
  }, [
    end,
    start,
    duration,
    decimals,
    prefix,
    suffix,
    separator,
    decimal,
    useEasing,
    useGrouping,
    smartEasingThreshold,
    smartEasingAmount,
    enableScrollSpy,
    scrollSpyDelay,
    scrollSpyOnce,
  ])

  const startAnimation = React.useCallback(() => {
    if (countUpInstance.current && !countUpInstance.current.error) {
      countUpInstance.current.start()
    }
  }, [])

  const pauseResumeAnimation = React.useCallback(() => {
    if (countUpInstance.current && !countUpInstance.current.error) {
      countUpInstance.current.pauseResume()
    }
  }, [])

  const resetAnimation = React.useCallback(() => {
    if (countUpInstance.current && !countUpInstance.current.error) {
      countUpInstance.current.reset()
    }
  }, [])

  const updateAnimation = React.useCallback((newEndVal: number) => {
    if (countUpInstance.current && !countUpInstance.current.error) {
      countUpInstance.current.update(newEndVal)
    }
  }, [])

  return {
    countUpRef,
    start: startAnimation,
    pauseResume: pauseResumeAnimation,
    reset: resetAnimation,
    update: updateAnimation,
  }
} 