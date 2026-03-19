/* =============================================
   ProjeXpert – Data Store (localStorage)
   ============================================= */

const DB = (() => {
  const KEYS = {
    users: 'px_users',
    projects: 'px_projects',
    tasks: 'px_tasks',
    messages: 'px_messages',
    notifications: 'px_notifications',
    events: 'px_events',
    session: 'px_session'
  };

  function get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }
  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---- Seed data ---- */
  function seed() {
    if (get(KEYS.users)) return; // Already seeded

    const users = [
      { id: 'u1', name: 'Alice Martin', email: 'admin@projexpert.fr', password: 'admin123', role: 'admin', color: '#4f46e5', avatar: 'AM', createdAt: '2024-01-01' },
      { id: 'u2', name: 'Baptiste Durand', email: 'manager@projexpert.fr', password: 'manager123', role: 'manager', color: '#059669', avatar: 'BD', createdAt: '2024-01-01' },
      { id: 'u3', name: 'Chloé Lefebvre', email: 'membre@projexpert.fr', password: 'membre123', role: 'member', color: '#d97706', avatar: 'CL', createdAt: '2024-01-01' },
      { id: 'u4', name: 'David Petit', email: 'david@projexpert.fr', password: 'david123', role: 'member', color: '#dc2626', avatar: 'DP', createdAt: '2024-01-05' },
      { id: 'u5', name: 'Émilie Bernard', email: 'emilie@projexpert.fr', password: 'emilie123', role: 'member', color: '#7c3aed', avatar: 'EB', createdAt: '2024-01-10' }
    ];

    const projects = [
      {
        id: 'p1', name: 'Refonte Site Web', description: 'Refonte complète du site corporate avec nouvelle charte graphique et amélioration des performances.',
        color: '#4f46e5', status: 'active', priority: 'high',
        members: ['u1','u2','u3','u4'], ownerId: 'u1',
        startDate: '2024-01-15', endDate: '2024-04-30',
        progress: 68, createdAt: '2024-01-15'
      },
      {
        id: 'p2', name: 'Application Mobile', description: 'Développement d\'une application mobile iOS/Android pour les clients internes.',
        color: '#059669', status: 'active', priority: 'high',
        members: ['u2','u3','u5'], ownerId: 'u2',
        startDate: '2024-02-01', endDate: '2024-06-30',
        progress: 35, createdAt: '2024-02-01'
      },
      {
        id: 'p3', name: 'Migration Infrastructure', description: 'Migration vers le cloud AWS avec automatisation du déploiement CI/CD.',
        color: '#d97706', status: 'planning', priority: 'medium',
        members: ['u1','u4','u5'], ownerId: 'u4',
        startDate: '2024-03-01', endDate: '2024-07-31',
        progress: 12, createdAt: '2024-02-20'
      },
      {
        id: 'p4', name: 'CRM Interne', description: 'Développement d\'un CRM sur-mesure pour la gestion de la relation client.',
        color: '#dc2626', status: 'on-hold', priority: 'low',
        members: ['u1','u2'], ownerId: 'u1',
        startDate: '2024-01-10', endDate: '2024-03-31',
        progress: 90, createdAt: '2024-01-10'
      }
    ];

    const tasks = [
      // Project 1
      { id: 't1', projectId: 'p1', title: 'Maquettes UI/UX', description: 'Créer les maquettes haute-fidélité dans Figma', status: 'done', priority: 'high', assignees: ['u3'], dueDate: '2024-02-10', tags: ['design'], createdAt: '2024-01-20', createdBy: 'u1' },
      { id: 't2', projectId: 'p1', title: 'Développement frontend', description: 'Intégration HTML/CSS/JS des maquettes validées', status: 'in-progress', priority: 'high', assignees: ['u2','u3'], dueDate: '2024-03-20', tags: ['dev'], createdAt: '2024-02-12', createdBy: 'u1' },
      { id: 't3', projectId: 'p1', title: 'API REST backend', description: 'Développer les endpoints REST pour le site', status: 'in-progress', priority: 'medium', assignees: ['u4'], dueDate: '2024-03-25', tags: ['backend'], createdAt: '2024-02-12', createdBy: 'u2' },
      { id: 't4', projectId: 'p1', title: 'Tests de performance', description: 'Audit Lighthouse et optimisations Core Web Vitals', status: 'todo', priority: 'medium', assignees: ['u2'], dueDate: '2024-04-10', tags: ['testing'], createdAt: '2024-02-15', createdBy: 'u1' },
      { id: 't5', projectId: 'p1', title: 'Mise en production', description: 'Déploiement sur le serveur de production', status: 'todo', priority: 'high', assignees: ['u1','u4'], dueDate: '2024-04-28', tags: ['devops'], createdAt: '2024-02-15', createdBy: 'u1' },
      // Project 2
      { id: 't6', projectId: 'p2', title: 'Analyse des besoins', description: 'Interviews utilisateurs et rédaction du cahier des charges', status: 'done', priority: 'high', assignees: ['u2'], dueDate: '2024-02-15', tags: ['analyse'], createdAt: '2024-02-01', createdBy: 'u2' },
      { id: 't7', projectId: 'p2', title: 'Architecture technique', description: 'Choix du framework et architecture applicative', status: 'done', priority: 'high', assignees: ['u5'], dueDate: '2024-02-28', tags: ['architecture'], createdAt: '2024-02-01', createdBy: 'u2' },
      { id: 't8', projectId: 'p2', title: 'Module authentification', description: 'Connexion, inscription, mot de passe oublié', status: 'in-progress', priority: 'high', assignees: ['u3','u5'], dueDate: '2024-03-30', tags: ['dev','auth'], createdAt: '2024-03-01', createdBy: 'u2' },
      { id: 't9', projectId: 'p2', title: 'Module tableau de bord', description: 'Dashboard principal de l\'application', status: 'todo', priority: 'medium', assignees: ['u3'], dueDate: '2024-04-20', tags: ['dev'], createdAt: '2024-03-01', createdBy: 'u2' },
      // Project 3
      { id: 't10', projectId: 'p3', title: 'Audit infrastructure actuelle', description: 'Inventaire des serveurs et services', status: 'in-progress', priority: 'high', assignees: ['u4','u5'], dueDate: '2024-03-20', tags: ['infrastructure'], createdAt: '2024-03-01', createdBy: 'u4' },
      { id: 't11', projectId: 'p3', title: 'Plan de migration', description: 'Rédaction du plan détaillé de migration', status: 'todo', priority: 'high', assignees: ['u1'], dueDate: '2024-04-01', tags: ['planning'], createdAt: '2024-03-01', createdBy: 'u4' }
    ];

    const messages = [
      {
        id: 'c1', type: 'project', projectId: 'p1', name: 'Refonte Site Web',
        participants: ['u1','u2','u3','u4'],
        messages: [
          { id: 'm1', senderId: 'u1', text: 'Bonjour l\'équipe ! Les maquettes sont validées par le client 🎉', timestamp: '2024-03-15T09:00:00', read: ['u1','u2','u3'] },
          { id: 'm2', senderId: 'u2', text: 'Super ! On peut démarrer l\'intégration dès lundi.', timestamp: '2024-03-15T09:15:00', read: ['u1','u2','u3'] },
          { id: 'm3', senderId: 'u3', text: 'J\'ai déjà commencé la structure HTML, je partage ça cet après-midi.', timestamp: '2024-03-15T09:30:00', read: ['u1','u2','u3'] },
          { id: 'm4', senderId: 'u4', text: 'Les APIs seront prêtes dans 2 jours.', timestamp: '2024-03-15T10:00:00', read: ['u1','u2'] }
        ]
      },
      {
        id: 'c2', type: 'project', projectId: 'p2', name: 'Application Mobile',
        participants: ['u2','u3','u5'],
        messages: [
          { id: 'm5', senderId: 'u2', text: 'Le module auth avance bien ?', timestamp: '2024-03-16T14:00:00', read: ['u2','u3'] },
          { id: 'm6', senderId: 'u5', text: 'Oui, JWT implémenté, je termine la gestion des sessions.', timestamp: '2024-03-16T14:20:00', read: ['u2'] }
        ]
      },
      {
        id: 'c3', type: 'direct', name: 'Baptiste Durand',
        participants: ['u1','u2'],
        messages: [
          { id: 'm7', senderId: 'u2', text: 'Alice, tu as 5 min pour un call ?', timestamp: '2024-03-17T11:00:00', read: ['u2'] },
          { id: 'm8', senderId: 'u1', text: 'Bien sûr, je suis dispo dans 10 min.', timestamp: '2024-03-17T11:05:00', read: ['u1','u2'] }
        ]
      }
    ];

    const notifications = [
      { id: 'n1', userId: 'u1', type: 'task', icon: '📋', title: 'Nouvelle tâche assignée', body: 'La tâche "Tests de performance" vous a été assignée', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, link: 'kanban' },
      { id: 'n2', userId: 'u1', type: 'message', icon: '💬', title: 'Nouveau message', body: 'Baptiste vous a envoyé un message', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false, link: 'messages' },
      { id: 'n3', userId: 'u1', type: 'deadline', icon: '⚠️', title: 'Échéance proche', body: 'La tâche "Mise en production" est due dans 3 jours', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true, link: 'kanban' },
      { id: 'n4', userId: 'u2', type: 'task', icon: '✅', title: 'Tâche complétée', body: '"Maquettes UI/UX" a été marquée comme terminée', timestamp: new Date(Date.now() - 1800000).toISOString(), read: false, link: 'kanban' }
    ];

    const events = [
      { id: 'e1', title: 'Sprint Review', projectId: 'p1', date: getTodayPlusDays(2), time: '10:00', color: '#4f46e5', type: 'meeting', participants: ['u1','u2','u3'] },
      { id: 'e2', title: 'Deadline Frontend', projectId: 'p1', date: getTodayPlusDays(5), time: '18:00', color: '#ef4444', type: 'deadline', participants: ['u2','u3'] },
      { id: 'e3', title: 'Stand-up quotidien', projectId: 'p2', date: getTodayPlusDays(0), time: '09:30', color: '#059669', type: 'meeting', participants: ['u2','u3','u5'] },
      { id: 'e4', title: 'Demo client', projectId: 'p1', date: getTodayPlusDays(8), time: '14:00', color: '#7c3aed', type: 'meeting', participants: ['u1','u2'] },
      { id: 'e5', title: 'Audit infra', projectId: 'p3', date: getTodayPlusDays(-2), time: '11:00', color: '#d97706', type: 'task', participants: ['u4','u5'] }
    ];

    set(KEYS.users, users);
    set(KEYS.projects, projects);
    set(KEYS.tasks, tasks);
    set(KEYS.messages, messages);
    set(KEYS.notifications, notifications);
    set(KEYS.events, events);
  }

  function getTodayPlusDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // Public CRUD helpers
  return {
    seed,
    uid,
    getTodayPlusDays,

    // Users
    getUsers: () => get(KEYS.users) || [],
    saveUsers: (v) => set(KEYS.users, v),
    getUserById: (id) => (get(KEYS.users) || []).find(u => u.id === id),

    // Projects
    getProjects: () => get(KEYS.projects) || [],
    saveProjects: (v) => set(KEYS.projects, v),
    getProjectById: (id) => (get(KEYS.projects) || []).find(p => p.id === id),
    addProject: (p) => { const list = get(KEYS.projects) || []; list.push(p); set(KEYS.projects, list); },
    updateProject: (p) => { const list = get(KEYS.projects) || []; const i = list.findIndex(x => x.id === p.id); if (i >= 0) list[i] = p; set(KEYS.projects, list); },
    deleteProject: (id) => { set(KEYS.projects, (get(KEYS.projects) || []).filter(p => p.id !== id)); },

    // Tasks
    getTasks: () => get(KEYS.tasks) || [],
    saveTasks: (v) => set(KEYS.tasks, v),
    getTasksByProject: (pid) => (get(KEYS.tasks) || []).filter(t => t.projectId === pid),
    addTask: (t) => { const list = get(KEYS.tasks) || []; list.push(t); set(KEYS.tasks, list); },
    updateTask: (t) => { const list = get(KEYS.tasks) || []; const i = list.findIndex(x => x.id === t.id); if (i >= 0) list[i] = t; set(KEYS.tasks, list); },
    deleteTask: (id) => { set(KEYS.tasks, (get(KEYS.tasks) || []).filter(t => t.id !== id)); },

    // Messages
    getConversations: () => get(KEYS.messages) || [],
    saveConversations: (v) => set(KEYS.messages, v),

    // Notifications
    getNotifications: (userId) => (get(KEYS.notifications) || []).filter(n => n.userId === userId),
    addNotification: (n) => { const list = get(KEYS.notifications) || []; list.unshift(n); set(KEYS.notifications, list.slice(0, 50)); },
    markNotifRead: (userId) => {
      const list = get(KEYS.notifications) || [];
      list.forEach(n => { if (n.userId === userId) n.read = true; });
      set(KEYS.notifications, list);
    },

    // Events
    getEvents: () => get(KEYS.events) || [],
    saveEvents: (v) => set(KEYS.events, v),
    addEvent: (e) => { const list = get(KEYS.events) || []; list.push(e); set(KEYS.events, list); },
    deleteEvent: (id) => { set(KEYS.events, (get(KEYS.events) || []).filter(e => e.id !== id)); },

    // Session
    getSession: () => get(KEYS.session),
    setSession: (v) => set(KEYS.session, v),
    clearSession: () => localStorage.removeItem(KEYS.session),

    // Helpers
    getAvatarColor: (userId) => {
      const user = (get(KEYS.users) || []).find(u => u.id === userId);
      return user ? user.color : '#64748b';
    }
  };
})();

// Initialize seed data
DB.seed();
