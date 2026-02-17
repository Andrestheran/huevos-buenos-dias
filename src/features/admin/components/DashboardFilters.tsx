import { Button } from '@/shared/components';
import { getDateRange } from '@/shared/utils';
import type { BarnType } from '@/features/production/types';

interface DashboardFiltersProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  selectedBarn: BarnType | null;
  onBarnChange: (barn: BarnType | null) => void;
  selectedWorker: string | null;
  onWorkerChange: (worker: string | null) => void;
}

export function DashboardFilters({
  dateRange: _dateRange,
  onDateRangeChange,
  selectedBarn,
  onBarnChange
}: DashboardFiltersProps) {
  const presets = [
    { label: 'Hoy', days: 0 },
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 }
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {/* Date Range Presets */}
      <div className="flex gap-2">
        {presets.map(({ label, days }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            onClick={() => onDateRangeChange(getDateRange(days))}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Barn Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedBarn === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onBarnChange(null)}
        >
          Todos
        </Button>
        <Button
          variant={selectedBarn === 'A' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onBarnChange('A')}
        >
          Gallinero A
        </Button>
        <Button
          variant={selectedBarn === 'B' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onBarnChange('B')}
        >
          Gallinero B
        </Button>
      </div>
    </div>
  );
}
