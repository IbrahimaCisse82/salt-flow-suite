/**
 * Utilitaires de transformation de données entre frontend et base de données.
 * Garantit la cohérence des types lors des mutations.
 */

/**
 * Convertit une Date JavaScript en string ISO pour la DB
 */
export const dateToISOString = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  if (typeof date === 'string') {
    // Vérifie si c'est déjà un format valide
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return date.toISOString();
};

/**
 * Convertit une date en format YYYY-MM-DD pour les champs date (sans timestamp)
 */
export const dateToYYYYMMDD = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  if (typeof date === 'string') {
    // Si déjà au bon format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

/**
 * Assure qu'un nombre est bien un number (pas une string)
 */
export const ensureNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
};

/**
 * Assure qu'un entier est bien un number entier
 */
export const ensureInteger = (value: number | string | null | undefined): number | null => {
  const num = ensureNumber(value);
  return num !== null ? Math.round(num) : null;
};

/**
 * Assure qu'un booléen est bien un boolean
 */
export const ensureBoolean = (value: boolean | string | number | null | undefined): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
};

/**
 * Nettoie une chaîne pour la DB (null si vide)
 */
export const cleanString = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Prépare un objet pour l'insertion en supprimant les champs auto-générés
 */
export const prepareForInsert = <T extends Record<string, unknown>>(
  data: T,
  excludeFields: (keyof T)[] = ['id', 'created_at', 'updated_at', 'deleted_at'] as (keyof T)[]
): Omit<T, (typeof excludeFields)[number]> => {
  const result = { ...data };
  for (const field of excludeFields) {
    delete result[field];
  }
  return result;
};

/**
 * Prépare un objet pour la mise à jour (exclut les champs immuables)
 */
export const prepareForUpdate = <T extends Record<string, unknown>>(
  data: T,
  excludeFields: (keyof T)[] = ['id', 'created_at', 'tenant_id'] as (keyof T)[]
): Omit<T, (typeof excludeFields)[number]> => {
  const result = { ...data };
  for (const field of excludeFields) {
    delete result[field];
  }
  // Ajoute updated_at automatiquement
  (result as Record<string, unknown>).updated_at = new Date().toISOString();
  return result;
};

/**
 * Transforme les données de formulaire en données prêtes pour la DB
 */
export interface TransformOptions {
  dateFields?: string[];
  numberFields?: string[];
  integerFields?: string[];
  booleanFields?: string[];
  nullIfEmptyFields?: string[];
}

export const transformFormToDb = <T extends Record<string, unknown>>(
  formData: T,
  options: TransformOptions = {}
): T => {
  const result = { ...formData };

  // Transforme les dates
  for (const field of options.dateFields || []) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = dateToYYYYMMDD(result[field] as Date | string);
    }
  }

  // Transforme les nombres
  for (const field of options.numberFields || []) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = ensureNumber(result[field] as number | string);
    }
  }

  // Transforme les entiers
  for (const field of options.integerFields || []) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = ensureInteger(result[field] as number | string);
    }
  }

  // Transforme les booléens
  for (const field of options.booleanFields || []) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = ensureBoolean(result[field] as boolean | string);
    }
  }

  // Met null si vide
  for (const field of options.nullIfEmptyFields || []) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = cleanString(result[field] as string);
    }
  }

  return result;
};

/**
 * Valide qu'un UUID est au bon format
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Calcule le montant à partir des heures et du taux journalier
 */
export const calculateAmount = (hoursWorked: number, dailyRate: number, standardHours = 8): number => {
  return (hoursWorked / standardHours) * dailyRate;
};
