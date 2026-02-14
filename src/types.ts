// This file is intentionally kept minimal.
// All DB-aligned types live in src/types/database.types.ts
// UI-specific Team types live in src/hooks/useTeams.ts

// Re-export database types for convenience
export type {
  TeamRow,
  TeamInsert,
  TeamUpdate,
  EmployeeRow,
} from "@/types/database.types";
