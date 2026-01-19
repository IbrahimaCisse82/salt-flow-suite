import React, { createContext, useContext } from "react";

/**
 * CONTEXTE D'AUTHENTIFICATION FICTIF
 * ---------------------------------
 * Ce fichier sert UNIQUEMENT au frontend
 * AUCUN appel réseau
 * AUCUN Supabase
 */

// =====================
// TYPES SIMPLES
// =====================
interface User {
  id: string;
  email: string;
  role: string;
}

interface Profile {
  full_name: string;
  email: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User;
  profile: Profile;
  tenant: Tenant;
  loading: boolean;
}

// =====================
// CONTEXTE
// =====================
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProviderMock");
  }
  return ctx;
};

// =====================
// PROVIDER FICTIF
// =====================
export const AuthProviderMock = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // 🔹 USER FICTIF
  const user: User = {
    id: "1",
    email: "fictif@example.com",
    role: "admin",
  };

  // 🔹 PROFIL FICTIF
  const profile: Profile = {
    full_name: "Admin Fictif",
    email: "fictif@example.com",
    role: "admin",
  };

  // 🔹 TENANT FICTIF
  const tenant: Tenant = {
    id: "1",
    name: "Entreprise Test",
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tenant,
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
