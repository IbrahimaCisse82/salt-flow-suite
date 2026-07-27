import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateInvoicePdf } from "@/utils/invoicePdf";
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

// ── CLASSIC preview: traditional boxed layout ──
const ClassicPreview = ({ style }: { style: StyleOption }) => (
  <div className="w-full aspect-[3/4] rounded-lg border bg-white p-3 flex flex-col gap-1.5 text-[6px] leading-tight shadow-sm">
    <div className="flex justify-between items-start">
      <div className="w-12 h-2 rounded" style={{ backgroundColor: style.preview.headerBg }} />
      <div className="text-right">
        <div className="font-bold" style={{ color: style.preview.headerBg, fontSize: "5px" }}>Facture N°</div>
        <div className="w-10 h-1 bg-gray-200 rounded ml-auto mt-0.5" />
      </div>
    </div>
    <div className="flex justify-between mt-1">
      <div className="space-y-0.5">
        <div className="w-14 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-1 bg-gray-200 rounded" />
      </div>
      <div className="border rounded p-1" style={{ borderColor: style.preview.headerBg }}>
        <div className="w-10 h-1 bg-gray-300 rounded" />
        <div className="w-8 h-1 bg-gray-200 rounded mt-0.5" />
      </div>
    </div>
    <div className="mt-auto">
      <div className="rounded-t h-2 flex items-center px-1" style={{ backgroundColor: style.preview.headerBg }}>
        <span className="text-white font-bold" style={{ fontSize: "3px" }}>Description | Prix | Qté | Montant</span>
      </div>
      <div className="h-1.5" style={{ backgroundColor: style.preview.tableBg }} />
      <div className="h-1.5 bg-white" />
    </div>
    <div className="flex justify-end">
      <div className="rounded px-1.5 py-0.5" style={{ backgroundColor: style.preview.totalBg }}>
        <span className="text-white font-bold" style={{ fontSize: "4px" }}>Total TTC: 50 000 F</span>
      </div>
    </div>
    <div className="flex justify-between mt-auto">
      <div className="w-16 h-1 bg-gray-200 rounded" />
      <div className="w-10 h-5 border rounded" style={{ borderColor: style.preview.headerBg }} />
    </div>
    <div className="pt-0.5 border-t" style={{ borderColor: style.preview.headerBg }}>
      <div className="w-20 h-0.5 bg-gray-200 rounded mx-auto" />
    </div>
  </div>
);

// ── MODERN preview: full-width banner, side totals ──
const ModernPreview = ({ style }: { style: StyleOption }) => (
  <div className="w-full aspect-[3/4] rounded-lg border bg-white flex flex-col text-[6px] leading-tight shadow-sm overflow-hidden">
    {/* Full banner */}
    <div className="px-2 py-2 flex justify-between items-center" style={{ backgroundColor: style.preview.headerBg }}>
      <div>
        <div className="w-14 h-1.5 bg-white/80 rounded" />
        <div className="w-10 h-0.5 bg-white/40 rounded mt-0.5" />
      </div>
      <div className="text-right text-white font-bold" style={{ fontSize: "6px" }}>FACTURE</div>
    </div>
    <div className="px-3 pt-2 flex gap-4">
      <div className="flex-1 space-y-0.5">
        <div className="font-bold" style={{ color: style.preview.headerBg, fontSize: "3px" }}>ÉMETTEUR</div>
        <div className="w-12 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-0.5 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="font-bold" style={{ color: style.preview.headerBg, fontSize: "3px" }}>DESTINATAIRE</div>
        <div className="w-12 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-0.5 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="mx-3 mt-2">
      <div className="h-2 flex items-center px-1 rounded-t" style={{ backgroundColor: style.preview.headerBg }}>
        <span className="text-white font-bold" style={{ fontSize: "3px" }}># | Description | Qté | Total</span>
      </div>
      <div className="h-1.5" style={{ backgroundColor: style.preview.tableBg }} />
      <div className="h-1.5 bg-white border-b" style={{ borderColor: "#eee" }} />
    </div>
    <div className="mx-3 mt-auto mb-1 flex justify-end">
      <div className="rounded p-1 w-16" style={{ backgroundColor: style.preview.tableBg }}>
        <div className="w-full h-0.5 bg-gray-300 rounded mb-0.5" />
        <div className="rounded px-1 py-0.5" style={{ backgroundColor: style.preview.totalBg }}>
          <span className="text-white font-bold" style={{ fontSize: "3px" }}>TOTAL: 50 000 F</span>
        </div>
      </div>
    </div>
    <div className="px-2 py-1 text-center" style={{ backgroundColor: style.preview.headerBg }}>
      <div className="w-20 h-0.5 bg-white/40 rounded mx-auto" />
    </div>
  </div>
);

