import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatDate } from '@/shared/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductionChartProps {
  data: Array<{
    date: string;
    barn: string;
    total_eggs: number;
  }>;
}

export function ProductionChart({ data }: ProductionChartProps) {
  // Group by date
  const groupedByDate = data.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = { date, barnA: 0, barnB: 0 };
    }
    if (item.barn === 'A') {
      acc[date].barnA += item.total_eggs;
    } else {
      acc[date].barnB += item.total_eggs;
    }
    return acc;
  }, {} as Record<string, { date: string; barnA: number; barnB: number }>);

  const chartData = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const config = {
    labels: chartData.map((d) => formatDate(d.date, 'dd/MM')),
    datasets: [
      {
        label: 'Gallinero A',
        data: chartData.map((d) => d.barnA),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Gallinero B',
        data: chartData.map((d) => d.barnB),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} huevos`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString()
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Line data={config} options={options} />
    </div>
  );
}
