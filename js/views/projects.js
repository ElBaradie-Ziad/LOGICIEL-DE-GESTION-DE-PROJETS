/* =============================================
   ProjeXpert – Projects View
   ============================================= */

const Projects = {
  filter: { status: 'all', search: '' },

  render(container) {
    const canWrite = Auth.can('manage_projects');
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Projets</h1>
          <p class="view-subtitle">Gérez et suivez tous vos projets</p>
        </div>
        <div class="view-actions">
          ${canWrite ? `<button class="btn btn-primary" onclick="Projects.openNewProjectModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau projet
          </button>` : ''}
        </div>
      </div>

      <div class="filter-toolbar">
        <input type="text" placeholder="Rechercher un projet…" oninput="Projects.setSearch(this.value)" style="min-width:220px" />
        <select onchange="Projects.setFilter('status', this.value)">
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="planning">Planification</option>
          <option value="on-hold">En pause</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div class="project-grid" id="projectGrid"></div>
    `;
    this.renderProjects();
  },

  renderProjects() {
    const user = App.user;
    let projects = DB.getProjects();
    if (user.role !== 'admin') projects = projects.filter(p => p.members.includes(user.id));
    if (this.filter.status !== 'all') projects = projects.filter(p => p.status === this.filter.status);
    if (this.filter.search) {
      const q = this.filter.search.toLowerCase();
      projects = projects.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    if (projects.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📁</div><h3>Aucun projet trouvé</h3><p>Créez votre premier projet ou ajustez les filtres.</p>${Auth.can('manage_projects') ? `<button class="btn btn-primary" onclick="Projects.openNewProjectModal()">Créer un projet</button>` : ''}</div>`;
      return;
    }

    grid.innerHTML = projects.map(p => {
      const tasks = DB.getTasksByProject(p.id);
      const doneTasks = tasks.filter(t => t.status === 'done').length;
      const members = p.members.slice(0, 4);
      const owner = DB.getUserById(p.ownerId);
      const canEdit = Auth.can('manage_projects') || p.ownerId === App.user.id;

      return `
        <div class="project-card" onclick="App.navigate('kanban',{projectId:'${p.id}'})">
          <div class="project-card-header">
            <div class="project-color" style="background:${p.color}"></div>
            <span class="project-name">${p.name}</span>
            ${canEdit ? `
            <div class="dropdown" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon" onclick="this.nextElementSibling.classList.toggle('hidden')">⋯</button>
              <div class="dropdown-menu hidden">
                <button class="dropdown-item" onclick="Projects.openEditModal('${p.id}')">✏️ Modifier</button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" onclick="Projects.deleteProject('${p.id}')">🗑️ Supprimer</button>
              </div>
            </div>` : ''}
          </div>

          <p class="project-desc">${p.description || 'Aucune description'}</p>

          <div class="project-members mb-16">
            ${members.map(uid => {
              const u = DB.getUserById(uid);
              return u ? `<div class="avatar avatar-sm" style="background:${u.color}" title="${u.name}">${u.avatar}</div>` : '';
            }).join('')}
            ${p.members.length > 4 ? `<div class="avatar avatar-sm" style="background:var(--text-muted)">+${p.members.length - 4}</div>` : ''}
          </div>

          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-muted);margin-bottom:6px">
              <span>Progression</span>
              <span style="font-weight:600;color:${p.color}">${p.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${p.progress}%;background:${p.color}"></div>
            </div>
          </div>

          <div class="project-footer">
            <div class="project-stats">
              <span class="project-stat">📋 ${tasks.length} tâches</span>
              <span class="project-stat">✅ ${doneTasks} terminées</span>
            </div>
            ${statusBadge(p.status)}
          </div>

          ${p.endDate ? `<div style="margin-top:10px;font-size:.75rem;color:var(--text-muted)">📅 Échéance : ${formatDate(p.endDate)}</div>` : ''}
        </div>
      `;
    }).join('');
  },

  setFilter(key, value) {
    this.filter[key] = value;
    this.renderProjects();
  },

  setSearch(value) {
    this.filter.search = value;
    this.renderProjects();
  },

  openNewProjectModal() {
    const colors = ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#0f172a'];
    const body = `
      <form id="projectForm">
        <div class="form-group">
          <label>Nom du projet *</label>
          <input type="text" id="pName" placeholder="Mon nouveau projet" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="pDesc" placeholder="Décrivez le projet…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date de début</label>
            <input type="date" id="pStart" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input type="date" id="pEnd" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="pStatus">
              <option value="planning">Planification</option>
              <option value="active">Actif</option>
              <option value="on-hold">En pause</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priorité</label>
            <select id="pPriority">
              <option value="high">Haute</option>
              <option value="medium" selected>Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Couleur</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${colors.map((c, i) => `
              <label style="cursor:pointer">
                <input type="radio" name="pColor" value="${c}" ${i === 0 ? 'checked' : ''} style="display:none" />
                <div style="width:28px;height:28px;border-radius:6px;background:${c};border:2px solid transparent" onclick="this.style.border='2px solid var(--text-primary)'"></div>
              </label>
            `).join('')}
          </div>
        </div>
        ${memberSelect([App.user.id], 'Membres de l\'équipe')}
      </form>`;

    openModal('Nouveau projet', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Projects.saveProject()">Créer le projet</button>`);
  },

  openEditModal(projectId) {
    const p = DB.getProjectById(projectId);
    if (!p) return;
    const colors = ['#4f46e5','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#0f172a'];
    const body = `
      <form id="projectForm">
        <div class="form-group">
          <label>Nom du projet *</label>
          <input type="text" id="pName" value="${p.name}" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="pDesc">${p.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date de début</label>
            <input type="date" id="pStart" value="${p.startDate || ''}" />
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input type="date" id="pEnd" value="${p.endDate || ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="pStatus">
              <option value="planning" ${p.status === 'planning' ? 'selected' : ''}>Planification</option>
              <option value="active" ${p.status === 'active' ? 'selected' : ''}>Actif</option>
              <option value="on-hold" ${p.status === 'on-hold' ? 'selected' : ''}>En pause</option>
              <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Terminé</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priorité</label>
            <select id="pPriority">
              <option value="high" ${p.priority === 'high' ? 'selected' : ''}>Haute</option>
              <option value="medium" ${p.priority === 'medium' ? 'selected' : ''}>Moyenne</option>
              <option value="low" ${p.priority === 'low' ? 'selected' : ''}>Basse</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Progression (${p.progress}%)</label>
          <input type="range" id="pProgress" min="0" max="100" value="${p.progress}" oninput="document.getElementById('progVal').textContent=this.value+'%'" style="width:100%" />
          <span id="progVal">${p.progress}%</span>
        </div>
        <div class="form-group">
          <label>Couleur</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${colors.map(c => `
              <label style="cursor:pointer">
                <input type="radio" name="pColor" value="${c}" ${p.color === c ? 'checked' : ''} style="display:none" />
                <div style="width:28px;height:28px;border-radius:6px;background:${c};border:${p.color === c ? '3px solid var(--text-primary)' : '2px solid transparent'}"></div>
              </label>
            `).join('')}
          </div>
        </div>
        ${memberSelect(p.members, 'Membres de l\'équipe')}
        <input type="hidden" id="pId" value="${p.id}" />
      </form>`;

    openModal('Modifier le projet', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Projects.updateProject()">Enregistrer</button>`);
  },

  saveProject() {
    const name = document.getElementById('pName').value.trim();
    if (!name) { toast('Le nom du projet est requis', 'error'); return; }
    const members = [...document.querySelectorAll('input[name="members"]:checked')].map(el => el.value);
    const color = document.querySelector('input[name="pColor"]:checked')?.value || '#4f46e5';
    const project = {
      id: DB.uid(),
      name,
      description: document.getElementById('pDesc').value,
      color,
      status: document.getElementById('pStatus').value,
      priority: document.getElementById('pPriority').value,
      members: members.length ? members : [App.user.id],
      ownerId: App.user.id,
      startDate: document.getElementById('pStart').value,
      endDate: document.getElementById('pEnd').value,
      progress: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    DB.addProject(project);
    closeModal();
    toast('Projet créé avec succès !', 'success');
    this.renderProjects();
  },

  updateProject() {
    const id = document.getElementById('pId').value;
    const p = DB.getProjectById(id);
    if (!p) return;
    const members = [...document.querySelectorAll('input[name="members"]:checked')].map(el => el.value);
    const color = document.querySelector('input[name="pColor"]:checked')?.value || p.color;
    Object.assign(p, {
      name: document.getElementById('pName').value.trim(),
      description: document.getElementById('pDesc').value,
      color,
      status: document.getElementById('pStatus').value,
      priority: document.getElementById('pPriority').value,
      progress: parseInt(document.getElementById('pProgress')?.value || p.progress),
      members: members.length ? members : p.members,
      startDate: document.getElementById('pStart').value,
      endDate: document.getElementById('pEnd').value
    });
    DB.updateProject(p);
    closeModal();
    toast('Projet mis à jour !', 'success');
    this.renderProjects();
  },

  deleteProject(id) {
    if (!confirm('Supprimer ce projet ? Toutes les tâches associées seront perdues.')) return;
    DB.deleteProject(id);
    // Also delete tasks
    const tasks = DB.getTasks().filter(t => t.projectId !== id);
    DB.saveTasks(tasks);
    toast('Projet supprimé', 'warning');
    this.renderProjects();
  }
};
