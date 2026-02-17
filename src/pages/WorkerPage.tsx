import { ProductionForm } from '@/features/production/components/ProductionForm';
import { WorkerLayout } from '@/features/production/components/WorkerLayout';

export function WorkerPage() {
  return (
    <WorkerLayout>
      <div className="max-w-2xl mx-auto">
        <ProductionForm />
      </div>
    </WorkerLayout>
  );
}
