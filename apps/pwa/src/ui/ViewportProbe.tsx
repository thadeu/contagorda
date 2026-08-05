import { useEffect, useState } from 'react'

interface Metrics {
  screen: string
  inner: string
  visual: string
  insets: string
  dvh: number
  rootBox: string
}

function read(): Metrics {
  const style = getComputedStyle(document.documentElement)
  const inset = (side: string) => style.getPropertyValue(`--probe-${side}`).trim() || '0px'
  const shell = document.querySelector('[data-probe-frame]')?.getBoundingClientRect()

  return {
    screen: `${window.screen.width}×${window.screen.height}`,
    inner: `${window.innerWidth}×${window.innerHeight}`,
    visual: window.visualViewport
      ? `${Math.round(window.visualViewport.width)}×${Math.round(window.visualViewport.height)}`
      : '—',
    insets: `${inset('top')} ${inset('right')} ${inset('bottom')} ${inset('left')}`,
    dvh: Number.parseFloat(style.getPropertyValue('--probe-dvh')) || 0,
    rootBox: shell ? `${Math.round(shell.width)}×${Math.round(shell.height)} @${Math.round(shell.top)}` : '—',
  }
}

/**
 * TEMPORARY. Reports what the viewport actually measures on the device, because
 * the gap only appears in the installed PWA and cannot be reproduced anywhere it
 * could be inspected. Remove once the numbers have been read.
 */
export function ViewportProbe() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    const update = () => setMetrics(read())

    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  if (!metrics) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-black/85 px-2 py-1 text-[10px] leading-tight font-mono text-lime-300">
      <div>screen {metrics.screen}</div>
      <div>inner {metrics.inner}</div>
      <div>visual {metrics.visual}</div>
      <div>dvh {metrics.dvh}</div>
      <div>insets {metrics.insets}</div>
      <div>frame {metrics.rootBox}</div>
    </div>
  )
}
