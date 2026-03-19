/* =============================================
   ProjeXpert – Resources View
   ============================================= */

const Resources = {
  render(container) {
    const users = DB.getUsers();
    const tasks = DB.getTasks();
    const projects = DB.getProjects();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Ressources & Équipe</h1>
          <p class="view-subtitle">Suivi de la charge de travail et disponibilité des membres</p>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="grid-4 mb-16" id="resourceStats"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Team workload -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Charge de travail</div>
            <div class="card-subtitle">Tâches actives par membre</div>
          </div>
          <div id="workloadList"></div>
        </div>

        <!-- Project allocation -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Répartition par projet</div>
          </div>
          <div id="projectAllocation"></div>
        </div>
      </div>

      <!-- Team detail table -->
      <div class="card mt-16">
        <div class="card-header">
          <div class="card-title">Détail de l'équipe</div>
          <div class="card-subtitle">${users.length} membres</div>
        </div>
        <div id="teamTable" style="overflow-x:auto"></div>
      </div>
    `;

    this.renderStats(users, tasks, projects);
    this.renderWorkload(users, tasks);
    this.renderProjectAllocation(projects, tasks);
    this.renderTeamTable(users, tasks, projects);
  },

  getWorkload(userId, tasks) {
    const active = tasks.filter(t => t.assignees.includes(userId) && t.status !== 'done');
    const total = tasks.filter(t => t.assignees.includes(userId));
    const done = total.filter(t => t.status === 'done').length;
    return { active: active.length, total: total.length, done };
  },

  getLoadLevel(count) {
    if (count === 0) return { label: 'Disponible', color: '#10b981', pct: 0 };
    if (count <= 2) return { label: 'Normal', color: '#3b82f6', pct: Math.min(count * 20, 40) };
    if (count <= 4) return { label: 'Chargé', color: '#f59e0b', pct: Math.min(count * 18, 75) };
    return { label: 'Surchargé', color: '#ef4444', pct: Math.min(count * 15, 100) };
  },

  renderStats(users, tasks, projects) {
    const totalActive = tasks.filter(t => t.status !== 'done').length;
    const overloaded = users.filter(u => this.getWorkload(u.id, tasks).active > 4).length;
    const available = users.filter(u => this.getWorkload(u.id, tasks).active === 0).length;

    document.getElementById('resourceStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(79,70,229,.1)">👥</div>
        <div class="stat-info"><div class="stat-value">${users.length}</div><div class="stat-label">Membres de l'équipe</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,.1)">⏳</div>
        <div class="stat-info"><div class="stat-value">${totalActive}</div><div class="stat-label">Tâches en cours</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1)">✅</div>
        <div class="stat-info"><div class="stat-value">${available}</div><div class="stat-label">Membres disponibles</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1)">🚨</div>
        <div class="stat-info"><div class="stat-value">${overloaded}</div><div class="stat-label">Surchargés</div></div>
      </div>
    `;
  },

  renderWorkload(users, tasks) {
    document.getElementById('workloadList').innerHTML = users.map(u => {
      const w = this.getWorkload(u.id, tasks);
      const load = this.getLoadLevel(w.active);
      return `
        <div class="resource-item">
          <div class="avatar" style="background:${u.color}">${u.avatar}</div>
          <div class="resource-info">
            <div class="resource-name">${u.name}</div>
            <div class="resource-role">${roleName(u.role)}</div>
          </div>
          <div class="resource-load">
            <div class="resource-load-label">
              <span style="color:${load.color};font-weight:600">${load.label}</span>
              <span>${w.active} active${w.active > 1 ? 's' : ''}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${load.pct}%;background:${load.color}"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderProjectAllocation(projects, tasks) {
    const el = document.getElementById('projectAllocation');
    if (projects.length === 0) {
      el.innerHTML = `<p class="text-muted text-sm">Aucun projet</p>`;
      return;
    }
    el.innerHTML = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id && t.status !== 'done');
      const members = p.members.length;
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:3px;background:${p.color}"></div>
              <span style="font-size:.875rem;font-weight:500">${p.name}</span>
            </div>
            <div style="font-size:.8rem;color:var(--text-muted)">${members} membres · ${pTasks.length} tâches</div>
          </div>
          <div style="display:flex;gap:4px">
            ${p.members.slice(0, 6).map(uid => {
              const u = DB.getUserById(uid);
              return u ? `<div class="avatar avatar-sm" style="background:${u.color}" title="${u.name}">${u.avatar}</div>` : '';
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  renderTeamTable(users, tasks, projects) {
    document.getElementById('teamTable').innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Membre</th>
            <th>Rôle</th>
            <th>Projets</th>
            <th>Tâches actives</th>
            <th>Complétées</th>
            <th>Charge</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => {
            const w = this.getWorkload(u.id, tasks);
            const load = this.getLoadLevel(w.active);
            const userProjects = projects.filter(p => p.members.includes(u.id));
            return `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar avatar-sm" style="background:${u.color}">${u.avatar}</div>
                    <div>
                      <div style="font-weight:500">${u.name}</div>
                      <div style="font-size:.75rem;color:var(--text-muted)">${u.email}</div>
                    </div>
                  </div>
                </td>
                <td>${roleName(u.role)}</td>
                <td>
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${userProjects.map(p => `<span class="badge badge-gray" style="font-size:.7rem">${p.name}</span>`).join('') || '<span style="color:var(--text-muted);font-size:.8rem">—</span>'}
                  </div>
                </td>
                <td><span style="font-weight:600">${w.active}</span></td>
                <td><span style="color:var(--success);font-weight:600">${w.done}</span></td>
                <td>
                  <span style="color:${load.color};font-weight:500;font-size:.8rem">${load.label}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
};
