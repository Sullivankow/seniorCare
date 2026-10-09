# SeniorCare

Application de veille bienveillante entre des seniors et leur famille.

- Le **senior** appuie sur « Je vais bien » (ou « Pas très en forme »), ou maintient le bouton **URGENCE**.
- Sa **famille** voit l'état en **temps réel** sur son propre écran, reçoit les urgences et peut les clôturer.

| Partie | Technologies |
|---|---|
| `mobile/` | React Native · Expo SDK 57 · Expo Go · expo-router · TypeScript · Socket.IO client |
| `backend/` | NestJS 11 · TypeORM · PostgreSQL · JWT · Swagger · Socket.IO |

---

## 1. Démarrage rapide

### Prérequis
- Node.js 20 ou plus récent
- PostgreSQL lancé en local (utilisateur `postgres`)
- L'app **Expo Go** (version SDK 57) sur votre téléphone
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

### Tester le scénario complet
1. Sur un premier appareil (ou l'émulateur) : **créer un compte « senior »** → un **code à 6 caractères** s'affiche.
2. Sur un second appareil : **créer un compte « proche »** → « Ajouter un proche » → saisir le code.
3. Le senior appuie sur **Je vais bien** : la carte du proche passe au vert **instantanément**.
4. Le senior **maintient URGENCE** 1,5 s : le proche reçoit une pop-up et la carte passe au rouge. Le proche peut « Marquer comme traitée ».

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
├── users/                  Entité User (rôle SENIOR | FAMILY, code d'invitation)
├── links/                  Rattachement famille ↔ senior (via code d'invitation)
├── checkins/               Pointages « Je vais bien » (côté senior)
├── alerts/                 Alertes d'urgence : création, clôture
├── family/                 Tableau de bord famille (agrège users + checkins + alerts)
└── realtime/               Passerelle Socket.IO (rooms par senior)
```

**Temps réel** : namespace Socket.IO `/realtime`. À la connexion (JWT dans `auth.token`), le senior rejoint sa room `senior:<id>` et chaque proche rejoint les rooms des seniors qu'il suit. Les services émettent `checkin:created`, `alert:created`, `alert:resolved` ; seules les personnes concernées les reçoivent.

**Sécurité** : mots de passe hachés (bcrypt), JWT, routes protégées par rôle, un proche ne peut lire/clôturer que les données des seniors auxquels il est rattaché (403 sinon), validation stricte des entrées.

### Principales routes (détail et essais dans Swagger)
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | public | Compte / connexion |
| POST | `/api/checkins` | senior | « Je vais bien » / « Pas très en forme » |
| POST | `/api/alerts` | senior | Déclencher une urgence |
| POST | `/api/alerts/:id/resolve` | senior / famille | Clôturer une alerte |
| POST | `/api/family/seniors` | famille | Suivre un senior (code) |
| GET | `/api/family/seniors` | famille | Tableau de bord |
| GET | `/api/family/seniors/:id/checkins` · `/alerts` | famille | Historiques |

### Mobile (`mobile/`)
```
app/                        Routes (expo-router) : fichiers = écrans, volontairement très fins
├── _layout.tsx             Fournit la session (AuthProvider)
├── index.tsx               Aiguillage : login / interface senior / interface famille
├── (auth)/                 login, register
├── (senior)/               Interface SENIOR  (1 gros bouton + urgence)
└── (family)/               Interface FAMILLE (dashboard, ajout, historique)
src/
├── api/                    client.ts (fetch + token + erreurs), endpoints.ts (1 objet par domaine)
├── context/AuthContext     Session persistée dans SecureStore
├── hooks/                  useRealtime (Socket.IO), useAsyncAction (loading/erreur)
├── components/ui/          Design system : Screen, AppText, Button, Card, Input, ErrorText
├── features/senior|family/ Composants métier (CheckInButton, SosButton, SeniorCard…)
├── theme.ts                Couleurs, tailles, espacements (seule source de style)
└── config.ts · types.ts · utils/
```
Principes : **écrans = assemblage**, la logique et l'UI métier vivent dans `features/`, l'UI générique dans `components/ui/`, aucune valeur de style en dur. Pour ajouter une fonctionnalité : un module Nest + un dossier `features/xxx` + un écran dans `app/`.

Interface senior pensée pour l'accessibilité : texte 18 pt et plus, fort contraste, zones tactiles ≥ 56 pt, urgence par appui long pour éviter les fausses alertes, libellés d'accessibilité (lecteur d'écran).

---

## 3. Pistes d'amélioration (ordre suggéré)

1. **Notifications push** quand l'app famille est fermée (`expo-notifications`). Attention : les push distants ne fonctionnent plus dans Expo Go sur Android, il faudra un *development build* (`eas build`).
2. **Rappel automatique** : tâche planifiée (`@nestjs/schedule`) qui prévient la famille si le senior n'a pas pointé avant une heure donnée (le champ `checkedInToday` est déjà calculé).
3. **Géolocalisation** au moment du SOS (`expo-location`) : l'API accepte déjà `latitude`/`longitude`.
4. **Migrations TypeORM** à la place de `DB_SYNCHRONIZE=true` avant la mise en production.
5. Fuseau horaire par utilisateur, heure de rappel personnalisée.
6. Contacts d'urgence / appel direct (`tel:`), SMS de secours.
7. Tests (Jest côté API, jest-expo côté mobile), CI, déploiement (Docker + Postgres managé).

## 4. Sécurité : à faire avant la production
- Changer `JWT_SECRET` et le mot de passe PostgreSQL (celui du développement a été partagé en clair).
- Restreindre CORS dans `backend/src/main.ts`.
- Servir l'API en HTTPS.
