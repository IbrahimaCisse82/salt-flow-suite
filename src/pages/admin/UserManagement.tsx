import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { UserRoleManagement } from "@/components/Admin/UserRoleManagement";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function AdminUserManagementPage() {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={cn(
          "flex-1 p-6 overflow-auto transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérer les rôles et permissions des utilisateurs
              </p>
            </div>
            <UserRoleManagement />
          </div>
        </main>
      </div>
    </div>
  );
}