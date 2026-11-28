# SeniorCare

Application de veille bienveillante entre des seniors et leur famille.

- Le **senior** appuie sur « Je vais bien » (ou « Pas très en forme »), ou maintient le bouton **URGENCE**.
- Sa **famille** voit l'état en **temps réel** sur son propre écran, reçoit les urgences et peut les clôturer.

| Partie     | Technologies                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `mobile/`  | React Native · Expo SDK 58 · Expo Go · expo-router · expo-blur · TypeScript · Socket.IO client |
| `backend/` | NestJS 11 · TypeORM · PostgreSQL · JWT · Swagger · Socket.IO                                   |

## État actuel du projet

### Fonctionnalités déjà présentes

- **Comptes et accès** : inscription en tant que senior ou membre de la famille, connexion par e-mail et mot de passe, déconnexion et restauration de la session au redémarrage de l'app.
- **Rôle senior** : code d'invitation unique à 6 caractères, pointage « Je vais bien » ou « Pas très en forme », affichage du dernier pointage et bouton SOS déclenché par un appui long de 1,5 seconde. Le senior peut annuler une alerte active.
- **Navigation et apparence** : barre d'onglets flottante avec fond flouté, accès à l'accueil, aux photos, aux contacts, aux réglages et au profil. Le mode clair/sombre est mémorisé sur l'appareil.
- **Réglages** : activation du mode sombre et du rappel quotidien de pointage (heure configurable), rubrique confidentialité et mentions légales. Les coordonnées de l'éditeur, l'hébergement, les durées de conservation et les modalités d'exercice des droits restent à renseigner avant publication.
- **Profil et répertoire du senior** : modification du nom et de l'e-mail, changement du mot de passe avec vérification de l'ancien, ajout/remplacement/suppression d'une photo privée et suppression du compte avec confirmation. La récupération « mot de passe oublié » reste à implémenter. Le senior peut aussi gérer ses contacts personnels et contacter ses proches depuis le répertoire.
- **Rôle famille** : rattachement à un senior avec son code, tableau de bord des seniors suivis, état du jour et dernière nouvelle, historique chronologique des pointages et alertes, messages vocaux reçus et clôture d'une urgence.
- **Album photo familial** : envoi de photos et de petits mots par les proches, onglets « Photo du jour », « Toutes » et « Souvenirs », grille responsive virtualisée sur la vue du senior, photo surprise du jour, cœur du senior et lecture vocale des messages. L'API renvoie au plus les 100 photos les plus récentes.
- **Alertes et temps réel** : une alerte active à la fois par senior; les pointages, nouvelles alertes et clôtures sont transmis aux appareils connectés concernés via Socket.IO. Le tableau de bord affiche une alerte urgente immédiatement.
- **Protection des données** : mots de passe hachés, accès API par jeton JWT, contrôle des rôles et vérification du rattachement famille-senior avant l'accès à ses données.

### Systèmes et outils en place

- **Application mobile** : React Native avec Expo et Expo Router; interfaces distinctes selon le rôle; session conservée dans le stockage sécurisé du téléphone (`SecureStore`). Le choix clair/sombre est centralisé dans `AppearanceContext` et persisté localement (`SecureStore` sur mobile, `localStorage` sur le web).
- **API** : NestJS avec routes REST sous `/api`, validation des entrées et documentation interactive Swagger sous `/docs`.
- **Base de données** : PostgreSQL, base `seniorcare`, accès via TypeORM. Les tables sont synchronisées au démarrage selon la configuration `DB_SYNCHRONIZE`.
- **Communication instantanée** : Socket.IO, namespace `/realtime`, authentifié avec le JWT. Cela nécessite que l'app soit connectée; ce ne sont pas des notifications lorsque l'app est fermée.
- **Développement local** : démarrage de l'API et de l'app Expo documenté ci-dessous; testable avec deux comptes et deux appareils ou émulateurs.

### Pas encore implémenté ou à terminer