// ── MINIMAL preview: centered title, no boxes, clean lines ──
const MinimalPreview = ({ style }: { style: StyleOption }) => (
  <div className="w-full aspect-[3/4] rounded-lg border bg-white p-3 flex flex-col gap-1 text-[6px] leading-tight shadow-sm">
    <div className="text-center">
      <div className="font-bold" style={{ color: style.preview.textColor, fontSize: "8px" }}>FACTURE</div>
      <div className="w-8 h-0.5 mx-auto mt-0.5" style={{ backgroundColor: style.preview.textColor }} />
      <div className="text-gray-400 mt-0.5" style={{ fontSize: "3px" }}>N° 001 — 14/02/2026</div>
    </div>
    <div className="flex gap-4 mt-2 px-1">
      <div className="flex-1 space-y-0.5">
        <div className="text-gray-400" style={{ fontSize: "3px" }}>DE</div>
        <div className="w-12 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-0.5 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="text-gray-400" style={{ fontSize: "3px" }}>POUR</div>
        <div className="w-12 h-1 bg-gray-300 rounded" />
        <div className="w-10 h-0.5 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="mt-auto px-1">
      <div className="flex justify-between border-b pb-0.5" style={{ borderColor: "#ddd" }}>
        <span className="text-gray-400" style={{ fontSize: "3px" }}>Description</span>
        <span className="text-gray-400" style={{ fontSize: "3px" }}>Montant</span>
      </div>
      <div className="flex justify-between py-0.5">
        <span style={{ fontSize: "3px", color: style.preview.textColor }}>Sel – gros</span>
        <span style={{ fontSize: "3px", color: style.preview.textColor }}>25 000 F</span>
      </div>
      <div className="flex justify-between py-0.5 border-b" style={{ borderColor: "#ddd" }}>
        <span style={{ fontSize: "3px", color: style.preview.textColor }}>Sel – fin</span>
        <span style={{ fontSize: "3px", color: style.preview.textColor }}>25 000 F</span>
      </div>
    </div>
    <div className="flex justify-end px-1">
      <div>
        <div className="w-16 h-0.5 mt-1" style={{ backgroundColor: style.preview.textColor }} />
        <div className="text-right font-bold mt-0.5" style={{ color: style.preview.textColor, fontSize: "5px" }}>Total: 50 000 FCFA</div>
      </div>
    </div>
    <div className="mt-auto pt-0.5 border-t border-gray-200 text-center">
      <div className="w-20 h-0.5 bg-gray-200 rounded mx-auto" />
    </div>
  </div>
);

// ── ELEGANT preview: double border, gold accents, centered ──
const ElegantPreview = ({ style }: { style: StyleOption }) => (
  <div className="w-full aspect-[3/4] rounded-lg border bg-white flex flex-col text-[6px] leading-tight shadow-sm overflow-hidden">
    <div className="m-1.5 flex-1 flex flex-col border-2 p-2" style={{ borderColor: style.preview.headerBg }}>
      <div className="mx-1 border-t border-b py-0.5" style={{ borderColor: style.preview.headerBg }} />
      <div className="text-center mt-1">
        <div className="font-bold" style={{ color: style.preview.textColor, fontSize: "5px" }}>MON ENTREPRISE</div>
      </div>
      <div className="text-center mt-1">
        <div className="font-bold italic" style={{ color: style.preview.headerBg, fontSize: "7px" }}>Facture</div>
        <div className="text-gray-400 mt-0.5" style={{ fontSize: "3px" }}>N° 001</div>
      </div>
      <div className="mx-4 border-t mt-1" style={{ borderColor: style.preview.headerBg }} />
      <div className="mt-1.5 mx-1 rounded p-1" style={{ backgroundColor: style.preview.tableBg }}>
        <div className="flex gap-2">
          <div className="flex-1 space-y-0.5">
            <div className="font-bold" style={{ color: style.preview.headerBg, fontSize: "3px" }}>ÉMETTEUR</div>
            <div className="w-10 h-0.5 bg-gray-300 rounded" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="font-bold" style={{ color: style.preview.headerBg, fontSize: "3px" }}>CLIENT</div>
            <div className="w-10 h-0.5 bg-gray-300 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-auto mx-1">
        <div className="h-2 flex items-center px-1 rounded-t" style={{ backgroundColor: style.preview.headerBg }}>
          <span className="text-white font-bold" style={{ fontSize: "3px" }}>Description | Qté | Montant</span>
        </div>
        <div className="h-1.5" style={{ backgroundColor: style.preview.tableBg }} />
      </div>
      <div className="flex justify-center mt-1">
        <div className="rounded px-2 py-0.5" style={{ backgroundColor: style.preview.totalBg }}>
          <span className="text-white font-bold" style={{ fontSize: "4px" }}>Total TTC: 50 000 F</span>
        </div>
      </div>
      <div className="mx-4 border-t border-b py-0.5 mt-auto" style={{ borderColor: style.preview.headerBg }}>
        <div className="w-16 h-0.5 bg-gray-200 rounded mx-auto" />
      </div>
    </div>
  </div>
);

