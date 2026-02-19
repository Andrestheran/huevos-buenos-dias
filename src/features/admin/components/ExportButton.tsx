import { Button } from '@/shared/components';
import { formatDate } from '@/shared/utils';
import type { ProductionRecord } from '@/lib/supabase';
import { toast } from 'react-toastify';

interface ExportButtonProps {
  records: ProductionRecord[];
}

export function ExportButton({ records }: ExportButtonProps) {
  function exportToCSV() {
    if (records.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      // CSV headers
      const headers = [
        'Fecha',
        'Hora',
        'Gallinero',
        'A',
        'AA',
        'B',
        'EXTRA',
        'JUMBO',
        'CONGELADO',
        'MORTALIDAD',
        'Total'
      ];

      // CSV rows
      const rows = records.map((record: any) => [
        formatDate(record.created_at, 'dd/MM/yyyy'),
        formatDate(record.created_at, 'HH:mm'),
        record.barn,
        record.a,
        record.aa,
        record.b,
        record.extra,
        record.jumbo,
        record.frozen,
        record.mortality,
        record.total
      ]);

      // Combine headers and rows
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `produccion_${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
      );
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Archivo CSV descargado correctamente');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Error al exportar datos');
    }
  }

  return (
    <Button variant="outline" onClick={exportToCSV} disabled={records.length === 0}>
      📥 Exportar CSV
    </Button>
  );
}