- Notifications push lorsque l'app famille est fermée.
- Rappel push distant à la famille si le senior n'a pas pointé.
- Collecte et envoi de la position GPS depuis l'app lors d'un SOS (l'API accepte déjà des coordonnées facultatives).
- Fuseau horaire configurable séparément; le rappel suit actuellement celui du téléphone.
- Récupération de mot de passe par e-mail (le changement de mot de passe depuis le profil est disponible).
- Compléter les mentions légales et la politique de confidentialité avec les informations vérifiées de l'éditeur avant toute publication.
- Migrations de base de données, tests automatisés, intégration continue et déploiement de production.

---

## 1. Démarrage rapide

### Prérequis

- Node.js 20 ou plus récent
- PostgreSQL lancé en local (utilisateur `postgres`)
- L'app **Expo Go** à jour sur votre téléphone (compatible SDK 58)
- Le PC et le téléphone sur le **même Wi-Fi**

### Étape 1 : la base de données

```bash
psql -U postgres -f backend/sql/init.sql      # crée la base "seniorcare"
```

(ou, dans pgAdmin : `CREATE DATABASE seniorcare;`). Les **tables sont créées automatiquement** au premier démarrage de l'API.

### Étape 2 : l'API

```bash
cd backend
npm install
npm run start:dev
```

- API : http://localhost:3000/api
- **Swagger : http://localhost:3000/docs** (bouton « Authorize » → coller le token reçu au login)

Les identifiants PostgreSQL sont dans `backend/.env` (jamais commité). Modèle : `backend/.env.example`.

### Étape 3 : l'application mobile

```bash
cd mobile
npm install
npx expo start
```

Scannez le QR code avec Expo Go. L'app **détecte toute seule l'IP de votre PC** pour joindre l'API (voir `mobile/src/config.ts`).

> Si le téléphone n'arrive pas à joindre l'API : autorisez le port **3000** dans le pare-feu Windows/macOS, ou forcez l'adresse dans `mobile/.env` : `EXPO_PUBLIC_API_URL=http://IP_DE_VOTRE_PC:3000`.

### Messages vocaux

Le senior peut enregistrer un message de 60 secondes maximum. L'API limite les fichiers à 5 Mo et ne les sert qu'après vérification du JWT et du lien famille-senior. Les familles connectées reçoivent l'événement en temps réel ; les notifications push lorsque l'app est fermée ne sont pas incluses.

En développement, `VOICE_STORAGE_DRIVER=local` stocke les fichiers dans `backend/uploads/voice-messages/`. Pour plusieurs instances backend, utilisez un stockage objet partagé avec `VOICE_STORAGE_DRIVER=s3` et configurez les variables `VOICE_S3_*` de `backend/.env.example`. Avec `DB_SYNCHRONIZE=false`, exécutez `backend/sql/create-voice-messages.sql` une fois.

### Album photo familial

Un proche lié peut ajouter une photo, un petit mot, une date de souvenir et la marquer comme photo surprise du jour. Le senior consulte son album dans une grille responsive virtualisée, avec les onglets « Photo du jour », « Toutes » et « Souvenirs »; il peut ouvrir une photo en grand, aimer ou retirer son cœur et écouter les petits mots. Les photos sont privées et ne sont délivrées qu'après vérification du JWT et du lien famille-senior ; l'évènement temps réel fonctionne lorsque l'application est ouverte. Les notifications push quand elle est fermée ne sont pas incluses.

Les fichiers sont stockés localement dans `backend/uploads/family-photos/` par défaut. En production, configurez le stockage S3 partagé avec `MEDIA_STORAGE_DRIVER=s3` et les variables `MEDIA_S3_*` ; les anciennes variables `VOICE_S3_*` restent acceptées pour compatibilité. Si `DB_SYNCHRONIZE=false`, exécutez `backend/sql/create-family-photos.sql` une fois.

### Répertoire du senior

Les proches liés apparaissent automatiquement dans le répertoire du senior; celui-ci peut aussi rechercher ses contacts par nom, téléphone ou e-mail, ajouter des contacts personnels, modifier leurs coordonnées ou les supprimer après confirmation. Il peut lancer un appel ou un e-mail depuis son téléphone. Si `DB_SYNCHRONIZE=false`, exécutez `backend/sql/create-senior-contacts.sql` une fois.

### Profil du senior

Le senior peut modifier son nom et son e-mail, ajouter/remplacer/supprimer sa photo de profil privée, changer son mot de passe en saisissant l'ancien, et supprimer définitivement son compte après confirmation par mot de passe. Les photos de profil acceptent JPEG, PNG et WebP jusqu'à 12 Mio; elles sont servies uniquement au senior connecté. En stockage local, elles vont dans `backend/uploads/profile-photos/` par défaut (`PROFILE_STORAGE_DIR` permet de changer le répertoire). Le stockage S3 partagé se configure avec `MEDIA_STORAGE_DRIVER=s3` et les variables `MEDIA_S3_*`.

La suppression retire dans une transaction le compte senior, ses pointages, alertes, liens, contacts, photos familiales et messages vocaux. Le retrait des fichiers du stockage est ensuite tenté; tout échec est inscrit dans les journaux du backend. Avec `DB_SYNCHRONIZE=false`, exécutez une fois la migration depuis la racine du dépôt : `psql -U postgres -d seniorcare -f backend/sql/create-user-profile-fields.sql`.

### Rappel quotidien de pointage

Le senior peut activer ou désactiver le rappel et choisir son heure dans **Paramètres → Pointage** (20 h par défaut). Une notification locale est programmée à l'heure choisie les jours où aucun pointage n'est enregistré; un pointage réussi retire celle du jour. Le réglage et les notifications sont propres au compte sur cet appareil. L'app maintient un horizon de 30 jours, renouvelé à son ouverture, sans requête réseau périodique ni tâche serveur. L'autorisation de notifications doit être accordée sur le téléphone. Ce mécanisme ne constitue pas une notification push distante.

### Accessibilité

Dans **Paramètres → Accessibilité**, le senior peut choisir une taille de texte standard, grande ou très grande. Le réglage est appliqué globalement aux libellés, commandes et champs de saisie, puis conservé localement sur l’appareil.

### Tester le scénario complet

1. Sur un premier appareil (ou l'émulateur) : **créer un compte « senior »** → un **code à 6 caractères** s'affiche.
2. Sur un second appareil : **créer un compte « proche »** → « Ajouter un proche » → saisir le code.
3. Le senior appuie sur **Je vais bien** : la carte du proche passe au vert **instantanément**.
4. Le senior **maintient URGENCE** 1,5 s : le proche reçoit une pop-up et la carte passe au rouge. Le proche peut « Marquer comme traitée ».

Au déclenchement du SOS, l’application demande l’autorisation de localisation au premier plan. Si elle est accordée et qu’une position est disponible sous 8 secondes, ses coordonnées sont jointes à l’alerte et les proches peuvent ouvrir la carte depuis le tableau de bord ou l’historique. En cas de refus, d’indisponibilité du GPS ou de délai dépassé, l’alerte est tout de même envoyée sans position. Aucune localisation n’est demandée au lancement ni suivie en arrière-plan. Après modification de la configuration du plugin, reconstruisez les applications natives de production ou de développement.

Astuce : vous pouvez aussi jouer le rôle d'un des deux avec Swagger (`POST /api/checkins`) pour voir le temps réel sur le téléphone.

---

## 2. Architecture

### Backend (`backend/src`)

Un **module NestJS par domaine métier**, chacun avec son entité, service, contrôleur et DTO.

```
src/
├── main.ts                 Bootstrap : préfixe /api, validation, Swagger
├── app.module.ts           Connexion PostgreSQL + assemblage des modules
├── common/                 Guards JWT/rôles, décorateurs (@CurrentUser, @Roles), enum Role
├── auth/                   Inscription, connexion, stratégie JWT
├── users/                  Comptes, profils seniors, authentification des modifications et photo privée
├── links/                  Rattachement famille ↔ senior (via code d'invitation)
├── checkins/               Pointages « Je vais bien » (côté senior)
├── alerts/                 Alertes d'urgence : création, clôture
├── family/                 Tableau de bord famille (agrège users + checkins + alerts)
├── links/                  Rattachement famille-senior et répertoire de contacts du senior
├── voice-messages/         Enregistrement, liste familiale et lecture protégée des messages
├── photos/                 Album familial privé, réactions et flux image authentifié
└── realtime/               Passerelle Socket.IO (rooms par senior)
```

**Temps réel** : namespace Socket.IO `/realtime`. À la connexion (JWT dans `auth.token`), le senior rejoint sa room `senior:<id>` et chaque proche rejoint les rooms des seniors qu'il suit. Les services diffusent les pointages, alertes, messages vocaux, photos et réactions photo ; seules les personnes concernées les reçoivent.

**Sécurité** : mots de passe hachés (bcrypt), JWT, routes protégées par rôle, un proche ne peut lire/clôturer que les données des seniors auxquels il est rattaché (403 sinon), validation stricte des entrées.

### Principales routes (détail et essais dans Swagger)

| Méthode | Route                                                    | Rôle             | Description                              |
| ------- | -------------------------------------------------------- | ---------------- | ---------------------------------------- |
| POST    | `/api/auth/register` · `/api/auth/login`                 | public           | Compte / connexion                       |
| GET     | `/api/users/me`                                          | connecté         | Profil du compte connecté                |
| PUT     | `/api/users/me`                                          | senior           | Modifier son nom et son e-mail           |
| POST    | `/api/users/me/password`                                 | senior           | Changer le mot de passe                  |
| POST    | `/api/users/me/photo` · `GET/DELETE /api/users/me/photo` | senior           | Gérer et lire sa photo privée            |
| DELETE  | `/api/users/me`                                          | senior           | Supprimer son compte et ses données      |
| POST    | `/api/checkins`                                          | senior           | « Je vais bien » / « Pas très en forme » |
| GET     | `/api/checkins/me/last`                                  | senior           | Dernier pointage                         |
| POST    | `/api/alerts`                                            | senior           | Déclencher une urgence                   |
| GET     | `/api/alerts/me/active`                                  | senior           | Alerte active                            |
| POST    | `/api/alerts/:id/resolve`                                | senior / famille | Clôturer une alerte                      |
| POST    | `/api/family/seniors`                                    | famille          | Suivre un senior (code)                  |
| GET     | `/api/family/seniors`                                    | famille          | Tableau de bord                          |
| GET     | `/api/family/seniors/:id/checkins` · `/alerts`           | famille          | Historiques                              |
| GET     | `/api/links/me/contacts`                                 | senior           | Lister les contacts                      |
| POST    | `/api/links/me/contacts`                                 | senior           | Ajouter un contact                       |
| PATCH   | `/api/links/me/contacts/:id`                             | senior           | Modifier un contact personnel            |
| DELETE  | `/api/links/me/contacts/:id`                             | senior           | Supprimer un contact personnel           |
| GET     | `/api/family/seniors/:id/photos`                         | famille          | Lister les photos                        |
| POST    | `/api/family/seniors/:id/photos`                         | famille          | Ajouter une photo                        |
| GET     | `/api/photos/me`                                         | senior           | Consulter son album                      |
| GET     | `/api/photos/:id/image`                                  | senior / famille | Lire une photo autorisée                 |
| PUT     | `/api/photos/:id/like`                                   | senior           | Aimer une photo                          |
| DELETE  | `/api/photos/:id/like`                                   | senior           | Retirer sa réaction                      |
| POST    | `/api/voice-messages`                                    | senior           | Envoyer un message vocal                 |
| GET     | `/api/family/seniors/:id/voice-messages`                 | famille          | Lister les 50 derniers messages vocaux   |
| GET     | `/api/voice-messages/:id/audio`                          | senior / famille | Lire un message vocal autorisé           |

### Mobile (`mobile/`)

```
app/                        Routes (expo-router) : fichiers = écrans, volontairement très fins
├── _layout.tsx             Fournit la session et l'apparence (AuthProvider, AppearanceProvider)
├── index.tsx               Aiguillage : login / interface senior / interface famille
├── (auth)/                 login, register
├── (senior)/               Accueil, album photo, répertoire, profil et réglages
└── (family)/               Tableau de bord, ajout, historique et album par senior
src/
├── api/                    client.ts (fetch + token + erreurs), endpoints.ts (1 objet par domaine)
├── context/                AuthContext (session) et AppearanceContext (thème)
├── hooks/                  useRealtime (Socket.IO), useAsyncAction (loading/erreur)
├── components/ui/          Design system : Screen, AppText, Button, Card, Input, ErrorText
├── features/senior|family|profile/ Composants métier du suivi, de la famille et de la gestion du profil
├── features/settings/      Gabarit partagé des pages d'information des réglages
├── theme.ts                Couleurs, tailles, espacements (seule source de style)
└── config.ts · types.ts · utils/
```

Principes : **écrans = assemblage**, la logique et l'UI métier vivent dans `features/`, l'UI générique dans `components/ui/`, aucune valeur de style en dur. Pour ajouter une fonctionnalité : un module Nest + un dossier `features/xxx` + un écran dans `app/`.

Interface senior pensée pour l'accessibilité : texte 18 pt et plus, fort contraste, zones tactiles ≥ 56 pt, urgence par appui long pour éviter les fausses alertes, libellés d'accessibilité (lecteur d'écran).

---

## 3. Pistes d'amélioration (ordre suggéré)

1. **Notifications push** quand l'app famille est fermée (`expo-notifications`). Attention : les push distants ne fonctionnent plus dans Expo Go sur Android, il faudra un _development build_ (`eas build`).
2. **Rappel automatique** : tâche planifiée (`@nestjs/schedule`) qui prévient la famille si le senior n'a pas pointé avant une heure donnée (le champ `checkedInToday` est déjà calculé).
3. **Migrations TypeORM** à la place de `DB_SYNCHRONIZE=true` avant la mise en production.
4. Fuseau horaire par utilisateur, heure de rappel personnalisée.
5. SMS de secours.
6. Tests (Jest côté API, jest-expo côté mobile), CI, déploiement (Docker + Postgres managé).

## 4. Sécurité : à faire avant la production

- Changer `JWT_SECRET` et le mot de passe PostgreSQL (celui du développement a été partagé en clair).
- Restreindre CORS dans `backend/src/main.ts`.
- Servir l'API en HTTPS.
