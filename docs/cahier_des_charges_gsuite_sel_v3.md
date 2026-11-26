# CAHIER DES CHARGES DÉTAILLÉ — G-SUITE SEL (v3, 26 novembre 2026)
## Référentiel de test destiné à la génération d'un prompt de recette (ChatGPT / agent de test)

> **Usage de ce document** : il décrit, écran par écran, bouton par bouton, ce que l'application DOIT faire, les données attendues, les règles de gestion, les messages et les résultats chiffrés vérifiables. Chaque exigence porte un identifiant (`EX-xx`) et chaque cas de test un identifiant (`CT-xx`) afin qu'un testeur humain ou une IA puisse produire un plan de test exhaustif et un rapport « OK / KO / Bloqué ».

---

## Historique des versions
| Version | Date | Évolutions |
|---|---|---|
| v2 | sept. 2026 | Référentiel de recette initial |
| v3 | 26 nov. 2026 | Intégration des résultats de la recette 360, du durcissement sécurité et de l'audit (type Microsoft SDL / Google SRE) ; nouvelles exigences de sécurité et de qualité (NF-13 à NF-20) ; mise à jour des limites connues ; section 10 (état d'avancement) et section 11 (plan de remédiation) |

---

# 0. INFORMATIONS D'ACCÈS POUR LA RECETTE

| Élément | Valeur |
|---|---|
| URL de production | https://sel.g-suiteapp.com (Vercel) |
| URL publiée Lovable | https://g-suitesel.lovable.app |
| Compte démo global | Identifiants communiqués séparément (ne plus figurer dans ce document) |
| Entreprise de démonstration | « Demo Sel » (comptabilité automatique en mode **réel / live**) |
| Langue | Français uniquement |
| Devise | FCFA, format fr-FR (ex. `1 652 000 FCFA`), pas de décimales affichées sauf mention |
| Unité de quantité du sel | Tonnes (t) |
| Supports | Mobile d'abord (≥ 360 px), tablette, ordinateur ; installable (PWA) ; version bureau Electron |
| Navigateurs cibles | Chrome, Edge, Firefox, Safari (2 dernières versions) |

**Conventions visuelles à vérifier partout** : bouton rouge = action destructive (supprimer, annuler) avec confirmation ; couleur ambre = clôturer/terminer/en cours ; vert = terminé/validé ; squelettes de chargement pendant les requêtes ; messages de succès/erreur sous forme de notification (toast) en français.

---

# 1. CONTEXTE ET OBJECTIFS

## 1.1 Contexte
G-Suite Sel est un ERP métier pour les exploitations salinières d'Afrique de l'Ouest (zone OHADA/UEMOA). Il couvre la chaîne complète : bassins → campagne → production → stock → vente → comptabilité SYSCOHADA révisé → paie.

## 1.2 Objectifs mesurables
- EX-01 : chaque opération métier (achat réceptionné, vente livrée, paie payée, amortissement, cession) génère automatiquement une écriture comptable équilibrée (débit = crédit, tolérance 0,005 FCFA).
- EX-02 : les données d'une entreprise ne sont jamais visibles par une autre (isolation multi-entreprises).
- EX-03 : chaque utilisateur ne voit que les écrans de son rôle.
- EX-04 : aucun écran ne doit afficher d'erreur technique brute (message SQL, stack trace) à l'utilisateur.

---

# 2. RÔLES ET MATRICE D'ACCÈS

## 2.1 Rôles existants (liste exhaustive — aucun autre rôle ne doit apparaître)
| Code | Libellé affiché | Description |
|---|---|---|
| admin | Administrateur | Back-office plateforme (toutes entreprises) |
| gerant | Gérant | Propriétaire de l'entreprise, accès total à son entreprise |
| comptable | Comptable | Comptabilité, trésorerie, clôture |
| commercial | Commercial | Clients, commandes, factures, livraisons |
| chef_production | Chef de production | Bassins, campagne, production, stocks, équipes |
| rh | Ressources humaines | Personnel, pointage, paie |
| magasinier | Magasinier | Stocks et mouvements |
| qualite | Qualité | Contrôles qualité de production |

