import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaveRequestForm } from "@/components/Leaves/LeaveRequestForm";
import { LeavesTable } from "@/components/Leaves/LeavesTable";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default function Conges() {
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
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Gestion des Congés</h1>
                <p className="text-muted-foreground">
                  Gérez les demandes de congés des employés
                </p>
              </div>
            </div>

            <Tabs defaultValue="requests" className="space-y-4">
              <TabsList>
                <TabsTrigger value="requests">Demandes</TabsTrigger>
                <TabsTrigger value="new">Nouvelle demande</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des demandes</CardTitle>
                    <CardDescription>
                      Consultez et gérez toutes les demandes de congés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeavesTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Nouvelle demande de congé</CardTitle>
                    <CardDescription>
                      Créez une nouvelle demande de congé pour un employé
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaveRequestForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
