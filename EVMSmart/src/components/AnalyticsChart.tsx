import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function AnalyticsChart(props: {
  title: string
  type: 'line' | 'bar'
  data: any
}) {
  const { title, type, data } = props

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { intersect: false },
    },
    scales: {
      x: { ticks: { color: 'rgba(229,231,235,.65)' }, grid: { color: 'rgba(148,163,184,.10)' } },
      y: { ticks: { color: 'rgba(229,231,235,.65)' }, grid: { color: 'rgba(148,163,184,.10)' } },
    },
  } as const

  return (
    <div className="rounded-2xl bg-gray-900 shadow-lg ring-1 ring-white/10">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold text-white">{title}</div>
      </div>
      <div className="h-64 p-4">
        {type === 'line' ? <Line options={options} data={data} /> : <Bar options={options} data={data} />}
      </div>
    </div>
  )
}

