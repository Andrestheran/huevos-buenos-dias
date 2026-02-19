export type BarnType = 'A' | 'B';

export interface EggCounts {
  a: number;
  aa: number;
  b: number;
  extra: number;
  jumbo: number;
  frozen: number;
}

export interface ProductionFormData extends EggCounts {
  barn: BarnType | null;
  mortality: number;
}

export interface ProductionRecordCreate extends EggCounts {
  barn: BarnType;
  user_id: string;
  mortality: number;
  synced?: boolean;
}

export const EGG_TYPES = [
  { key: 'a', label: 'A' },
  { key: 'aa', label: 'AA' },
  { key: 'b', label: 'B' },
  { key: 'extra', label: 'EXTRA' },
  { key: 'jumbo', label: 'JUMBO' },
  { key: 'frozen', label: 'CONGELADO' }
] as const;

export const BARNS: BarnType[] = ['A', 'B'];
