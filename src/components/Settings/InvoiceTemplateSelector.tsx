import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type InvoiceStyle = "classic" | "modern" | "minimal" | "elegant";

interface StyleOption {
  id: InvoiceStyle;
  name: string;
  description: string;
  colors: { primary: string; secondary: string; accent: string };
  preview: {
    headerBg: string;
    tableBg: string;
    totalBg: string;
    textColor: string;
  };
}

const STYLES: StyleOption[] = [
  {
    id: "classic",
    name: "Classique Vert",
    description: "Style professionnel avec des accents verts, idéal pour les entreprises agricoles et salines.",
    colors: { primary: "#64A03C", secondary: "#F5FAF0", accent: "#4A7A2E" },
    preview: { headerBg: "#64A03C", tableBg: "#F5FAF0", totalBg: "#4A7A2E", textColor: "#323232" },
  },
  {
    id: "modern",
    name: "Moderne Bleu",
    description: "Design contemporain avec des tons bleus, parfait pour une image moderne et fiable.",
    colors: { primary: "#2563EB", secondary: "#EFF6FF", accent: "#1D4ED8" },
    preview: { headerBg: "#2563EB", tableBg: "#EFF6FF", totalBg: "#1D4ED8", textColor: "#1E293B" },
  },
  {
    id: "minimal",
    name: "Minimaliste Noir",
    description: "Style épuré en noir et blanc, sobre et universel pour tout type d'entreprise.",
    colors: { primary: "#18181B", secondary: "#F4F4F5", accent: "#3F3F46" },
    preview: { headerBg: "#18181B", tableBg: "#F4F4F5", totalBg: "#3F3F46", textColor: "#18181B" },
  },
  {
    id: "elegant",
    name: "Élégant Doré",
    description: "Style haut de gamme avec des accents dorés, idéal pour une clientèle premium.",
    colors: { primary: "#B8860B", secondary: "#FFF8E7", accent: "#8B6914" },
    preview: { headerBg: "#B8860B", tableBg: "#FFF8E7", totalBg: "#8B6914", textColor: "#3D2E0A" },
  },
];

const MiniInvoicePreview = ({ style }: { style: StyleOption }) => (
  <div className="w-full aspect-[3/4] rounded-lg border bg-white p-3 flex flex-col gap-2 text-[6px] leading-tight shadow-sm">
    {/* Header */}
    <div className="flex justify-between items-start">
      <div>
        <div className="w-12 h-2 rounded" style={{ backgroundColor: style.preview.headerBg }} />
        <div className="w-8 h-1 bg-gray-200 rounded mt-1" />
      </div>
      <div className="text-right">
        <div className="font-bold" style={{ color: style.preview.headerBg }}>FACTURE</div>
        <div className="w-10 h-1 bg-gray-200 rounded ml-auto mt-0.5" />
      </div>
    </div>

    {/* Company + Client */}
    <div className="flex justify-between mt-1">
      <div className="space-y-0.5">
        <div className="w-14 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-1 bg-gray-200 rounded" />
        <div className="w-12 h-1 bg-gray-200 rounded" />
      </div>
      <div className="border rounded p-1" style={{ borderColor: style.preview.headerBg }}>
        <div className="w-12 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-1 bg-gray-200 rounded mt-0.5" />
        <div className="w-8 h-1 bg-gray-200 rounded mt-0.5" />
      </div>
    </div>

    {/* Table */}
    <div className="mt-auto">
      <div className="rounded-t h-2.5 flex items-center px-1" style={{ backgroundColor: style.preview.headerBg }}>
        <span className="text-white font-bold" style={{ fontSize: "4px" }}>Description</span>
      </div>
      <div className="h-2 px-1 flex items-center" style={{ backgroundColor: style.preview.tableBg }}>
        <span style={{ fontSize: "4px", color: style.preview.textColor }}>Sel - gros</span>
      </div>
      <div className="h-2 px-1 flex items-center bg-white">
        <span style={{ fontSize: "4px", color: style.preview.textColor }}>Sel - fin</span>
      </div>
    </div>

    {/* Total */}
    <div className="flex justify-end">
      <div className="rounded px-2 py-0.5" style={{ backgroundColor: style.preview.totalBg }}>
        <span className="text-white font-bold" style={{ fontSize: "5px" }}>TOTAL: 50 000 FCFA</span>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-auto pt-1 border-t text-center" style={{ borderColor: style.preview.headerBg }}>
      <div className="w-20 h-1 bg-gray-200 rounded mx-auto" />
    </div>
  </div>
);

export const InvoiceTemplateSelector = () => {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStyle, setSelectedStyle] = useState<InvoiceStyle>("classic");

  // Load current tenant invoice style
  const { data: tenantSettings } = useQuery({
    queryKey: ["tenant-invoice-style", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", `invoice_style_${tenant.id}`)
        .maybeSingle();
      return data?.setting_value as string | null;
    },
    enabled: !!tenant?.id,
  });

  useEffect(() => {
    if (tenantSettings) {
      setSelectedStyle(tenantSettings as InvoiceStyle);
    }
  }, [tenantSettings]);

  const saveMutation = useMutation({
    mutationFn: async (style: InvoiceStyle) => {
      if (!tenant?.id) throw new Error("No tenant");
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            setting_key: `invoice_style_${tenant.id}`,
            setting_value: JSON.stringify(style),
            description: "Style de facture par défaut",
            is_public: true,
          },
          { onConflict: "setting_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-invoice-style"] });
      toast({ title: "Style enregistré", description: "Le modèle de facture a été mis à jour pour toute l'entreprise." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le style", variant: "destructive" });
    },
  });

  const handleSelect = (style: InvoiceStyle) => {
    setSelectedStyle(style);
    saveMutation.mutate(style);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Modèle de facture
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choisissez le style de facture par défaut. Ce modèle sera utilisé par tous les utilisateurs de votre entreprise.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => handleSelect(style.id)}
                  className={`relative rounded-xl border-2 p-3 transition-all duration-200 text-left hover:shadow-md ${
                    isSelected
                      ? "border-primary shadow-lg ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 z-10 rounded-full bg-primary p-1">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <MiniInvoicePreview style={style} />
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{style.name}</p>
                      {isSelected && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actif</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{style.description}</p>
                  </div>
                  {/* Color swatches */}
                  <div className="flex gap-1.5 mt-2">
                    {Object.values(style.colors).map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border border-border/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export styles for use in PDF generator
export const getInvoiceStyleColors = (style: InvoiceStyle) => {
  const found = STYLES.find((s) => s.id === style);
  if (!found) return STYLES[0];
  return found;
};

export { STYLES };
