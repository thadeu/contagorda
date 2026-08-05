import { useEffect, useRef, useState } from 'react'

interface Metrics {
  inner: string
  visual: string
  dvh: number
  insetTop: string
  html: string
  body: string
  root: string
  frame: string
}

function box(element: Element | null): string {
  if (!element) return '—'

  const rect = element.getBoundingClientRect()

  return `${Math.round(rect.width)}×${Math.round(rect.height)} @${Math.round(rect.top)}`
}

/**
 * TEMPORARY. Reports where each box in the chain actually sits on the device.
 *
 * The frame measured 20px down from the top despite being `fixed inset-0`, and
 * nothing in our CSS creates a containing block, so the offset comes from
 * somewhere above it. Measuring html, body and root separately says which.
 *
 * `100dvh` is measured with a real element: reading it from a custom property
 * hands back the unresolved token, and the earlier reading of "100" was that
 * string being parsed as a number.
 */
export function ViewportProbe() {
  const ruler = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    function update() {
      const style = getComputedStyle(document.documentElement)

      setMetrics({
        inner: `${window.innerWidth}×${window.innerHeight}`,
        visual: window.visualViewport
          ? `${Math.round(window.visualViewport.width)}×${Math.round(window.visualViewport.height)}`
          : '—',
        dvh: Math.round(ruler.current?.getBoundingClientRect().height ?? 0),
        insetTop: style.getPropertyValue('--probe-top').trim() || '0px',
        html: box(document.documentElement),
        body: box(document.body),
        root: box(document.getElementById('root')),
        frame: box(document.querySelector('[data-probe-frame]')),
      })
    }

    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return (
    <>
      <div
        ref={ruler}
        aria-hidden="true"
        className="pointer-events-none invisible absolute h-dvh w-0"
      />

      {metrics && (
        <div className="fixed inset-x-0 top-0 z-50 bg-black/85 px-2 py-1 font-mono text-[10px] leading-tight text-lime-300">
          <div>inner {metrics.inner}</div>
          <div>visual {metrics.visual}</div>
          <div>dvh {metrics.dvh}</div>
          <div>insetTop {metrics.insetTop}</div>
          <div>html {metrics.html}</div>
          <div>body {metrics.body}</div>
          <div>root {metrics.root}</div>
          <div>frame {metrics.frame}</div>
        </div>
      )}
    </>
  )
}
