/* =============================================
   ProjeXpert – Kanban View
   ============================================= */

const Kanban = {
  currentProjectId: null,
  dragTask: null,

  columns: [
    { id: 'todo',        label: 'À faire',      color: '#64748b', icon: '📋' },
    { id: 'in-progress', label: 'En cours',     color: '#3b82f6', icon: '⚡' },
    { id: 'review',      label: 'En révision',  color: '#f59e0b', icon: '👁️' },
    { id: 'done',        label: 'Terminé',      color: '#10b981', icon: '✅' }
  ],

  render(container, params = {}) {
    const user = App.user;
    const projects = DB.getProjects().filter(p => user.role === 'admin' || p.members.includes(user.id));

    if (projects.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Aucun projet disponible</h3><p>Rejoignez ou créez un projet pour utiliser le Kanban.</p></div>`;
      return;
    }

    // Determine current project
    if (params.projectId) this.currentProjectId = params.projectId;
    if (!this.currentProjectId || !projects.find(p => p.id === this.currentProjectId)) {
      this.currentProjectId = projects[0].id;
    }
    const project = DB.getProjectById(this.currentProjectId);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">
            <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${project.color};margin-right:8px"></span>
            ${project.name}
          </h1>
          <p class="view-subtitle">Tableau Kanban – glissez-déposez les tâches entre les colonnes</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="Kanban.openNewTaskModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle tâche
          </button>
        </div>
      </div>

      <div class="kanban-toolbar">
        <select onchange="Kanban.switchProject(this.value)" style="font-weight:500">
          ${projects.map(p => `<option value="${p.id}" ${p.id === this.currentProjectId ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
        <select id="kanbanFilter" onchange="Kanban.renderBoard()">
          <option value="all">Tous les membres</option>
          ${DB.getUsers().map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
        </select>
        <select id="kanbanPriority" onchange="Kanban.renderBoard()">
          <option value="all">Toutes les priorités</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
        <div style="margin-left:auto;font-size:.875rem;color:var(--text-muted)" id="kanbanStats"></div>
      </div>

      <div class="kanban-board" id="kanbanBoard"></div>
    `;

    this.renderBoard();
  },

  renderBoard() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    const allTasks = DB.getTasksByProject(this.currentProjectId);
    const filterUser = document.getElementById('kanbanFilter')?.value || 'all';
    const filterPriority = document.getElementById('kanbanPriority')?.value || 'all';

    let tasks = allTasks;
    if (filterUser !== 'all') tasks = tasks.filter(t => t.assignees.includes(filterUser));
    if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority);

    // Stats
    const statsEl = document.getElementById('kanbanStats');
    if (statsEl) {
      const done = allTasks.filter(t => t.status === 'done').length;
      statsEl.textContent = `${done}/${allTasks.length} tâches terminées`;
    }

    board.innerHTML = this.columns.map(col => {
      const colTasks = tasks.filter(t => t.status === col.id);
      return `
        <div class="kanban-column">
          <div class="kanban-col-header">
            <div class="kanban-col-title">
              <div class="kanban-col-dot" style="background:${col.color}"></div>
              <span>${col.icon} ${col.label}</span>
            </div>
            <span class="kanban-col-count">${colTasks.length}</span>
          </div>
          <div class="kanban-col-body"
            data-status="${col.id}"
            ondragover="event.preventDefault();this.classList.add('drag-over')"
            ondragleave="this.classList.remove('drag-over')"
            ondrop="Kanban.onDrop(event,'${col.id}')">
            ${colTasks.map(t => this.renderTaskCard(t)).join('')}
          </div>
          <button class="add-task-btn" onclick="Kanban.openNewTaskModal('${col.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter une tâche
          </button>
        </div>
      `;
    }).join('');
  },

  renderTaskCard(task) {
    const assigneeAvatars = task.assignees.slice(0, 3).map(uid => {
      const u = DB.getUserById(uid);
      return u ? `<div class="avatar avatar-sm" style="background:${u.color}" title="${u.name}">${u.avatar}</div>` : '';
    }).join('');

    const tags = (task.tags || []).map(tag =>
      `<span class="badge badge-gray" style="font-size:.7rem">${tag}</span>`
    ).join('');

    const overdue = isOverdue(task.dueDate) && task.status !== 'done';

    return `
      <div class="task-card"
        draggable="true"
        data-task-id="${task.id}"
        ondragstart="Kanban.onDragStart(event,'${task.id}')"
        ondragend="Kanban.onDragEnd(event)">
        <div class="task-card-header">
          <div class="task-card-title">${task.title}</div>
          <button class="task-card-more" onclick="event.stopPropagation();Kanban.openTaskMenu(event,'${task.id}')">⋯</button>
        </div>
        ${task.description ? `<div style="font-size:.78rem;color:var(--text-secondary);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${task.description}</div>` : ''}
        <div class="task-card-meta">
          ${priorityBadge(task.priority)}
          ${tags}
        </div>
        <div class="task-card-footer">
          <div class="task-card-assignees">${assigneeAvatars}</div>
          ${task.dueDate ? `<span class="task-card-due ${overdue ? 'overdue' : ''}">
            ${overdue ? '⚠️' : '📅'} ${formatDate(task.dueDate)}
          </span>` : ''}
        </div>
      </div>
    `;
  },

  switchProject(projectId) {
    this.currentProjectId = projectId;
    this.renderBoard();
    // Update title
    const p = DB.getProjectById(projectId);
    if (p) {
      document.querySelector('.view-title').innerHTML = `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${p.color};margin-right:8px"></span>${p.name}`;
    }
  },

  // ---- Drag and Drop ----
  onDragStart(event, taskId) {
    this.dragTask = taskId;
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
  },

  onDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.kanban-col-body').forEach(el => el.classList.remove('drag-over'));
  },

  onDrop(event, newStatus) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (!this.dragTask) return;

    const tasks = DB.getTasks();
    const task = tasks.find(t => t.id === this.dragTask);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      DB.saveTasks(tasks);
      // Update project progress
      this.updateProjectProgress();
      toast(`Tâche déplacée vers "${this.columns.find(c => c.id === newStatus)?.label}"`, 'success');
      this.renderBoard();
    }
    this.dragTask = null;
  },

  updateProjectProgress() {
    const tasks = DB.getTasksByProject(this.currentProjectId);
    if (tasks.length === 0) return;
    const done = tasks.filter(t => t.status === 'done').length;
    const progress = Math.round((done / tasks.length) * 100);
    const p = DB.getProjectById(this.currentProjectId);
    if (p) { p.progress = progress; DB.updateProject(p); }
  },

  // ---- Task Menu ----
  openTaskMenu(event, taskId) {
    event.stopPropagation();
    // Remove existing menus
    document.querySelectorAll('.task-context-menu').forEach(m => m.remove());

    const task = DB.getTasks().find(t => t.id === taskId);
    if (!task) return;

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu task-context-menu';
    menu.style.cssText = 'position:fixed;z-index:200';
    menu.innerHTML = `
      <button class="dropdown-item" onclick="Kanban.openEditTaskModal('${taskId}')">✏️ Modifier</button>
      <div class="dropdown-divider"></div>
      ${this.columns.filter(c => c.id !== task.status).map(c =>
        `<button class="dropdown-item" onclick="Kanban.moveTask('${taskId}','${c.id}')">→ ${c.icon} ${c.label}</button>`
      ).join('')}
      <div class="dropdown-divider"></div>
      <button class="dropdown-item danger" onclick="Kanban.deleteTask('${taskId}')">🗑️ Supprimer</button>
    `;

    const rect = event.target.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 4}px`;
    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  },

  moveTask(taskId, newStatus) {
    const tasks = DB.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      DB.saveTasks(tasks);
      this.updateProjectProgress();
      this.renderBoard();
    }
  },

  deleteTask(taskId) {
    if (!confirm('Supprimer cette tâche ?')) return;
    DB.deleteTask(taskId);
    this.updateProjectProgress();
    toast('Tâche supprimée', 'warning');
    this.renderBoard();
  },

  // ---- Modals ----
  openNewTaskModal(defaultStatus = 'todo') {
    const project = DB.getProjectById(this.currentProjectId);
    const users = DB.getUsers().filter(u => project?.members.includes(u.id));

    const body = `
      <form id="taskForm">
        <div class="form-group">
          <label>Titre de la tâche *</label>
          <input type="text" id="tTitle" placeholder="Décrire la tâche…" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="tDesc" placeholder="Détails supplémentaires…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="tStatus">
              ${this.columns.map(c => `<option value="${c.id}" ${c.id === defaultStatus ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Priorité</label>
            <select id="tPriority">
              <option value="high">Haute</option>
              <option value="medium" selected>Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date d'échéance</label>
          <input type="date" id="tDue" />
        </div>
        <div class="form-group">
          <label>Assigné à</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${users.map(u => `
              <label style="display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:.875rem">
                <input type="checkbox" name="tAssignees" value="${u.id}" />
                <span style="width:22px;height:22px;border-radius:50%;background:${u.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700">${u.avatar}</span>
                ${u.name.split(' ')[0]}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>Tags (séparés par des virgules)</label>
          <input type="text" id="tTags" placeholder="dev, design, urgent…" />
        </div>
      </form>`;

    openModal('Nouvelle tâche', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Kanban.saveTask()">Créer la tâche</button>`);
  },

  openEditTaskModal(taskId) {
    const task = DB.getTasks().find(t => t.id === taskId);
    if (!task) return;
    const project = DB.getProjectById(task.projectId);
    const users = DB.getUsers().filter(u => project?.members.includes(u.id));

    const body = `
      <form id="taskForm">
        <div class="form-group">
          <label>Titre *</label>
          <input type="text" id="tTitle" value="${task.title}" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="tDesc">${task.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="tStatus">
              ${this.columns.map(c => `<option value="${c.id}" ${c.id === task.status ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Priorité</label>
            <select id="tPriority">
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Haute</option>
              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Moyenne</option>
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Basse</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date d'échéance</label>
          <input type="date" id="tDue" value="${task.dueDate || ''}" />
        </div>
        <div class="form-group">
          <label>Assigné à</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${users.map(u => `
              <label style="display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:.875rem">
                <input type="checkbox" name="tAssignees" value="${u.id}" ${task.assignees.includes(u.id) ? 'checked' : ''} />
                <span style="width:22px;height:22px;border-radius:50%;background:${u.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700">${u.avatar}</span>
                ${u.name.split(' ')[0]}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>Tags</label>
          <input type="text" id="tTags" value="${(task.tags || []).join(', ')}" />
        </div>
        <input type="hidden" id="tId" value="${task.id}" />
      </form>`;

    openModal('Modifier la tâche', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Kanban.updateTask()">Enregistrer</button>`);
  },

  saveTask() {
    const title = document.getElementById('tTitle').value.trim();
    if (!title) { toast('Le titre est requis', 'error'); return; }
    const assignees = [...document.querySelectorAll('input[name="tAssignees"]:checked')].map(el => el.value);
    const tags = document.getElementById('tTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const task = {
      id: DB.uid(),
      projectId: this.currentProjectId,
      title,
      description: document.getElementById('tDesc').value,
      status: document.getElementById('tStatus').value,
      priority: document.getElementById('tPriority').value,
      assignees,
      dueDate: document.getElementById('tDue').value || null,
      tags,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: App.user.id
    };
    DB.addTask(task);
    this.updateProjectProgress();
    closeModal();
    toast('Tâche créée !', 'success');
    this.renderBoard();
  },

  updateTask() {
    const id = document.getElementById('tId').value;
    const tasks = DB.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const assignees = [...document.querySelectorAll('input[name="tAssignees"]:checked')].map(el => el.value);
    const tags = document.getElementById('tTags').value.split(',').map(t => t.trim()).filter(Boolean);
    Object.assign(task, {
      title: document.getElementById('tTitle').value.trim(),
      description: document.getElementById('tDesc').value,
      status: document.getElementById('tStatus').value,
      priority: document.getElementById('tPriority').value,
      assignees,
      dueDate: document.getElementById('tDue').value || null,
      tags
    });
    DB.saveTasks(tasks);
    this.updateProjectProgress();
    closeModal();
    toast('Tâche mise à jour !', 'success');
    this.renderBoard();
  }
};
