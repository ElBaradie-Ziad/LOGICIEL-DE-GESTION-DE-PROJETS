/* =============================================
   ProjeXpert – Dashboard View
   ============================================= */

const Dashboard = {
  render(container) {
    const user = App.user;
    const projects = DB.getProjects().filter(p => p.members.includes(user.id));
    const tasks = DB.getTasks();
    const myTasks = tasks.filter(t => t.assignees.includes(user.id));
    const overdueCount = myTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;
    const todayEvents = DB.getEvents().filter(e => e.date === new Date().toISOString().split('T')[0]);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Bonjour, ${user.name.split(' ')[0]} 👋</h1>
          <p class="view-subtitle">Voici un aperçu de votre activité du ${new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="App.navigate('projects')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau projet
          </button>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid-4 mb-16" id="statCards"></div>

      <!-- Main grid -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px" id="dashGrid">
        <!-- Left column -->
        <div style="display:flex;flex-direction:column;gap:20px">
          <!-- My tasks -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Mes tâches en cours</div>
                <div class="card-subtitle">${myTasks.filter(t => t.status !== 'done').length} tâche(s) actives</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('kanban')">Voir tout →</button>
            </div>
            <div id="myTasksList"></div>
          </div>

          <!-- Projects progress -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Avancement des projets</div>
                <div class="card-subtitle">${projects.length} projet(s) actifs</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('projects')">Voir tout →</button>
            </div>
            <div id="projectProgress"></div>
          </div>
        </div>

        <!-- Right column -->
        <div style="display:flex;flex-direction:column;gap:20px">
          <!-- Today's events -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Aujourd'hui</div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('calendar')">Calendrier →</button>
            </div>
            <div id="todayEvents"></div>
          </div>

          <!-- Team activity -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Activité récente</div>
            </div>
            <div id="recentActivity"></div>
          </div>
        </div>
      </div>
    `;

    this.renderStats(projects, myTasks, overdueCount);
    this.renderMyTasks(myTasks);
    this.renderProjectProgress(projects);
    this.renderTodayEvents(todayEvents);
    this.renderRecentActivity();
  },

  renderStats(projects, myTasks, overdueCount) {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const doneTasks = myTasks.filter(t => t.status === 'done').length;
    const totalTasks = myTasks.length;

    document.getElementById('statCards').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(79,70,229,.1)">📁</div>
        <div class="stat-info">
          <div class="stat-value">${activeProjects}</div>
          <div class="stat-label">Projets actifs</div>
          <div class="stat-change up">↑ ${projects.length} au total</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1)">✅</div>
        <div class="stat-info">
          <div class="stat-value">${doneTasks}</div>
          <div class="stat-label">Tâches complétées</div>
          <div class="stat-change up">↑ sur ${totalTasks} assignées</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1)">⏳</div>
        <div class="stat-info">
          <div class="stat-value">${myTasks.filter(t => t.status === 'in-progress').length}</div>
          <div class="stat-label">En cours</div>
          <div class="stat-change">tâches actives</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1)">🚨</div>
        <div class="stat-info">
          <div class="stat-value">${overdueCount}</div>
          <div class="stat-label">En retard</div>
          <div class="stat-change ${overdueCount > 0 ? 'down' : 'up'}">${overdueCount > 0 ? '↓ action requise' : '↑ tout est à jour'}</div>
        </div>
      </div>
    `;
  },

  renderMyTasks(myTasks) {
    const active = myTasks.filter(t => t.status !== 'done').slice(0, 6);
    const el = document.getElementById('myTasksList');
    if (active.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:30px 0"><div class="empty-state-icon">🎉</div><p>Toutes vos tâches sont terminées !</p></div>`;
      return;
    }
    el.innerHTML = active.map(t => {
      const project = DB.getProjectById(t.projectId);
      const overdue = isOverdue(t.dueDate) && t.status !== 'done';
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);" onclick="App.navigate('kanban',{projectId:'${t.projectId}'})" style="cursor:pointer">
          <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} onclick="event.stopPropagation();toggleTaskDone('${t.id}')" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer" />
          <div style="flex:1;min-width:0">
            <div style="font-size:.875rem;font-weight:500;${t.status === 'done' ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${t.title}</div>
            <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">
              ${project ? `<span style="color:${project.color};font-weight:500">${project.name}</span>` : ''}
              ${t.dueDate ? ` · <span ${overdue ? 'style="color:var(--danger)"' : ''}>${formatDate(t.dueDate)}</span>` : ''}
            </div>
          </div>
          ${priorityBadge(t.priority)}
        </div>
      `;
    }).join('');
  },

  renderProjectProgress(projects) {
    const el = document.getElementById('projectProgress');
    if (projects.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:20px 0"><p>Aucun projet assigné</p></div>`;
      return;
    }
    el.innerHTML = projects.map(p => {
      const tasks = DB.getTasksByProject(p.id);
      const done = tasks.filter(t => t.status === 'done').length;
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="App.navigate('kanban',{projectId:'${p.id}'})">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:3px;background:${p.color}"></div>
              <span style="font-size:.875rem;font-weight:500">${p.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:.8rem;color:var(--text-muted)">${done}/${tasks.length} tâches</span>
              <span style="font-size:.875rem;font-weight:600;color:${p.color}">${p.progress}%</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${p.progress}%;background:${p.color}"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTodayEvents(events) {
    const el = document.getElementById('todayEvents');
    if (events.length === 0) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:.875rem">Aucun événement aujourd'hui</div>`;
      return;
    }
    el.innerHTML = events.map(e => `
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="text-align:center;min-width:42px">
          <div style="font-size:.8rem;font-weight:700;color:${e.color}">${e.time || '--:--'}</div>
          <div style="width:8px;height:8px;border-radius:50%;background:${e.color};margin:4px auto"></div>
        </div>
        <div>
          <div style="font-size:.875rem;font-weight:500">${e.title}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${getEventTypeLabel(e.type)}</div>
        </div>
      </div>
    `).join('');
  },

  renderRecentActivity() {
    const el = document.getElementById('recentActivity');
    const allTasks = DB.getTasks();
    const recent = allTasks
      .filter(t => t.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    el.innerHTML = recent.map(t => {
      const creator = DB.getUserById(t.createdBy);
      const project = DB.getProjectById(t.projectId);
      return `
        <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="avatar avatar-sm" style="background:${creator ? creator.color : '#64748b'}">${creator ? creator.avatar : '?'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.8rem;color:var(--text-secondary)">
              <strong>${creator ? creator.name.split(' ')[0] : '?'}</strong> a créé <em>"${t.title}"</em>
            </div>
            <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">
              ${project ? project.name : ''} · ${formatDate(t.createdAt)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

function toggleTaskDone(taskId) {
  const tasks = DB.getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'done' ? 'in-progress' : 'done';
    DB.saveTasks(tasks);
    toast(task.status === 'done' ? 'Tâche marquée comme terminée' : 'Tâche réactivée', 'success');
    App.navigate('dashboard');
  }
}

function getEventTypeLabel(type) {
  return { meeting: 'Réunion', deadline: 'Échéance', task: 'Tâche', event: 'Événement' }[type] || type;
}
