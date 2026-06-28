import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js'

Chart.defaults.font.family = 'Arimo'

interface Props {
  /** Canvas id — required so the doughnut htmlLegend plugin can find `${id}-lg`. */
  id: string
  config: ChartConfiguration
}

/**
 * Thin React wrapper around a Chart.js instance. Re-creates the chart
 * whenever the config object identity changes (configs are rebuilt each
 * render from the view-model, mirroring the prototype's drawCharts()).
 */
export default function ChartCanvas({ id, config }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, config)
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [config])

  return <canvas id={id} ref={ref} />
}
