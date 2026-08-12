import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { GeneralLedger } from "@/components/Accounting/GeneralLedger";
import { AccountingFlowDiagram } from "@/components/Accounting/AccountingFlowDiagram";
import { LedgerAuditLog } from "@/components/Accounting/LedgerAuditLog";
import { ShadowEntriesPanel } from "@/components/Accounting/ShadowEntriesPanel";

const GrandLivre = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />
          <AccountingFlowDiagram />
          <ShadowEntriesPanel />
          <GeneralLedger />
          <LedgerAuditLog />
        </main>
      </div>
    </div>
  );
};

export default GrandLivre;