Priorité si un utilisateur a plusieurs rôles : admin > gerant > comptable > chef_production > commercial > rh > magasinier > qualite.

## 2.2 Matrice d'accès aux pages (à tester rôle par rôle)
Légende : ✅ accessible — ❌ doit afficher « Accès refusé » ou rediriger.

| Page (URL) | admin | gerant | comptable | commercial | chef_prod | rh | magasinier | qualite |
|---|---|---|---|---|---|---|---|---|
| Tableau de bord `/` | ❌ (→/admin) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bassins `/bassins` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Campagne `/campagne` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Production `/production` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Stocks `/stocks` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Équipes / RH `/equipes` | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Commercial `/commercial` | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Achats `/achats` | ❌ | ✅ | selon config | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comptabilité `/comptabilite` + sous-pages (grand-livre, rapprochement, operations-diverses, cloture, immobilisations) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rapports `/rapports` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Utilisateurs `/utilisateurs` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Paramètres `/parametres` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin `/admin`, `/admin/tenants`, `/admin/users`, `/admin/roles`, `/admin/chart-of-accounts`, `/admin/expense-types`, `/admin/monitoring`, `/admin/audit-logs`, `/admin/settings`, `/admin/email-templates` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

- CT-01 : pour chaque rôle, taper chaque URL directement dans la barre d'adresse et vérifier le comportement du tableau.
- CT-02 : le menu latéral / barre de navigation mobile ne montre QUE les entrées autorisées.
- CT-03 : `/gestion-utilisateurs` redirige vers `/utilisateurs` ; une URL inconnue affiche la page 404 en français.

---

# 3. EXIGENCES FONCTIONNELLES DÉTAILLÉES PAR MODULE

## 3.1 Authentification (`/auth`)
**Éléments d'écran** : onglets Connexion / Inscription, champs e-mail et mot de passe, bouton « Se connecter », bouton « Créer un compte », lien mot de passe oublié, lien CGU.

- EX-10 Inscription : e-mail valide + mot de passe (≥ 8 caractères) + nom de l'entreprise. Crée automatiquement : une entreprise, un profil, le rôle **gérant**, les équipes de production par défaut et le plan comptable SYSCOHADA. Confirmation par e-mail requise (pas d'auto-confirmation).
- EX-11 Connexion réussie → redirection vers `/` (ou `/admin` pour un administrateur).
- EX-12 Erreurs attendues (en français) : identifiants incorrects, e-mail non confirmé, champ vide, format e-mail invalide.
- EX-13 Utilisateur ou entreprise désactivé → déconnexion immédiate et message explicite.
- EX-14 Déconnexion depuis le menu profil → retour à `/auth`, impossible de revenir en arrière avec le bouton Précédent.

| CT | Action | Résultat attendu |
|---|---|---|
| CT-10 | Se connecter avec le compte démo | Tableau de bord affiché, nom de l'entreprise visible |
| CT-11 | Mauvais mot de passe | Toast d'erreur, reste sur `/auth` |
| CT-12 | Créer un nouveau compte | Message « vérifiez vos e-mails » ; après confirmation, connexion → rôle Gérant, entreprise vide mais plan comptable présent |
| CT-13 | Rafraîchir la page connecté | Reste connecté, pas d'écran qui clignote ou recharge en boucle |

## 3.2 Tableau de bord (`/`)
- EX-20 Cartes indicateurs (KPI) : production cumulée (t), stock disponible (t), chiffre d'affaires (FCFA), trésorerie (banques + caisses), dépenses, marge.
- EX-21 Personnalisation : l'utilisateur choisit les KPI affichés ; le choix est conservé après déconnexion/reconnexion.
- EX-22 Graphiques (production, ventes, trésorerie) ; aucune valeur `NaN`, `undefined` ou négatif incohérent.
- EX-23 Météo locale basée sur la position des bassins.
- CT-20 : modifier les KPI affichés, se déconnecter, se reconnecter → mêmes KPI.

