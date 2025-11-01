import { z } from "zod";

// ============= Common Validators =============

export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

// Email validation with sanitization
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Email invalide" })
  .max(255, { message: "L'email ne peut pas dépasser 255 caractères" })
  .transform((val) => val.toLowerCase());

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+221)?[0-9]{9}$/, { message: "Numéro de téléphone invalide (format: +221XXXXXXXXX)" })
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Le nom est requis" })
  .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom contient des caractères invalides");

export const companyNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom de l'entreprise est obligatoire")
  .max(200, "Le nom de l'entreprise est trop long (max 200 caractères)")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s'-]+$/, "Le nom contient des caractères invalides");

export const descriptionSchema = z
  .string()
  .trim()
  .max(1000, { message: "La description ne peut pas dépasser 1000 caractères" })
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    "Contenu suspect détecté"
  )
  .optional();

// Password validation with security requirements
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe est trop long")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

export const positiveNumberSchema = z
  .number()
  .positive({ message: "La valeur doit être positive" })
  .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number));

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format de date invalide (YYYY-MM-DD)" })
  .refine((date) => !isNaN(Date.parse(date)), { message: "Date invalide" });

// Text input validation with XSS protection
export const textInputSchema = (minLength = 0, maxLength = 500) =>
  z
    .string()
    .trim()
    .min(minLength, `Au moins ${minLength} caractères requis`)
    .max(maxLength, `Maximum ${maxLength} caractères`)
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      "Contenu suspect détecté"
    );

// ============= Auth Forms =============

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  tenantName: companyNameSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les Conditions Générales d'Utilisation",
  }),
});

export const inviteUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: z.enum(["gerant", "commercial", "production", "comptable"]),
});

export const profileUpdateSchema = z.object({
  full_name: nameSchema.optional(),
  phone: phoneSchema,
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// ============= Production =============

export const bassinSchema = z.object({
  name: nameSchema,
  code: z.string().trim().max(20).optional(),
  area: positiveNumberSchema.optional(),
  location: z.string().trim().max(200).optional(),
  is_active: z.boolean().default(true),
});

export const productionRecordSchema = z.object({
  bassin_id: uuidSchema,
  campagne_id: uuidSchema.optional(),
  production_date: dateSchema,
  salt_type: z.enum(['sel_fin', 'gros_sel', 'sel_gemme', 'fleur_de_sel']),
  quantity: positiveNumberSchema,
  quality_grade: z.enum(['A', 'B', 'C']).optional(),
  batch_number: z.string().trim().max(50).optional(),
  traceability_code: z.string().trim().max(50).optional(),
});

export const qualityTestSchema = z.object({
  production_record_id: uuidSchema,
  test_date: z.string().datetime(),
  salt_purity: z.number().min(0).max(100).optional(),
  humidity_level: z.number().min(0).max(100).optional(),
  impurities_level: z.number().min(0).max(100).optional(),
  color_grade: z.enum(['blanc', 'gris', 'rose']).optional(),
  grain_size: z.enum(['fin', 'moyen', 'gros']).optional(),
  quality_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  tested_by: uuidSchema.optional(),
  notes: descriptionSchema,
});

// ============= Commercial =============

export const clientSchema = z.object({
  name: nameSchema,
  client_type: z.enum(['grossiste', 'detaillant', 'exportateur', 'particulier']).optional(),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  address: z.string().trim().max(500).optional(),
});

export const saleSchema = z.object({
  client_id: uuidSchema,
  sale_date: dateSchema,
  salt_type: z.string().trim().max(50),
  quantity: positiveNumberSchema,
  unit_price: positiveNumberSchema,
  total_amount: positiveNumberSchema,
  payment_status: z.enum(['pending', 'partial', 'paid']).default('pending'),
  delivery_status: z.enum(['pending', 'in_transit', 'delivered']).default('pending'),
  notes: descriptionSchema,
});

// ============= RH =============

export const employeeSchema = z.object({
  full_name: nameSchema,
  employee_type: z.enum(['permanent', 'saisonnier']),
  position: z.string().trim().max(100).optional(),
  employee_number: z.string().trim().max(20).optional(),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  hire_date: dateSchema.optional(),
  salary: positiveNumberSchema.optional(),
  is_active: z.boolean().default(true),
});

export const leaveRequestSchema = z.object({
  employee_id: uuidSchema,
  leave_type: z.enum(['conge_annuel', 'conge_maladie', 'conge_maternite', 'conge_sans_solde']),
  start_date: dateSchema,
  end_date: dateSchema,
  reason: z.string().trim().min(10).max(500, { message: "La raison doit faire entre 10 et 500 caractères" }),
  notes: descriptionSchema,
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: "La date de fin doit être après la date de début",
  path: ["end_date"],
});

export const teamAttendanceSchema = z.object({
  team_id: uuidSchema,
  attendance_date: dateSchema,
  workers_count: z.number().int().positive(),
  hours_worked: z.number().positive().max(24),
  daily_rate: positiveNumberSchema,
  location: z.string().trim().max(200).optional(),
  notes: descriptionSchema,
});

// ============= Sanitization =============

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .slice(0, 1000); // Hard limit
};

export function safeEncodeURIComponent(str: string): string {
  if (!str) return '';
  return encodeURIComponent(str.trim().substring(0, 1000));
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

// ============= Type Exports =============

export type LoginInput = z.infer<typeof loginFormSchema>;
export type SignupInput = z.infer<typeof signupFormSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type BassinInput = z.infer<typeof bassinSchema>;
export type ProductionRecordInput = z.infer<typeof productionRecordSchema>;
export type QualityTestInput = z.infer<typeof qualityTestSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type TeamAttendanceInput = z.infer<typeof teamAttendanceSchema>;
