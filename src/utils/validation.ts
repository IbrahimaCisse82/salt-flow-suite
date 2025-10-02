import { z } from "zod";

// Email validation with sanitization
export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'email est obligatoire")
  .max(255, "L'email est trop long")
  .email("Format d'email invalide")
  .transform((val) => val.toLowerCase());

// Password validation
export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères")
  .max(128, "Le mot de passe est trop long");

// Name validation with sanitization
export const nameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est obligatoire")
  .max(100, "Le nom est trop long (max 100 caractères)")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom contient des caractères invalides");

// Company/Tenant name validation
export const companyNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom de l'entreprise est obligatoire")
  .max(200, "Le nom de l'entreprise est trop long (max 200 caractères)")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s'-]+$/, "Le nom contient des caractères invalides");

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

// Phone validation (optional)
export const phoneSchema = z
  .string()
  .trim()
  .max(20, "Numéro de téléphone trop long")
  .regex(/^[\d\s+()-]*$/, "Format de téléphone invalide")
  .optional()
  .or(z.literal(""));

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .slice(0, 1000); // Hard limit
};

// Auth form schemas
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
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
