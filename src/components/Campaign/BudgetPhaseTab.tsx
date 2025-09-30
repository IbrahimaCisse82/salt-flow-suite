import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetField {
  id: string;
  label: string;
}

interface BudgetPhaseTabProps {
  phase: string;
  budgetValues: Record<string, number>;
  onBudgetChange: (field: string, value: string) => void;
}

const budgetFields: BudgetField[] = [
  { id: "frais-journaliers", label: "Frais journaliers" },
  { id: "frais-employes", label: "Frais employés contractants" },
  { id: "carburant", label: "Carburant" },
  { id: "motopompes", label: "Motopompes" },
  { id: "machines-broyage", label: "Machines de broyage" },
  { id: "machine-lavage", label: "Machine de lavage" },
  { id: "machine-iodation", label: "Machine d'iodation" },
  { id: "materiel-digues", label: "Matériel de création de digues" },
  { id: "epi", label: "EPI" },
  { id: "repas", label: "Repas" },
  { id: "transport", label: "Transport" },
  { id: "telephone", label: "Téléphone" },
  { id: "tracteurs", label: "Tracteurs" },
  { id: "pelles", label: "Pelles" },
  { id: "brouettes", label: "Brouettes" },
  { id: "sacs", label: "Sacs" },
  { id: "balance", label: "Balance" },
  { id: "testeur", label: "Testeur" },
  { id: "location-marais", label: "Location de marais salants" },
  { id: "achat-marais", label: "Achat de marais salants" },
];

export const BudgetPhaseTab = ({ phase, budgetValues, onBudgetChange }: BudgetPhaseTabProps) => {
  const getFieldId = (fieldId: string) => `${phase}-${fieldId}`;

  return (
    <div className="space-y-4">
      {budgetFields.map((field, index) => {
        if (index % 2 === 0) {
          const nextField = budgetFields[index + 1];
          return (
            <div key={field.id} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={getFieldId(field.id)}>{field.label} (FCFA)</Label>
                <Input
                  id={getFieldId(field.id)}
                  type="number"
                  placeholder="0"
                  value={budgetValues[getFieldId(field.id)] || ''}
                  onChange={(e) => onBudgetChange(getFieldId(field.id), e.target.value)}
                />
              </div>
              {nextField && (
                <div className="space-y-2">
                  <Label htmlFor={getFieldId(nextField.id)}>{nextField.label} (FCFA)</Label>
                  <Input
                    id={getFieldId(nextField.id)}
                    type="number"
                    placeholder="0"
                    value={budgetValues[getFieldId(nextField.id)] || ''}
                    onChange={(e) => onBudgetChange(getFieldId(nextField.id), e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
