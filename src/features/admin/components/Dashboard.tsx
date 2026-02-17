import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '@/features/production/services/productionService';
import { Card, CardHeader, CardTitle, CardContent, Badge, Loading, ConfirmDialog } from '@/shared/components';
import { formatDate, formatNumber, getDateRange } from '@/shared/utils';
import { ProductionChart } from './ProductionChart';
import { DashboardFilters } from './DashboardFilters';
import { ExportButton } from './ExportButton';
import type { BarnType } from '@/features/production/types';
import { toast } from 'react-toastify';

export function Dashboard() {
  const [dateRange, setDateRange] = useState(() => getDateRange(30)); // Changed to 30 days
  const [selectedBarn, setSelectedBarn] = useState<BarnType | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; recordId: string | null }>({
    isOpen: false,
    recordId: null
  });

  const queryClient = useQueryClient();

  // Fetch production records
  const { data: records, isLoading, error } = useQuery({
    queryKey: ['admin-records', dateRange, selectedBarn, selectedWorker],
    queryFn: async () => {
      console.log('📊 Fetching records with filters:', {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        barn: selectedBarn,
        userId: selectedWorker
      });

      const result = await productionService.getAllRecords({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        barn: selectedBarn || undefined,
        userId: selectedWorker || undefined
      });

      console.log('📊 Records fetched:', result.length, 'records');
      console.log('📊 First record:', result[0]);

      return result;
    }
  });

  // Fetch production stats
  const { data: stats } = useQuery({
    queryKey: ['production-stats', dateRange, selectedBarn, selectedWorker],
    queryFn: () =>
      productionService.getProductionStats(
        dateRange.start.toISOString(),
        dateRange.end.toISOString(),
        {
          barn: selectedBarn || undefined,
          userId: selectedWorker || undefined
        }
      )
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => productionService.deleteRecord(recordId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin-records'] });
      queryClient.invalidateQueries({ queryKey: ['production-stats'] });

      toast.success('Registro eliminado exitosamente');
      setDeleteDialog({ isOpen: false, recordId: null });
    },
    onError: (error: any) => {
      console.error('Error deleting record:', error);
      toast.error('Error al eliminar el registro');
    }
  });

  function handleDeleteClick(recordId: string) {
    setDeleteDialog({ isOpen: true, recordId });
  }

  function handleConfirmDelete() {
    if (deleteDialog.recordId) {
      deleteMutation.mutate(deleteDialog.recordId);
    }
  }

  function handleCancelDelete() {
    setDeleteDialog({ isOpen: false, recordId: null });
  }

  if (isLoading) {
    return <Loading fullScreen text="Cargando datos..." />;
  }

  if (error) {
    console.error('❌ Error fetching records:', error);
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-danger mb-2">Error al cargar datos</h2>
        <p className="text-neutral-600">{(error as Error).message}</p>
        <p className="text-sm text-neutral-500 mt-4">Revisa la consola para más detalles</p>
      </div>
    );
  }

  const totalEggs = records?.reduce((sum, r) => sum + r.total, 0) || 0;
  const totalRecords = records?.length || 0;
  const avgPerRecord = totalRecords > 0 ? totalEggs / totalRecords : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Panel de Administración</h1>
          <p className="text-neutral-600 mt-1">Resumen de producción</p>
        </div>
        <ExportButton records={records || []} />
      </div>

      {/* Filters */}
      <DashboardFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedBarn={selectedBarn}
        onBarnChange={setSelectedBarn}
        selectedWorker={selectedWorker}
        onWorkerChange={setSelectedWorker}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600">Total de Huevos</div>
            <div className="text-3xl font-bold text-primary mt-2">
              {formatNumber(totalEggs)}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600">Registros</div>
            <div className="text-3xl font-bold text-success mt-2">{totalRecords}</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600">Promedio por Registro</div>
            <div className="text-3xl font-bold text-neutral-700 mt-2">
              {formatNumber(Math.round(avgPerRecord))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Producción Diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionChart data={stats || []} />
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Registros Recientes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-3 text-sm font-medium text-neutral-600">Fecha</th>
                <th className="pb-3 text-sm font-medium text-neutral-600">Trabajador</th>
                <th className="pb-3 text-sm font-medium text-neutral-600">Gallinero</th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">
                  Total
                </th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">A</th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">AA</th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">B</th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">
                  EXTRA
                </th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-right">
                  JUMBO
                </th>
                <th className="pb-3 text-sm font-medium text-neutral-600 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {records?.map((record: any) => (
                <tr key={record.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 text-sm">
                    {formatDate(record.created_at, 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="py-3 text-sm">
                    {record.profiles?.full_name || 'Desconocido'}
                  </td>
                  <td className="py-3">
                    <Badge variant={record.barn === 'A' ? 'info' : 'warning'} size="sm">
                      {record.barn}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm font-semibold text-right">
                    {formatNumber(record.total)}
                  </td>
                  <td className="py-3 text-sm text-right">{formatNumber(record.a)}</td>
                  <td className="py-3 text-sm text-right">{formatNumber(record.aa)}</td>
                  <td className="py-3 text-sm text-right">{formatNumber(record.b)}</td>
                  <td className="py-3 text-sm text-right">{formatNumber(record.extra)}</td>
                  <td className="py-3 text-sm text-right">{formatNumber(record.jumbo)}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => handleDeleteClick(record.id)}
                      className="text-danger hover:text-danger-700 transition-colors px-2 py-1 rounded hover:bg-danger-50"
                      title="Eliminar registro"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records?.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No hay registros para el período seleccionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Registro?"
        message="Esta acción no se puede deshacer. El registro de producción será eliminado permanentemente."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
