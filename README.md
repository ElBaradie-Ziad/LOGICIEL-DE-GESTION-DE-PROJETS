# ProjeXpert — Logiciel de Gestion de Projets

> Application web de gestion de projets collaboratifs, entièrement côté client.
> Construite en Vanilla JavaScript, CSS3 et HTML5 — sans framework, sans serveur.

---

## Table des matières

- [Apercu](#apercu)
- [Fonctionnalites](#fonctionnalites)
- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Installation et lancement](#installation-et-lancement)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Modele de données](#modele-de-données)
- [Architecture](#architecture)
- [Captures d'écran](#captures-décran)
- [Auteur](#auteur)

---

## Apercu

**ProjeXpert** est une application web complète de gestion de projets en équipe. Elle permet de planifier, suivre et collaborer sur des projets sans nécessiter de serveur ni de base de données externe. Toutes les données sont persistées localement via `localStorage`.

L'application couvre l'ensemble du cycle de vie d'un projet : création, assignation d'équipe, suivi des tâches, communication, rapports et gestion des ressources.

---

## Fonctionnalites

### Authentification et gestion des roles
- Connexion sécurisée avec session persistante
- 3 niveaux de rôles : **Administrateur**, **Manager**, **Membre**
- Permissions granulaires par rôle (lecture, écriture, suppression, gestion des utilisateurs)
- Accès conditionnel aux fonctionnalités selon le rôle connecté

### Tableau de bord
- Vue synthétique personnalisée (projets actifs, tâches complétées, retards)
- Widget « Mes tâches » avec filtrage par statut
- Cartes de progression des projets
- Événements du jour et fil d'activité récente de l'équipe

### Gestion des projets
- Création, modification et suppression de projets
- Statuts : Actif, Planification, En attente, Terminé
- Niveaux de priorité, dates de début/fin, progression en pourcentage
- Association de membres à chaque projet
- Codes couleur pour identification visuelle

### Tableau Kanban
- Board à 4 colonnes : **À faire**, **En cours**, **En revue**, **Terminé**
- Glisser-déposer (`drag & drop`) des tâches entre colonnes
- Filtrage par assigné et par priorité (Haute, Moyenne, Basse)
- Marquage des tâches en retard (date dépassée)
- Assignation multiple de membres par tâche

### Calendrier
- Vue mensuelle avec indicateurs visuels sur les jours
- Création et gestion d'événements (réunions, deadlines, tâches)
- Panneau latéral des événements à venir
- Filtrage par date

### Messagerie
- Conversations de groupe par projet
- Messages directs entre membres
- Suivi des messages non lus
- Historique complet avec horodatage

### Ressources et équipe
- Visualisation de la charge de travail par membre
- Nombre de tâches actives et répartition par projet
- Vue détaillée de l'allocation d'équipe
- Suivi de la disponibilité

### Rapports et analytics
- Graphiques interactifs via **Chart.js** :
  - Répartition des tâches par statut (camembert)
  - Progression des projets (barres)
  - Charge de travail par membre
  - Distribution par priorité
- Métriques KPI et tableaux récapitulatifs
- Filtrage des rapports par projet

### Paramètres
- Gestion du profil utilisateur
- Préférences de notifications
- Administration des utilisateurs et des rôles (Admin uniquement)
- Apparence / thème
- Export et import des données

---

## Technologies

| Technologie | Rôle |
|---|---|
| **HTML5** | Structure sémantique des pages |
| **CSS3** | Système de design avec variables CSS (thème, spacing) |
| **Vanilla JavaScript ES6+** | Logique applicative, routage, gestion d'état |
| **Chart.js v4.4.0** | Visualisations et graphiques analytics |
| **localStorage** | Persistance des données côté client |

> Aucun framework frontend (React, Vue, Angular) ni serveur backend requis.

---

## Structure du projet

```
LOGICIEL-DE-GESTION-DE-PROJETS/
│
├── index.html              # Page de connexion (point d'entrée)
├── app.html                # Application principale (après login)
│
├── css/
│   ├── styles.css          # Design system global (variables, composants)
│   ├── login.css           # Styles de la page de connexion
│   └── app.css             # Layout et composants de l'application
│
├── js/
│   ├── data.js             # Couche de données (localStorage + seed data)
│   ├── auth.js             # Module d'authentification et permissions
│   ├── app.js              # Contrôleur principal et routage
│   └── views/
│       ├── dashboard.js    # Vue tableau de bord
│       ├── projects.js     # Vue gestion des projets
│       ├── kanban.js       # Vue tableau Kanban
│       ├── calendar.js     # Vue calendrier
│       ├── messages.js     # Vue messagerie
│       ├── resources.js    # Vue ressources / équipe
│       ├── reports.js      # Vue rapports et analytics
│       └── settings.js     # Vue paramètres
│
└── assets/                 # Ressources statiques (images, icônes)
```

---

## Installation et lancement

L'application ne requiert **aucune installation** ni serveur.

### Option 1 — Ouverture directe

```bash
# Cloner le dépôt
git clone https://github.com/ElBaradie-Ziad/LOGICIEL-DE-GESTION-DE-PROJETS.git
cd LOGICIEL-DE-GESTION-DE-PROJETS

# Ouvrir index.html dans un navigateur
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

### Option 2 — Serveur local (recommandé pour éviter les restrictions CORS)

```bash
# Avec Python
python3 -m http.server 8080

# Avec Node.js / npx
npx serve .

# Puis ouvrir http://localhost:8080
```

---

## Comptes de démonstration

Des comptes de test sont disponibles dès le lancement :

| Nom | Email | Mot de passe | Rôle |
|---|---|---|---|
| Alice Martin | alice@projexpert.com | `password123` | Administrateur |
| Bob Dupont | bob@projexpert.com | `password123` | Manager |
| Claire Bernard | claire@projexpert.com | `password123` | Manager |
| David Petit | david@projexpert.com | `password123` | Membre |
| Emma Rousseau | emma@projexpert.com | `password123` | Membre |

> Les données initiales (projets, tâches, messages, événements) sont automatiquement générées au premier lancement.

---

## Modele de données

Toutes les données sont stockées en JSON dans `localStorage` :

```
projexpert_users          → Liste des utilisateurs
projexpert_projects       → Projets
projexpert_tasks          → Tâches
projexpert_messages       → Conversations et messages
projexpert_notifications  → Notifications
projexpert_events         → Événements calendrier
projexpert_session        → Session utilisateur active
```

### Entités principales

**Utilisateur**
```json
{
  "id": "u1",
  "name": "Alice Martin",
  "email": "alice@projexpert.com",
  "role": "admin",
  "color": "#4f46e5"
}
```

**Projet**
```json
{
  "id": "p1",
  "name": "Refonte Site Web",
  "status": "active",
  "priority": "high",
  "progress": 65,
  "members": ["u1", "u2"],
  "startDate": "2024-01-15",
  "endDate": "2024-06-30"
}
```

**Tâche**
```json
{
  "id": "t1",
  "projectId": "p1",
  "title": "Maquettes UI",
  "status": "in-progress",
  "priority": "high",
  "assignees": ["u2", "u3"],
  "dueDate": "2024-03-01"
}
```

---

## Architecture

L'application suit un pattern **MVC simplifié** sans framework :

```
┌─────────────────────────────────────────────┐
│                  app.html                    │
│         (routeur + layout principal)         │
└───────────────────┬─────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │      App (app.js)     │  ← Contrôleur principal
        │   routing, nav, UI    │
        └───────────┬───────────┘
                    │ appelle
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
  Views/*        Auth.js         DB (data.js)
 (modules vue)  (session,      (CRUD localStorage)
                permissions)
```

**Flux d'initialisation :**
1. `data.js` → initialise le singleton `DB` et insère les données de démo
2. `auth.js` → vérifie la session et expose les permissions
3. `app.js` → monte le layout, lie les événements de navigation
4. `views/*.js` → chaque vue se rend à la demande dans `#mainContent`

---

## Auteur

Développé dans le cadre des TP3, TP4 et TP5 — Génie Logiciel.

---

*ProjeXpert — Gérez vos projets avec clarté.*
