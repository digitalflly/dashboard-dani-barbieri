// ============================================================
// Chart.js configuration builders — line / bar / doughnut.
// Ported from lineCfg / barCfg / doughnutCfg / rampColors /
// wrapLabel / htmlLegend in Dashboard.dc.html.
// ============================================================

import type { Chart, ChartConfiguration, Plugin } from 'chart.js'
import { fmtNum, fmtPct } from './format'
import { RED_RAMP } from './constants'
import type { TallyItem } from './types'

export interface LineDataset {
  label: string
  data: (number | null)[]
  color: string
  fill?: boolean
  fillColor?: string
}

export interface LineOpts {
  pct?: boolean
  zero?: boolean
}

export function lineCfg(labels: string[], datasets: LineDataset[], opts: LineOpts = {}): ChartConfiguration {
  const cfg: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((d) => ({
        label: d.label,
        data: d.data as number[],
        borderColor: d.color,
        backgroundColor: d.fillColor || d.color,
        tension: 0.35,
        borderWidth: 2.2,
        pointRadius: d.data.length > 14 ? 0 : 2.5,
        pointHoverRadius: 4,
        fill: d.fill || false,
        spanGaps: true,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: datasets.length > 1,
          position: 'bottom',
          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { family: 'Arimo', size: 11 }, color: '#6E595D' },
        },
        tooltip: {
          backgroundColor: '#271217',
          titleColor: '#F6EFE8',
          bodyColor: '#EAD9C9',
          borderColor: '#4A3338',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: 'Arimo', weight: 'bold' },
          bodyFont: { family: 'Arimo' },
          callbacks: opts.pct
            ? { label: (c) => c.dataset.label + ': ' + fmtPct(c.parsed.y) }
            : { label: (c) => c.dataset.label + ': ' + fmtNum(c.parsed.y) },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Arimo', size: 10 }, color: '#6E595D', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          beginAtZero: !!opts.zero,
          grid: { color: 'rgba(119,21,32,0.07)' },
          ticks: {
            font: { family: 'Arimo', size: 10 },
            color: '#6E595D',
            callback: opts.pct ? (v) => fmtPct(v as number) : (v) => fmtNum(v as number),
          },
        },
      },
    },
  }
  return cfg as ChartConfiguration
}

export function rampColors(n: number): string[] {
  const R = RED_RAMP
  if (n <= 1) return [R[1]]
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    out.push(R[Math.round(t * (R.length - 1))])
  }
  return out
}

function wrapLabel(s: string, max: number): string | string[] {
  s = String(s || '')
  if (s.length <= max) return s
  const words = s.split(' ')
  const lines: string[] = []
  let cur = ''
  words.forEach((w) => {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur)
      cur = w
    } else cur = (cur ? cur + ' ' : '') + w
  })
  if (cur) lines.push(cur)
  return lines.slice(0, 3)
}

export function barCfg(items: TallyItem[], opts: { horizontal?: boolean } = {}): ChartConfiguration {
  const horizontal = !!opts.horizontal
  const colors = rampColors(items.length)
  const wrap = (s: string) => wrapLabel(s, 22)
  const cfg: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: items.map((i) => i.label),
      datasets: [
        { data: items.map((i) => i.count), backgroundColor: colors, borderRadius: 4, borderSkipped: false, maxBarThickness: 46 },
      ],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#271217',
          titleColor: '#F6EFE8',
          bodyColor: '#EAD9C9',
          borderColor: '#4A3338',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: 'Arimo', weight: 'bold' },
          bodyFont: { family: 'Arimo' },
          callbacks: { label: (c) => fmtNum((horizontal ? c.parsed.x : c.parsed.y) as number) + ' candidaturas' },
        },
      },
      scales: {
        x: {
          grid: { display: horizontal, color: 'rgba(119,21,32,0.07)' },
          ticks: {
            font: { family: 'Arimo', size: horizontal ? 10 : 10.5 },
            color: '#6E595D',
            autoSkip: false,
            maxRotation: 0,
            callback: horizontal
              ? (v) => fmtNum(v as number)
              : function (this: { getLabelForValue: (v: number) => string }, v) {
                  const l = this.getLabelForValue(v as number)
                  return l.length > 16 ? l.slice(0, 15) + '…' : l
                },
          },
        },
        y: {
          beginAtZero: true,
          grid: { display: !horizontal, color: 'rgba(119,21,32,0.07)' },
          ticks: {
            font: { family: 'Arimo', size: 10.5 },
            color: '#6E595D',
            autoSkip: false,
            callback: horizontal
              ? function (this: { getLabelForValue: (v: number) => string }, v) {
                  return wrap(this.getLabelForValue(v as number))
                }
              : (v) => fmtNum(v as number),
          },
        },
      },
    },
  }
  return cfg as ChartConfiguration
}

// HTML legend plugin — renders swatches into the sibling `<id>-lg` box.
let _htmlLegend: Plugin<'doughnut'> | null = null
export function htmlLegend(): Plugin<'doughnut'> {
  if (_htmlLegend) return _htmlLegend
  _htmlLegend = {
    id: 'htmlLegend',
    afterUpdate: (chart: Chart<'doughnut'>) => {
      const box = document.getElementById(chart.canvas.id + '-lg')
      if (!box) return
      box.innerHTML = ''
      const d = chart.data
      ;(d.labels as string[]).forEach((label, i) => {
        const item = document.createElement('div')
        item.style.cssText = 'display:flex; align-items:center; gap:6px; min-width:0; cursor:pointer;'
        const sw = document.createElement('span')
        const bg = (d.datasets[0].backgroundColor as string[])[i]
        sw.style.cssText = 'width:9px; height:9px; border-radius:2px; flex:none; background:' + bg + ';'
        const tx = document.createElement('span')
        tx.style.cssText =
          'font:10px/1.3 Arimo, sans-serif; color:#6E595D; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'
        tx.textContent = label
        if (!chart.getDataVisibility(i)) {
          item.style.opacity = '0.4'
          tx.style.textDecoration = 'line-through'
        }
        item.onclick = () => {
          chart.toggleDataVisibility(i)
          chart.update()
        }
        item.appendChild(sw)
        item.appendChild(tx)
        box.appendChild(item)
      })
    },
  }
  return _htmlLegend
}

export function doughnutCfg(items: TallyItem[]): ChartConfiguration {
  const colors = rampColors(items.length)
  const total = items.reduce((a, i) => a + i.count, 0) || 1
  const cfg: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: items.map((i) => i.label),
      datasets: [{ data: items.map((i) => i.count), backgroundColor: colors, borderWidth: 0, spacing: 0, hoverOffset: 5 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#271217',
          titleColor: '#F6EFE8',
          bodyColor: '#EAD9C9',
          borderColor: '#4A3338',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: 'Arimo', weight: 'bold' },
          bodyFont: { family: 'Arimo' },
          callbacks: {
            title: (c) => (c[0] ? (c[0].label as string) : ''),
            label: (c) => ' ' + fmtNum(c.parsed) + ' (' + fmtPct((c.parsed / total) * 100) + ')',
          },
        },
      },
    },
    plugins: [htmlLegend()],
  }
  return cfg as ChartConfiguration
}
