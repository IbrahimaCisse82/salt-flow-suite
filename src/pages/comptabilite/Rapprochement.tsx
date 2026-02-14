import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { BankReconciliation } from "@/components/Accounting/BankReconciliation";

const Rapprochement = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />
          <BankReconciliation />
        </main>
      </div>
    </div>
  );
};

export default Rapprochement;
