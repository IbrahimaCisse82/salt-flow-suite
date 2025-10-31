import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTraceability } from "@/hooks/useTraceability";
import { Search, Package, FlaskConical, Award, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const TraceabilityView = () => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState<"traceability" | "batch">("traceability");
  const [activeSearch, setActiveSearch] = useState<{ code?: string; batch?: string }>({});

  const { data: traceData, isLoading } = useTraceability(
    activeSearch.code,
    activeSearch.batch
  );

  const handleSearch = () => {
    if (searchType === "traceability") {
      setActiveSearch({ code: searchValue, batch: undefined });
    } else {
      setActiveSearch({ batch: searchValue, code: undefined });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      passed: "default",
      failed: "destructive",
      conditional: "secondary",
      valid: "default",
      expired: "destructive",
      revoked: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de traçabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="traceability">Code de traçabilité</option>
              <option value="batch">Numéro de lot</option>
            </select>
            <Input
              placeholder={
                searchType === "traceability"
                  ? "Ex: TRACE-2025-001"
                  : "Ex: LOT-2025-001"
              }
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchValue}>
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chargement...
          </CardContent>
        </Card>
      )}

      {!isLoading && traceData && (
        <div className="space-y-6">
          {/* Production */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Production
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(traceData.production.production_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bassin</p>
                  <p className="font-medium">{traceData.production.bassin?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de sel</p>
                  <p className="font-medium">{traceData.production.salt_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantité</p>
                  <p className="font-medium">{traceData.production.quantity} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de lot</p>
                  <p className="font-medium">{traceData.production.batch_number || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code de traçabilité</p>
                  <p className="font-medium">
                    {traceData.production.traceability_code || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests qualité */}
          {traceData.qualityTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Tests qualité ({traceData.qualityTests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traceData.qualityTests.map((test: any) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">
                          {new Date(test.test_date).toLocaleDateString()}
                        </p>
                        {getStatusBadge(test.quality_status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score: </span>
                          <span className="font-medium">{test.quality_score || "-"}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Humidité: </span>
                          <span className="font-medium">{test.humidity_level || "-"}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pureté: </span>
                          <span className="font-medium">{test.salt_purity || "-"}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Testé par: </span>
                          <span className="font-medium">
                            {test.tested_by_profile?.full_name || "-"}
                          </span>
                        </div>
                      </div>
                      {test.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{test.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificats */}
          {traceData.certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificats qualité ({traceData.certificates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traceData.certificates.map((cert: any) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{cert.certificate_number}</p>
                        {getStatusBadge(cert.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium">{cert.certificate_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Émis le: </span>
                          <span className="font-medium">
                            {new Date(cert.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Grade: </span>
                          <span className="font-medium">{cert.quality_grade || "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantité: </span>
                          <span className="font-medium">
                            {cert.quantity_certified || "-"} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ventes */}
          {traceData.sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ventes liées ({traceData.sales.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {traceData.sales.map((sale: any) => (
                    <div key={sale.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{sale.client?.name || sale.customer_name}</p>
                        <Badge>{sale.payment_status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span className="font-medium">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantité: </span>
                          <span className="font-medium">{sale.quantity} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Montant: </span>
                          <span className="font-medium">{sale.total_amount} FCFA</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Livré: </span>
                          <span className="font-medium">{sale.delivered ? "Oui" : "Non"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !traceData && activeSearch.code && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun résultat trouvé pour cette recherche
          </CardContent>
        </Card>
      )}
    </div>
  );
};
