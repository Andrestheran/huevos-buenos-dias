import { useState, FormEvent } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/shared/components';
import { validateProductionForm, parseNumberInput, sanitizeNumberInput } from '@/shared/utils';
import { useProductionMutation } from '../hooks/useProductionMutation';
import { useAuthStore } from '@/shared/stores/authStore';
import type { ProductionFormData, BarnType } from '../types';
import { EGG_TYPES, BARNS } from '../types';

export function ProductionForm() {
  const { user } = useAuthStore();
  const createMutation = useProductionMutation();

  const [formData, setFormData] = useState<ProductionFormData>({
    barn: null,
    a: 0,
    aa: 0,
    b: 0,
    extra: 0,
    jumbo: 0,
    frozen: 0,
    mortality: 0
  });

  const [error, setError] = useState('');

  function handleBarnSelect(barn: BarnType) {
    setFormData((prev) => ({ ...prev, barn }));
    setError('');
  }

  function handleEggCountChange(type: keyof ProductionFormData, value: string) {
    const sanitized = sanitizeNumberInput(value);
    const num = parseNumberInput(sanitized);

    setFormData((prev) => ({
      ...prev,
      [type]: num
    }));
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate
    const validation = validateProductionForm(formData);
    if (!validation.isValid) {
      setError(validation.error || 'Por favor completa el formulario');
      return;
    }

    if (!user?.id) {
      setError('Error: Usuario no identificado');
      return;
    }

    // Submit
    try {
      await createMutation.mutateAsync({
        barn: formData.barn as BarnType,
        a: formData.a,
        aa: formData.aa,
        b: formData.b,
        extra: formData.extra,
        jumbo: formData.jumbo,
        frozen: formData.frozen,
        mortality: formData.mortality,
        user_id: user.id
      });

      // Reset form
      setFormData({
        barn: null,
        a: 0,
        aa: 0,
        b: 0,
        extra: 0,
        jumbo: 0,
        frozen: 0,
        mortality: 0
      });
    } catch (err) {
      // Error handled by mutation hook
    }
  }

  const total = formData.a + formData.aa + formData.b + formData.extra + formData.jumbo + formData.frozen;

  return (
    <Card variant="elevated" padding="lg" className="animate-slide-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Barn Selection */}
        <div>
          <CardHeader>
            <CardTitle className="text-center">Selecciona el Gallinero</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            {BARNS.map((barn) => (
              <Button
                key={barn}
                type="button"
                variant={formData.barn === barn ? 'primary' : 'outline'}
                size="touch"
                onClick={() => handleBarnSelect(barn)}
                className="text-xl font-bold"
              >
                🏠 {barn}
              </Button>
            ))}
          </div>
        </div>

        {/* Egg Counts */}
        <div>
          <CardHeader>
            <CardTitle className="text-center">Cantidad de Huevos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {EGG_TYPES.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="text-lg font-medium w-24 text-neutral-700">{label}:</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData[key] || ''}
                  onChange={(e) => handleEggCountChange(key, e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="text-xl font-semibold text-center"
                  fullWidth
                />
              </div>
            ))}

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-neutral-800">TOTAL:</span>
                <span className="text-3xl font-bold text-primary">{total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Mortality Section */}
        <div>
          <CardHeader>
            <CardTitle className="text-center">📊 Información Adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label className="text-lg font-medium w-32 text-neutral-700">MORTALIDAD:</label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.mortality || ''}
                onChange={(e) => handleEggCountChange('mortality', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="text-xl font-semibold text-center"
                fullWidth
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2 text-center">
              Número de gallinas muertas (no afecta el total de huevos)
            </p>
          </CardContent>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          size="touch"
          isLoading={createMutation.isPending}
          disabled={createMutation.isPending || !formData.barn || total === 0}
        >
          {createMutation.isPending ? 'Registrando...' : '✓ Registrar Producción'}
        </Button>
      </form>
    </Card>
  );
}