## 3.3 Bassins (`/bassins`)
**Boutons** : « Nouveau bassin », Modifier, Supprimer, vue carte.
- EX-30 Champs : nom (obligatoire), superficie (ha, > 0), statut (actif / en préparation / inactif), localisation (latitude/longitude, sélection sur carte OpenStreetMap, adresse retrouvée automatiquement).
- EX-31 Le bassin apparaît sur la carte à ses coordonnées.
- EX-32 Suppression = suppression douce (disparaît de la liste, conservé en base) ; impossible si production rattachée non clôturée → message.
- CT-30 : créer « Bassin Test 1 », 2 ha → apparaît dans la liste et sur la carte. CT-31 : superficie négative → refusé.

## 3.4 Plan de campagne (`/campagne`)
- EX-40 Formulaire en plusieurs étapes : informations (nom, dates début/fin, objectif en tonnes), bassins concernés, budget (par poste), validation.
- EX-41 Une seule campagne **active** à la fois par entreprise.
- EX-42 Budget suivi sur 3 niveaux (campagne / poste / dépense) ; dépassement → blocage des nouvelles dépenses et alerte.
- EX-43 Clôture de campagne (bouton ambre) → génère un bilan : production réelle vs objectif, dépenses vs budget, coût par tonne.
- CT-40 : créer une campagne avec budget 5 000 000 FCFA → statut active. CT-41 : tenter une 2e campagne active → refus. CT-42 : clôturer → résumé affiché.

## 3.5 Production (`/production`)
- EX-50 Enregistrement : bassin, date, quantité (t > 0), équipe, qualité du sel. Uniquement pour les rôles gérant / chef de production (qualité : lecture + contrôles).
- EX-51 Contrôle de capacité : quantité incohérente avec la capacité du bassin → alerte/refus.
- EX-52 Statuts : en cours (ambre) → terminé (vert). À la validation, le stock de produit fini augmente (compte 361 / 736 production stockée).
- EX-53 Qualité : test qualité avec score 0–100, certificat qualité lié à la production et au test ; actions correctives.
- EX-54 Coût de revient dynamique : main-d'œuvre + matières + amortissements → coût par tonne calculé.
- CT-50 : enregistrer 50 t → stock +50 t, écriture 361/736 générée. CT-51 : score qualité 120 → refusé.

## 3.6 Stocks (`/stocks`)
- EX-60 Liste des articles avec quantité (t), coût moyen, valeur (FCFA), entrepôt.
- EX-61 Mouvements : entrée, sortie, transfert entre entrepôts, ajustement d'inventaire. Opérations atomiques (deux utilisateurs simultanés ne peuvent pas créer de stock négatif).
- EX-62 Stock négatif interdit → message.
- EX-63 Valorisation FIFO/CMP ; instantané mensuel.
- EX-64 Écarts d'inventaire : manquant → 6588 ; excédent → 7588.
- EX-65 Réservations de stock lors d'une commande client.
- CT-60 : sortie de 1 000 t alors que stock = 60 t → refus. CT-61 : transfert 10 t entrepôt A→B → totaux inchangés.

## 3.7 Achats (`/achats`)
- EX-70 **Pré-requis** : une campagne active avec budget doit exister, sinon le bouton de création est bloqué avec un message explicatif (comportement voulu).
- EX-71 Cycle : brouillon → validé → réception partielle / totale → payé. Réceptions incrémentales (plusieurs livraisons partielles possibles).
- EX-72 Une commande réceptionnée est verrouillée (non modifiable).
- EX-73 Réception → stock augmente + coût moyen mis à jour.
- EX-74 Écriture automatique à la réception : Débit **602** (HT) + Débit **4452** TVA récupérable / Crédit **401** Fournisseur (TTC). Paiement : Débit 401 / Crédit 521 (banque) ou 571 (caisse).
- **Cas chiffré de référence** : 100 t × 20 000 FCFA HT, TVA 18 % → HT 2 000 000, TVA 360 000, TTC **2 360 000 FCFA** ; stock 0 → 100 t.
- CT-70 : reproduire le cas chiffré et vérifier le Grand Livre. CT-71 : réception partielle 40 t puis 60 t → statut final « réceptionné ». CT-72 : dépasser le budget campagne → blocage.

