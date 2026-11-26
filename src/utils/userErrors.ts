/**
 * Conversion des erreurs techniques (Postgres, PostgREST, RLS, auth, réseau)
 * en messages français clairs (EX-04 : aucune erreur technique brute à l'écran).
 * Les messages métier déjà rédigés en français (levés par la base) sont conservés.
 */
const RULES: { test: RegExp; message: string }[] = [
  { test: /row-level security|violates row-level|rls/i, message: "Vous n'avez pas les droits nécessaires pour effectuer cette action." },
  { test: /permission denied|42501|not authorized|forbidden|\b403\b/i, message: "Action non autorisée pour votre profil." },
  { test: /jwt|token.*expired|session.*expired|invalid.*refresh|\b401\b/i, message: "Votre session a expiré. Veuillez vous reconnecter." },
  { test: /duplicate key|unique constraint|23505|already exists/i, message: "Cet enregistrement existe déjà." },
  { test: /foreign key|23503/i, message: "Opération impossible : cet élément est lié à d'autres données." },
  { test: /null value in column|not-null|23502/i, message: "Un champ obligatoire est manquant." },
  { test: /check constraint|23514/i, message: "Une valeur saisie n'est pas valide." },
  { test: /invalid input syntax|22P02|invalid input value for enum/i, message: "Une valeur saisie a un format invalide." },
  { test: /numeric field overflow|22003|out of range/i, message: "Une valeur numérique est trop grande." },
  { test: /failed to fetch|networkerror|network request failed|load failed|ERR_INTERNET/i, message: "Connexion impossible. Vérifiez votre réseau et réessayez." },
  { test: /timeout|timed out|57014/i, message: "Le serveur met trop de temps à répondre. Réessayez." },
  { test: /relation .* does not exist|column .* does not exist|42P01|42703|PGRST|schema cache|function .* does not exist|42883/i, message: "Une erreur technique est survenue. Réessayez ou contactez le support." },
  { test: /syntax error|42601|deadlock|40P01|serialization/i, message: "Une erreur technique est survenue. Réessayez dans un instant." },
  { test: /invalid login credentials/i, message: "E-mail ou mot de passe incorrect." },
  { test: /email not confirmed/i, message: "Votre e-mail n'est pas encore confirmé." },
  { test: /user already registered/i, message: "Un compte existe déjà avec cet e-mail." },
  { test: /password.*(weak|short|at least)/i, message: "Mot de passe trop faible (8 caractères minimum)." },
];

const TECHNICAL = /(\bpg_|PGRST|SQLSTATE|stack|at \w+ \(|TypeError|ReferenceError|undefined|\[object |constraint|relation "|::|violates)/i;

export function toUserMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez réessayer."): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? [(error as { message?: string }).message, (error as { code?: string }).code, (error as { details?: string }).details]
            .filter(Boolean)
            .join(" ")
        : "";
  if (!raw) return fallback;
  for (const r of RULES) if (r.test.test(raw)) return r.message;
  // Message métier français levé par la base : conservé tel quel s'il n'a pas l'air technique
  const msg = (error as { message?: string })?.message ?? raw;
  if (!TECHNICAL.test(msg) && /[àâçéèêëîïôûùü]|\b(le|la|les|un|une|des|est|pour|impossible|interdit|refusé|insuffisant|invalide)\b/i.test(msg)) {
    return msg;
  }
  return fallback;
}

export const looksTechnical = (msg: string): boolean => TECHNICAL.test(msg);
