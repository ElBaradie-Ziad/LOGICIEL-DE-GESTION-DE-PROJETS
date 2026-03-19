/* =============================================
   ProjeXpert – Main Application Controller
   ============================================= */

// ---- Guard ----
const currentUser = Auth.requireAuth();
if (!currentUser) throw new Error('Not authenticated');

// ---- State ----
const App = {
  currentView: 'dashboard',
  currentProjectId: null,
  user: currentUser,

  // ---- Init ----
  init() {
    this.updateUserUI();
    this.bindNav();
    this.bindMobileMenu();
    this.updateNotifBadge();
    this.navigate('dashboard');
    this.startNotifPoll();
  },

  // ---- User UI ----
  updateUserUI() {
    const u = this.user;
    const initials = u.avatar || u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const color = u.color || '#4f46e5';

    document.querySelectorAll('#sidebarAvatar, #topbarAvatar').forEach(el => {
      el.textContent = initials;
      el.style.background = color;
    });
    document.getElementById('sidebarUserName').textContent = u.name;
    document.getElementById('sidebarUserRole').textContent = roleName(u.role);
    document.getElementById('topbarUserName').textContent = u.name.split(' ')[0];
  },

  // ---- Navigation ----
  bindNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.navigate(view);
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          document.getElementById('sidebar').classList.remove('open');
        }
      });
    });

    // Search
    document.getElementById('globalSearch').addEventListener('input', (e) => {
      if (e.target.value.length > 2) this.handleSearch(e.target.value);
    });
  },

  navigate(view, params = {}) {
    this.currentView = view;
    if (params.projectId) this.currentProjectId = params.projectId;

    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add('active');

    const content = document.getElementById('mainContent');
    content.innerHTML = '';
    content.className = 'content fade-in';

    const views = { dashboard: Dashboard, projects: Projects, kanban: Kanban, calendar: CalendarView, resources: Resources, messages: Messages, reports: Reports, settings: Settings };
    const viewModule = views[view];
    if (viewModule) viewModule.render(content, params);
    else content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔧</div><h3>Vue en développement</h3></div>`;
  },

  // ---- Mobile menu ----
  bindMobileMenu() {
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  },

  // ---- Search ----
  handleSearch(query) {
    const q = query.toLowerCase();
    const tasks = DB.getTasks().filter(t => t.title.toLowerCase().includes(q));
    const projects = DB.getProjects().filter(p => p.name.toLowerCase().includes(q));
    // TODO: show search results panel
  },

  // ---- Notifications ----
  updateNotifBadge() {
    const notifs = DB.getNotifications(this.user.id);
    const unread = notifs.filter(n => !n.read).length;
    const dot = document.getElementById('notifDot');
    dot.style.display = unread > 0 ? 'block' : 'none';
    const msgBadge = document.getElementById('msg-badge');
    const unreadMsgs = getUnreadMessageCount();
    if (unreadMsgs > 0) {
      msgBadge.textContent = unreadMsgs;
      msgBadge.style.display = 'flex';
    } else {
      msgBadge.style.display = 'none';
    }
  },

  startNotifPoll() {
    setInterval(() => this.updateNotifBadge(), 10000);
  }
};

// ---- Notification Panel ----
function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    renderNotifPanel();
  }
}

function renderNotifPanel() {
  const notifs = DB.getNotifications(App.user.id);
  const list = document.getElementById('notifList');
  if (notifs.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:30px 20px"><div class="empty-state-icon">🔔</div><p>Aucune notification</p></div>`;
    return;
  }
  list.innerHTML = notifs.slice(0, 15).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.link || 'dashboard'}')">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="text-muted" style="font-size:.8rem">${n.body}</div>
        <div class="notif-time">${timeAgo(n.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

function handleNotifClick(id, link) {
  document.getElementById('notifPanel').classList.add('hidden');
  App.navigate(link);
}

function markAllRead() {
  DB.markNotifRead(App.user.id);
  App.updateNotifBadge();
  renderNotifPanel();
}

// ---- Modal ----
function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalFooter').innerHTML = footerHTML;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ---- Toast ----
function toast(message, type = 'info', duration = 3500) {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ---- Helpers ----
function roleName(role) {
  return { admin: 'Administrateur', manager: 'Chef de projet', member: 'Membre' }[role] || role;
}

function priorityBadge(priority) {
  const map = { high: ['danger', 'Haute'], medium: ['warning', 'Moyenne'], low: ['success', 'Basse'] };
  const [cls, label] = map[priority] || ['gray', priority];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function statusBadge(status) {
  const map = {
    'todo': ['gray', 'À faire'],
    'in-progress': ['info', 'En cours'],
    'review': ['warning', 'En révision'],
    'done': ['success', 'Terminé'],
    'active': ['success', 'Actif'],
    'planning': ['info', 'Planification'],
    'on-hold': ['warning', 'En pause'],
    'completed': ['gray', 'Terminé']
  };
  const [cls, label] = map[status] || ['gray', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function avatarHTML(userId, size = '') {
  const user = DB.getUserById(userId);
  if (!user) return '';
  return `<div class="avatar ${size}" style="background:${user.color}" title="${user.name}">${user.avatar}</div>`;
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr) {
  return dateStr && new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
}

function getUnreadMessageCount() {
  const convs = DB.getConversations();
  let count = 0;
  convs.forEach(c => {
    if (c.participants.includes(App.user.id)) {
      c.messages.forEach(m => {
        if (m.senderId !== App.user.id && !(m.read || []).includes(App.user.id)) count++;
      });
    }
  });
  return count;
}

function getAvatarColors(userId) {
  const colors = ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d'];
  const user = DB.getUserById(userId);
  return user ? user.color : colors[userId.charCodeAt(0) % colors.length];
}

function memberSelect(selectedIds = [], label = 'Membres') {
  const users = DB.getUsers();
  return `
    <div class="form-group">
      <label>${label}</label>
      <div class="member-checkboxes" style="display:flex;flex-wrap:wrap;gap:8px">
        ${users.map(u => `
          <label style="display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:.875rem;">
            <input type="checkbox" name="members" value="${u.id}" ${selectedIds.includes(u.id) ? 'checked' : ''} />
            <span style="width:24px;height:24px;border-radius:50%;background:${u.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">${u.avatar}</span>
            ${u.name.split(' ')[0]}
          </label>
        `).join('')}
      </div>
    </div>`;
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notifPanel');
  const btn = document.getElementById('notifBtn');
  if (!panel.classList.contains('hidden') && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.add('hidden');
  }
});

// Init app
App.init();
