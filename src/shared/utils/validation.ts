/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate egg count (must be non-negative integer)
 */
export function validateEggCount(value: number | string): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: 'Ingresa un número válido' };
  }

  if (num < 0) {
    return { isValid: false, error: 'El número no puede ser negativo' };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Debe ser un número entero' };
  }

  if (num > 100000) {
    return { isValid: false, error: 'El número es demasiado grande' };
  }

  return { isValid: true };
}

/**
 * Validate barn selection
 */
export function validateBarn(barn: string | null): ValidationResult {
  if (!barn) {
    return { isValid: false, error: 'Selecciona un gallinero' };
  }

  if (!['A', 'B'].includes(barn)) {
    return { isValid: false, error: 'Gallinero inválido' };
  }

  return { isValid: true };
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'El correo es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Correo inválido' };
  }

  return { isValid: true };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Mínimo 6 caracteres' };
  }

  return { isValid: true };
}

/**
 * Validate production form data
 */
export interface ProductionFormData {
  barn: string | null;
  a: number;
  aa: number;
  b: number;
  extra: number;
  jumbo: number;
  frozen: number;
  mortality: number;
}

export function validateProductionForm(data: ProductionFormData): ValidationResult {
  // Validate barn
  const barnResult = validateBarn(data.barn);
  if (!barnResult.isValid) {
    return barnResult;
  }

  // Validate egg counts (including frozen)
  const eggTypes = ['a', 'aa', 'b', 'extra', 'jumbo', 'frozen'] as const;
  for (const type of eggTypes) {
    const result = validateEggCount(data[type]);
    if (!result.isValid) {
      return { isValid: false, error: `Error en ${type.toUpperCase()}: ${result.error}` };
    }
  }

  // Validate mortality (informative field, separate from egg counts)
  const mortalityResult = validateEggCount(data.mortality);
  if (!mortalityResult.isValid) {
    return { isValid: false, error: `Error en MORTALIDAD: ${mortalityResult.error}` };
  }

  // Check if at least one egg type has a value > 0 (including frozen)
  const total = data.a + data.aa + data.b + data.extra + data.jumbo + data.frozen;
  if (total === 0) {
    return { isValid: false, error: 'Debes ingresar al menos un huevo' };
  }

  return { isValid: true };
}

/**
 * Sanitize number input (remove non-numeric characters)
 */
export function sanitizeNumberInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Parse number from input (returns 0 if invalid)
 */
export function parseNumberInput(value: string | number): number {
  if (typeof value === 'number') return value;
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}