## 3.8 Commercial (`/commercial`)
Onglets : Clients, Commandes / Ventes, Factures, Livraisons, Paiements.
- EX-80 Client : nom (obligatoire), téléphone, e-mail, adresse, type **Local** (UEMOA/CEDEAO) ou **Export**.
- EX-81 Vente multi-articles, sources de produits mixtes ; option « peut être livré ».
- EX-82 Cycle : commande → facturée → livrée → terminée. Facture livrée = verrouillée.
- EX-83 Facture PDF en 4 styles, avec logo de l'entreprise (taille correcte) et en-tête.
- EX-84 Écritures automatiques : Débit **411** (TTC) / Crédit **7021** (vente dans la Région) ou **7022** (hors Région/export) + Crédit **4431** TVA facturée (local ; export = hors taxe). Coût des ventes à la livraison : Débit **736** / Crédit **361**. Encaissement : Débit 521/571 / Crédit 411.
- **Cas chiffré** : 40 t × 35 000 FCFA HT local → HT 1 400 000, TVA 252 000, TTC **1 652 000 FCFA** ; coût des ventes 40 × 20 000 = **800 000 FCFA** ; stock 100 → 60 t.
- CT-80 : créer « Client Test Clic » → apparaît dans la liste. CT-81 : reproduire le cas chiffré. CT-82 : vente export → aucun 4431, compte 7022. CT-83 : télécharger la facture dans les 4 styles, vérifier logo et montants. CT-84 : vendre plus que le stock → refus.