const PREVIEW_MAP: Record<InvoiceStyle, React.FC<{ style: StyleOption }>> = {
  classic: ClassicPreview,
  modern: ModernPreview,
  minimal: MinimalPreview,
  elegant: ElegantPreview,
};

export const InvoiceTemplateSelector = () => {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStyle, setSelectedStyle] = useState<InvoiceStyle>("classic");
  const [previewStyle, setPreviewStyle] = useState<InvoiceStyle | null>(null);

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
            tenant_id: tenant.id,
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

  const handlePreview = (e: React.MouseEvent, styleId: InvoiceStyle) => {
    e.stopPropagation();
    setPreviewStyle(styleId);
  };

  const getSampleData = (styleId: InvoiceStyle) => {
    const sampleInvoice = {
      invoiceNumber: "PREV-001",
      date: new Date().toLocaleDateString("fr-FR"),
      clientName: "Client Exemple",
      clientAddress: "123 Rue du Commerce, Dakar",
      clientPhone: "+221 77 123 45 67",
      clientEmail: "client@exemple.com",
      saltType: "Gros sel",
      quantity: 5000,
      unitPrice: 150,
      discount: 25000,
      totalAmount: 725000,
      paymentStatus: "pending",
      notes: "Livraison sous 48h",
    };
    const sampleCompany = {
      name: tenant?.name || "Mon Entreprise",
      address: "Zone Industrielle, Kaolack",
      phone: "+221 33 941 00 00",
      email: "contact@entreprise.sn",
      ninea: "123456789",
      rccm: "SN-DKR-2024-B-1234",
      managerName: "Modou Seck",
      city: "Kaolack",
      capital: "10 000 000 FCFA",
      logoUrl: tenant?.logo_url || undefined,
    };
    return { sampleInvoice, sampleCompany };
  };

  const handleDownloadPreview = async (styleId: InvoiceStyle) => {
    const { sampleInvoice, sampleCompany } = getSampleData(styleId);
    await generateInvoicePdf(sampleInvoice, sampleCompany, styleId);
  };

  const previewStyleData = previewStyle ? STYLES.find(s => s.id === previewStyle) : null;

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
                  {(() => { const Preview = PREVIEW_MAP[style.id]; return <Preview style={style} />; })()}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{style.name}</p>
                      {isSelected && <Badge variant="default" className="text-[10px] px-1.5 py-0">Actif</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{style.description}</p>
                  </div>
                  {/* Color swatches + Preview button */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1.5">
                      {Object.values(style.colors).map((color, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={(e) => handlePreview(e, style.id)}
                    >
                      <Eye className="h-3 w-3" />
                      Aperçu
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Preview Dialog */}
      <Dialog open={!!previewStyle} onOpenChange={(open) => !open && setPreviewStyle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Aperçu : {previewStyleData?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewStyle && previewStyleData && (() => {
              const Preview = PREVIEW_MAP[previewStyle];
              return (
                <div className="max-w-[320px] mx-auto">
                  <Preview style={previewStyleData} />
                </div>
              );
            })()}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {previewStyleData?.description}
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => previewStyle && handleDownloadPreview(previewStyle)}
            >
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={() => {
                if (previewStyle) {
                  handleSelect(previewStyle);
                  setPreviewStyle(null);
                }
              }}
            >
              <Check className="h-4 w-4" />
              Définir par défaut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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