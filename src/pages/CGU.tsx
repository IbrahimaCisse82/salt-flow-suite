import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CGU = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Conditions Générales d'Utilisation (CGU)</h1>
          <p className="text-muted-foreground mb-8">
            Application SaaS – G-Suite Sel (Solutions pour la gestion professionnelle des marais salants)
            <br />
            Propriété de Grow Hub Sarl
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
            <p className="text-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») définissent les modalités et conditions d'utilisation de l'application SaaS G-Suite Sel – Solutions pour la gestion professionnelle des marais salants (ci-après « l'Application »), éditée et exploitée par Grow Hub Sarl.
            </p>
            <p className="text-foreground leading-relaxed">
              Elles ont pour but d'encadrer la relation contractuelle entre Grow Hub Sarl et tout utilisateur accédant à l'Application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Acceptation des CGU</h2>
            <p className="text-foreground leading-relaxed">
              L'utilisation de l'Application implique l'acceptation pleine et entière des présentes CGU.
            </p>
            <p className="text-foreground leading-relaxed">
              Grow Hub Sarl se réserve le droit de modifier les CGU à tout moment. Les utilisateurs seront informés de toute modification par notification ou affichage au sein de l'Application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Accès et disponibilité</h2>
            <p className="text-foreground leading-relaxed">
              L'Application est accessible en ligne 24h/24 et 7j/7, sauf interruption pour maintenance ou cas de force majeure.
            </p>
            <p className="text-foreground leading-relaxed">
              Grow Hub Sarl met en œuvre tous les moyens nécessaires pour assurer un accès fiable et sécurisé mais ne saurait garantir une disponibilité permanente sans interruption.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Création et gestion des comptes</h2>
            <p className="text-foreground leading-relaxed mb-2">
              Certaines fonctionnalités nécessitent la création d'un compte utilisateur.
            </p>
            <p className="text-foreground leading-relaxed mb-2">
              L'utilisateur s'engage à fournir des informations exactes et à jour lors de l'inscription.
            </p>
            <p className="text-foreground leading-relaxed">
              L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toute action réalisée via son compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Utilisation de l'Application</h2>
            <p className="text-foreground leading-relaxed mb-4">L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Utiliser G-Suite Sel uniquement dans un cadre professionnel conforme aux lois en vigueur.</li>
              <li>Ne pas détourner l'Application à des fins illicites, frauduleuses ou contraires aux présentes CGU.</li>
              <li>Ne pas publier, transférer ou stocker de données portant atteinte aux droits de tiers, à l'ordre public ou aux bonnes mœurs.</li>
              <li>Ne pas tenter de contourner les mesures de sécurité mises en place par Grow Hub Sarl.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Propriété intellectuelle</h2>
            <p className="text-foreground leading-relaxed mb-2">
              G-Suite Sel, son code source, son design, ses marques et logos sont et demeurent la propriété exclusive de Grow Hub Sarl.
            </p>
            <p className="text-foreground leading-relaxed mb-2">
              L'utilisateur dispose d'un droit d'accès et d'utilisation de l'Application dans le cadre d'une licence non exclusive, non transférable et strictement limitée à ses besoins professionnels.
            </p>
            <p className="text-foreground leading-relaxed">
              Toute reproduction, modification ou diffusion de tout ou partie de l'Application sans l'autorisation préalable et écrite de Grow Hub Sarl est interdite.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Services et facturation</h2>
            <p className="text-foreground leading-relaxed mb-2">
              L'accès à certaines fonctionnalités peut être soumis à un abonnement ou une licence payante.
            </p>
            <p className="text-foreground leading-relaxed mb-2">
              Les tarifs et modalités de facturation sont définis dans les conditions commerciales communiquées à l'utilisateur lors de la souscription.
            </p>
            <p className="text-foreground leading-relaxed">
              Le non-paiement des frais d'abonnement peut entraîner la suspension ou la résiliation du compte utilisateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Responsabilités</h2>
            <p className="text-foreground leading-relaxed mb-2">
              L'utilisateur est responsable des données saisies et des opérations effectuées via son compte.
            </p>
            <p className="text-foreground leading-relaxed mb-2">
              Grow Hub Sarl ne peut être tenu responsable des dommages directs ou indirects résultant d'une mauvaise utilisation de l'Application par l'utilisateur.
            </p>
            <p className="text-foreground leading-relaxed">
              Grow Hub Sarl décline toute responsabilité en cas de perte de données imputable à l'utilisateur, à un tiers ou à un cas de force majeure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Données personnelles et confidentialité</h2>
            <p className="text-foreground leading-relaxed mb-2">
              Grow Hub Sarl s'engage à traiter les données personnelles collectées conformément à la réglementation en vigueur (RGPD, lois locales).
            </p>
            <p className="text-foreground leading-relaxed mb-2">
              Les données sont utilisées uniquement dans le cadre de la gestion du service et ne sont pas transmises à des tiers sans autorisation.
            </p>
            <p className="text-foreground leading-relaxed">
              L'utilisateur dispose d'un droit d'accès, de rectification, d'opposition et de suppression de ses données.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Suspension et résiliation</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Grow Hub Sarl se réserve le droit de suspendre ou de résilier l'accès d'un utilisateur à l'Application en cas de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Non-respect des présentes CGU ;</li>
              <li>Non-paiement des frais d'abonnement ;</li>
              <li>Utilisation abusive ou frauduleuse de l'Application.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Droit applicable et juridiction compétente</h2>
            <p className="text-foreground leading-relaxed mb-2">
              Les présentes CGU sont régies par le droit en vigueur au Sénégal.
            </p>
            <p className="text-foreground leading-relaxed">
              Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis aux juridictions compétentes du ressort de Dakar, sauf dispositions légales contraires.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Grow Hub Sarl - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
};

export default CGU;