## 3.9 Équipes, RH et Paie (`/equipes`)
- EX-90 Employés : matricule auto `EMP0001`, `EMP0002`…, nom, poste, type **Permanent** (salaire mensuel), **Saisonnier** (forfait campagne), **Journalier** (taux journalier).
- EX-91 Équipes de production (créées par défaut pour une nouvelle entreprise), affectation des employés.
- EX-92 Pointage des présences → validation RH → notification au comptable.
- EX-93 La validation d'une présence comptabilise la charge : Débit **661** / Crédit **422**.
- EX-94 Paiement de paie : choix du compte banque ou caisse (liste ne doit jamais être vide s'il existe des comptes) ; Débit **422** / Crédit **521** (virement) ou **571** (espèces) ; le solde du compte diminue.
- EX-95 Congés : demande, validation, solde.
- **Cas chiffré** : paie 150 000 FCFA par virement → 422/521, solde banque −150 000.
- CT-90 : créer 2 employés → matricules consécutifs. CT-91 : ouvrir le formulaire de paiement → liste des comptes chargée sans erreur. CT-92 : payer 150 000 FCFA → écriture + solde mis à jour.

## 3.10 Comptabilité SYSCOHADA révisé (`/comptabilite`)
### 3.10.1 Onglets principaux
Transactions, Comptes de trésorerie (banques/caisses), Plan comptable, Types de dépenses, États financiers.
- EX-100 Création compte banque/caisse : nom, type (banque / caisse / mobile money), solde initial → préfixe auto (521x banque, 571x caisse, 552 mobile money). CT-100 : créer une caisse à 100 000 FCFA → solde affiché 100 000.
- EX-101 Mode de paiement cohérent : espèces → caisse uniquement ; virement/chèque → banque uniquement.
- EX-102 Virements internes entre comptes : les deux soldes s'ajustent, total inchangé.
- EX-103 Saisie manuelle interdite sur comptes de capital sensibles (classe 10, 11, 12, 13) → message.

### 3.10.2 Plan comptable de référence (numéros obligatoires)
| Opération | Compte |
|---|---|
| Clients / Fournisseurs | 411 / 401 |
| Avances fournisseurs / clients | 4091 / 4191 |
| Achats stockés (matières) / marchandises revendues en l'état | 602 / 601 |
| TVA récupérable sur achats / TVA facturée | 4452 / 4431 |
| Ventes produits finis Région / hors Région | 7021 / 7022 |
| Stock produits finis / variation (production stockée, coût des ventes) | 361 / 736 |
| Écarts inventaire charge / produit | 6588 / 7588 |
| Salaires / personnel rémunérations dues | 661 / 422 |
| Banque / caisse / mobile money | 521 / 571 / 552 |
| Frais bancaires | 631 |
| Dotations amortissements / amortissements | 681 / 28x |
| Bâtiments / matériel | 23 / 24 |
| Résultat bénéfice / perte | 131 / 139 |
| Report à nouveau créditeur / débiteur | 121 / 129 |
| Réserves | 111 |

### 3.10.3 Grand Livre (`/comptabilite/grand-livre`)
- EX-104 Liste des écritures par journal, date, compte, libellé, débit, crédit ; filtres par période et compte ; total débit = total crédit.
- EX-105 Écritures validées = non modifiables, non supprimables (append-only) ; correction uniquement par écriture de contrepassation.
- EX-106 Panneau « écritures en attente (shadow) » visible pour les entreprises en mode shadow ; « Demo Sel » est en mode live.
- CT-104 : après les cas chiffrés 3.7/3.8/3.9, vérifier chaque écriture et l'équilibre.

### 3.10.4 Rapprochement bancaire (`/comptabilite/rapprochement`)
- EX-107 Pointage relevé vs écritures ; écart affiché ; marquage « rapproché ».

### 3.10.5 Opérations diverses (`/comptabilite/operations-diverses`)
- EX-108 Écriture OD multi-lignes ; enregistrement refusé si déséquilibrée ; refusée sur période clôturée.

### 3.10.6 Immobilisations (`/comptabilite/immobilisations`)
- EX-109 Création (valeur, date, durée) → amortissement linéaire calculé au prorata 30 jours/mois (SYSCOHADA) ; dotation 681/28x.
- EX-110 Cession ou mise au rebut : sortie de l'actif, amortissements cumulés soldés, plus/moins-value comptabilisée. Suppression interdite si amortissements passés.
- CT-109 : immobilisation 1 200 000 FCFA sur 5 ans → dotation annuelle 240 000, mensuelle 20 000.

### 3.10.7 Clôture d'exercice (`/comptabilite/cloture`)
Écran en 3 étapes :
1. **Clôturer l'exercice** : solde les classes 6 et 7 vers 131 (bénéfice) ou 139 (perte) — journal CLO.
2. **Affecter le résultat** : réserves 111, report à nouveau 121/129, dividendes — journal AFF.
3. **Générer les à-nouveaux** : reprise des soldes de bilan (classes 1 à 5) sur le nouvel exercice — journal AN.
- EX-111 Après clôture, toute écriture sur la période close est refusée.
- EX-112 Accès réservé gérant / comptable ; un autre rôle obtient une erreur d'autorisation.
- CT-111 : tenter une OD datée dans l'exercice clôturé → refus.

### 3.10.8 États financiers
Onglets : Générer, Bilans, Comptes de résultat, TAFIRE.
- EX-113 Bilan : total actif = total passif. Compte de résultat : produits − charges = résultat (identique à 131/139). TAFIRE : flux de trésorerie cohérents avec la variation de trésorerie.
- EX-114 Statuts : brouillon → validé → clôturé ; export PDF.

### 3.10.9 Comptabilité analytique
- EX-115 Centres de coûts par bassin ; répartition des charges ; rentabilité par bassin.

## 3.11 Rapports (`/rapports`)
- EX-120 Rapports production, ventes, stocks, RH, financiers ; filtres période ; export PDF/Excel ; graphiques rentabilité et alertes budget.
- CT-120 : exporter chaque rapport → fichier non vide, montants identiques à l'écran.

## 3.12 Utilisateurs (`/utilisateurs`, gérant)
- EX-130 Inviter un utilisateur par e-mail avec un rôle parmi : comptable, commercial, chef de production, RH, magasinier, qualité. **Le rôle Gérant ne peut pas être attribué par invitation.**
- EX-131 Modifier le rôle, désactiver/réactiver un utilisateur (désactivation = déconnexion immédiate).
- CT-130 : la liste des rôles ne contient ni « Production » ni « Gérant ». CT-131 : inviter un magasinier → il ne voit que Accueil, Stocks, Paramètres.

## 3.13 Paramètres (`/parametres`)
- EX-140 Profil (nom, téléphone), mot de passe, informations entreprise (nom, adresse, NINEA/RCCM, logo — stockage isolé par entreprise), préférences de facture, notifications push, thème.
- CT-140 : téléverser un logo → apparaît sur les factures PDF.

## 3.14 Administration plateforme (`/admin/*`, admin uniquement)
Tableau de bord global, Entreprises (activer/désactiver), Utilisateurs, Rôles, Plan comptable global, Types de dépenses, Monitoring (métriques de performance), Journaux d'audit (sécurité + activité admin), Paramètres, Modèles d'e-mails.
- CT-150 : désactiver une entreprise → ses utilisateurs sont déconnectés.

## 3.15 Notifications
- EX-160 Notifications temps réel : nouvelle transaction, seuil de stock bas, dépassement budget, présences validées (RH → comptable). Push navigateur si autorisé.

---

# 4. EXIGENCES NON FONCTIONNELLES (TESTABLES)
| ID | Exigence | Méthode de test |
|---|---|---|
| NF-01 | Isolation : utilisateur entreprise A ne voit aucune donnée de B | Créer 2 comptes, comparer les listes, tenter d'accéder à un ID de B via l'URL |
| NF-02 | Opérations sensibles vérifient le rôle côté serveur | Un commercial ne peut pas lancer une clôture même en forçant l'appel |
| NF-03 | Protection XSS | Saisir `<script>alert(1)</script>` dans un nom de client → affiché en texte, aucune alerte |
| NF-04 | Validation des formulaires | Champs obligatoires vides, nombres négatifs, texte dans champ numérique → messages clairs |
| NF-05 | Performance | Première page < 3 s en 4G ; navigation entre modules < 1 s ; pas d'écran qui tremble |
| NF-06 | Hors ligne | Couper le réseau : l'app s'ouvre, les données en cache s'affichent, les saisies sont mises en file et synchronisées au retour |
| NF-07 | Mise à jour | Nouvelle version → invite « Mettre à jour » (pas de rechargement forcé) |
| NF-08 | Mobile | Toutes les pages utilisables à 360 px, pas de défilement horizontal, zones sûres respectées |
| NF-09 | Précision | Aucun arrondi flottant : 0,1 + 0,2 affiché 0,30 ; montants FCFA exacts |
| NF-10 | Traçabilité | Toute modification financière enregistrée dans le journal d'audit |
| NF-11 | Suppression | Suppressions douces ; profils supprimés conservés comme « utilisateur supprimé » dans l'historique |
| NF-12 | Accessibilité | Navigation clavier, libellés sur les champs, contraste suffisant (WCAG 2.1 AA ; contrôle automatisé axe : 0 violation, écran par écran) |
| NF-13 | Fonctions serveur (SECURITY DEFINER) | Aucune fonction n'est exécutable sans connexion ; chaque fonction recevant un identifiant d'entreprise vérifie l'appartenance de l'utilisateur à cette entreprise ; `search_path` fixé |
| NF-14 | Droits de la base | Le rôle anonyme n'a aucun droit sur les tables ; RLS activée avec politiques sur 100 % des tables ; aucune politique ouverte à tous |
| NF-15 | Dépendances | Zéro vulnérabilité critique ou élevée en production ; contrôle `npm audit` dans la CI |
| NF-16 | Secrets | Aucun secret (clé de service, mot de passe) dans le dépôt ni dans la documentation ; seules les clés publiques sont versionnées |
| NF-17 | Tests automatisés | `npm test` exécute l'ensemble des tests unitaires (299 au 26/11/2026) ; typage `tsc` sans erreur ; lint bloquant dans la CI à terme |
| NF-18 | Déploiement | Déploiement progressif avec retour arrière documenté ; sauvegardes et restauration testées |
| NF-19 | Observabilité | Journaux d'erreurs et métriques de performance consultables ; alertes sur échec des écritures comptables |
| NF-20 | Intégrité comptable | Contrôle automatisé périodique : balance équilibrée, bilan équilibré, soldes de trésorerie = écritures |

---

# 5. SCÉNARIO DE RECETTE DE BOUT EN BOUT (ordre obligatoire)
Connecté en **Gérant** sur une entreprise propre :
1. Créer un compte banque « Banque Test » (solde 5 000 000) et une caisse « Caisse Test » (100 000).
2. Créer un bassin « Bassin E2E » 3 ha avec localisation.
3. Créer une campagne active, objectif 500 t, budget 10 000 000 FCFA.
4. Créer un fournisseur, une commande d'achat 100 t × 20 000 HT, TVA 18 % → valider → réceptionner. **Attendu** : stock 100 t, écriture 602 2 000 000 + 4452 360 000 / 401 2 360 000.
5. Payer le fournisseur par virement. **Attendu** : 401/521 2 360 000, banque = 2 640 000.
6. Enregistrer une production de 50 t. **Attendu** : stock 150 t, écriture 361/736.
7. Créer un client local, vente 40 t × 35 000 HT → facturer → livrer. **Attendu** : 411 1 652 000 / 7021 1 400 000 + 4431 252 000 ; 736/361 coût ; stock 110 t.
8. Encaisser la facture en espèces. **Attendu** : 571/411 1 652 000 ; caisse = 1 752 000.
9. Créer un employé permanent 150 000 FCFA, pointer, valider (661/422), payer par virement (422/521).
10. Générer Bilan, Compte de résultat, TAFIRE → équilibres vérifiés.
11. Clôturer l'exercice, affecter le résultat, générer les à-nouveaux.
12. Se connecter avec chaque autre rôle et vérifier la matrice §2.2.

---

# 6. CRITÈRES D'ACCEPTATION
- 100 % des cas CT-xx « critiques » (auth, isolation, écritures comptables, stock, rôles) OK.
- Aucune erreur technique visible, aucun écran blanc, aucune boucle de rechargement.
- Toutes les écritures équilibrées ; comptes conformes au tableau §3.10.2.
- ≥ 95 % des autres cas OK, les KO restants documentés et non bloquants.

# 7. LIMITES CONNUES (ne pas signaler comme anomalies)
- Les libellés de certains comptes de trésorerie peuvent apparaître sous les numéros 5211 / 4011 dans l'interface (libellés en dur) ; les écritures utilisent bien les comptes 521 / 401.
- Les « entrepôts » sont des articles de stock de catégorie « warehouse » (la quantité représente la capacité).
- Un bassin n'apparaît dans les listes de récolte que s'il est actif et de type « Table Salante ».
- Les anciennes écritures de démonstration de « Demo Sel » portent d'anciens numéros (601, 4451, 701, 6031) : le Grand Livre est append-only.
- La création d'un achat est bloquée tant qu'aucune campagne active avec budget n'existe (règle voulue).
- Les autres entreprises que « Demo Sel » sont en comptabilité **shadow** : les écritures apparaissent d'abord dans le panneau d'attente.

# 8. FORMAT DE RAPPORT ATTENDU DU TESTEUR
Pour chaque cas : `ID | Module | Rôle | Étapes | Résultat attendu | Résultat obtenu | Statut (OK/KO/Bloqué) | Gravité (Bloquante/Majeure/Mineure) | Capture`.

# 9. CONSIGNE POUR CHATGPT
« À partir de ce cahier des charges, génère un prompt de test complet pour un agent de test navigateur : couvrir tous les EX et CT, la matrice des rôles §2.2, le scénario §5 avec vérification des montants, les tests NF §4, et produire un rapport au format §8. »


---

# 10. ÉTAT D'AVANCEMENT AU 26 NOVEMBRE 2026 (recette 360 et audit)
Estimation globale de finalisation : **environ 74 %** (le seuil de 99 % n'est pas atteint).

## 10.1 Parcours testés avec écriture en conditions réelles (OK après corrections)
Création d'entrepôts et de stocks ; récolte ; cycle de vente (commande, facture, livraison, encaissement) ; avoirs avec retour physique en stock ; virement interne ; création de fournisseurs ; catégories de dépenses et budget ; cycle d'achat (création, approbation, paiement, réception) ; paie avec pointage ; propagation des paiements fournisseurs ; indicateur « livrable » des factures.

## 10.2 Corrections apportées (traces SQL dans le dossier `handoff/`)
- Synchronisation des alias de colonnes de stock et de lignes d'achat ; colonnes d'achats ajoutées ; application automatique des paiements fournisseurs ; valeurs d'énumération des types de fournisseur.
- Catégories de dépenses créées automatiquement pour chaque nouvelle entreprise ; normalisation du statut des bassins.
- Comptabilisation : compte de trésorerie selon le mode de paiement, virements internes non doublés, solde initial vers le compte 121, résolution automatique du compte des lignes d'écriture.
- Sécurité (26/11/2026) : retrait de l'exécution anonyme sur les 87 fonctions SECURITY DEFINER, retrait des droits de table du rôle anonyme, contrôle d'appartenance à l'entreprise sur la numérotation des documents.
- Application : clôture de campagne (statut valide `cloturee`), accessibilité de l'écran de connexion (0 violation axe), vulnérabilités de production ramenées de 36 (3 critiques) à 7 (aucune critique), script `npm test` ajouté, tests de sanitisation exécutés sous un DOM réel. Ces corrections de code sont sur la branche `claude/lots-pour-lovable`, non encore fusionnée.

## 10.3 Méthode d'audit retenue (référentiels du secteur)
- **Microsoft SDL** : modélisation des menaces, analyse statique, recherche de secrets, fuzzing, revue de configuration, gouvernance des composants, tests d'intrusion, déploiement par anneaux, surveillance en production.
- **Google SRE (liste de lancement)** : architecture et dépendances, capacité, modes de panne, automatisation, déploiement progressif avec indicateurs, tests de surcharge ; pyramide de tests petits / moyens / grands.
- **Matrice de conformité G-Suite Sel** :

| Type d'audit | Statut |
|---|---|
| Typage et compilation | Conforme |
| Tests unitaires | Conforme (299/299) |
| Secrets dans le dépôt | Conforme (clés publiques seulement) ; mot de passe démo retiré de ce document |
| Isolation par entreprise (RLS) | Conforme (62 tables) ; contrôles complémentaires sur les fonctions corrigés |
| Dépendances | Partiel (7 vulnérabilités restantes : 5 modérées, 2 élevées) |
| Accessibilité | Partiel (écran de connexion conforme ; écrans connectés à auditer) |
| Performance | Partiel (écran de connexion ≈ 0,2 s ; écrans connectés à mesurer) |
| Droits par rôle (matrice §2.2) | Non testé |
| Invitation d'utilisateur, PDF, import Excel | Non testés |
| Tests d'intrusion externes, fuzzing, tests de charge | Non réalisés |
| Sauvegarde / restauration, retour arrière | Non vérifiés |
| Intégration continue | Partiel (lint non bloquant : 324 erreurs, surtout types `any`) |

---

# 11. PLAN DE REMÉDIATION PRIORISÉ
1. Fusionner la branche de corrections et republier l'application (clôture de campagne, accessibilité, tests).
2. Tester la matrice des rôles §2.2 avec un compte par rôle (CT-01 à CT-03, CT-131).
3. Tester invitation d'utilisateur, génération de PDF (4 styles) et import Excel (CT-83, CT-120).
4. Mettre à jour les dépendances restantes (changements de version majeure à valider) et ajouter `npm audit` à la CI.
5. Rendre le lint bloquant après réduction des erreurs ; ajouter des tests sur les écritures comptables.
6. Auditer l'accessibilité et mesurer la performance de tous les écrans connectés ; viser NF-05 et NF-12.
7. Mettre en place sauvegardes testées, procédure de retour arrière et alertes d'échec comptable (NF-18, NF-19, NF-20).
8. Décisions en attente du propriétaire : nettoyage des ventes de test « GEST-SA », conservation ou abandon de la version Electron, maintien de la fonction de démonstration `demo_run_full_cycle()`.
