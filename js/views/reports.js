/* =============================================
   ProjeXpert – Reports & Analytics View
   ============================================= */

const Reports = {
  charts: {},

  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Rapports & Analytics</h1>
          <p class="view-subtitle">Analysez la performance et l'avancement de vos projets</p>
        </div>
        <div class="view-actions">
          <select id="reportProject" onchange="Reports.refreshCharts()" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem">
            <option value="all">Tous les projets</option>
            ${DB.getProjects().map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4 mb-16" id="kpiCards"></div>

      <!-- Charts row 1 -->
      <div class="grid-2 mb-16">
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Statut des tâches</div>
          </div>
          <canvas id="chartTaskStatus" height="240"></canvas>
        </div>
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Avancement des projets</div>
          </div>
          <canvas id="chartProjectProgress" height="240"></canvas>
        </div>
      </div>

      <!-- Charts row 2 -->
      <div class="grid-2 mb-16">
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Tâches par membre</div>
          </div>
          <canvas id="chartByMember" height="240"></canvas>
        </div>
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Priorité des tâches</div>
          </div>
          <canvas id="chartPriority" height="240"></canvas>
        </div>
      </div>

      <!-- Activity timeline -->
      <div class="chart-card">
        <div class="card-header">
          <div class="card-title">Vue d'ensemble des projets</div>
        </div>
        <div id="projectSummaryTable" style="overflow-x:auto"></div>
      </div>
    `;

    this.refreshCharts();
  },

  getFilteredTasks() {
    const sel = document.getElementById('reportProject');
    const projectId = sel ? sel.value : 'all';
    let tasks = DB.getTasks();
    if (projectId !== 'all') tasks = tasks.filter(t => t.projectId === projectId);
    return tasks;
  },

  refreshCharts() {
    const tasks = this.getFilteredTasks();
    this.renderKPIs(tasks);
    this.renderTaskStatusChart(tasks);
    this.renderProjectProgressChart();
    this.renderByMemberChart(tasks);
    this.renderPriorityChart(tasks);
    this.renderProjectTable();
  },

  renderKPIs(tasks) {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('kpiCards').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(79,70,229,.1)">📊</div>
        <div class="stat-info">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Tâches totales</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1)">✅</div>
        <div class="stat-info">
          <div class="stat-value">${done}</div>
          <div class="stat-label">Terminées</div>
          <div class="stat-change up">Taux : ${rate}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,.1)">⚡</div>
        <div class="stat-info">
          <div class="stat-value">${inProgress}</div>
          <div class="stat-label">En cours</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1)">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">${overdue}</div>
          <div class="stat-label">En retard</div>
          <div class="stat-change ${overdue > 0 ? 'down' : 'up'}">${overdue > 0 ? 'Action requise' : 'Tout est à jour'}</div>
        </div>
      </div>
    `;
  },

  destroyChart(id) {
    if (this.charts[id]) {
      this.charts[id].destroy();
      delete this.charts[id];
    }
  },

  renderTaskStatusChart(tasks) {
    this.destroyChart('taskStatus');
    const counts = {
      'À faire': tasks.filter(t => t.status === 'todo').length,
      'En cours': tasks.filter(t => t.status === 'in-progress').length,
      'En révision': tasks.filter(t => t.status === 'review').length,
      'Terminé': tasks.filter(t => t.status === 'done').length
    };
    const ctx = document.getElementById('chartTaskStatus');
    if (!ctx) return;
    this.charts.taskStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#94a3b8','#3b82f6','#f59e0b','#10b981'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  renderProjectProgressChart() {
    this.destroyChart('projectProgress');
    const projects = DB.getProjects();
    const ctx = document.getElementById('chartProjectProgress');
    if (!ctx || projects.length === 0) return;
    this.charts.projectProgress = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projects.map(p => p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name),
        datasets: [{
          label: 'Progression (%)',
          data: projects.map(p => p.progress),
          backgroundColor: projects.map(p => p.color + 'cc'),
          borderColor: projects.map(p => p.color),
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
        }
      }
    });
  },

  renderByMemberChart(tasks) {
    this.destroyChart('byMember');
    const users = DB.getUsers();
    const counts = users.map(u => ({
      name: u.name.split(' ')[0],
      active: tasks.filter(t => t.assignees.includes(u.id) && t.status !== 'done').length,
      done: tasks.filter(t => t.assignees.includes(u.id) && t.status === 'done').length,
      color: u.color
    }));
    const ctx = document.getElementById('chartByMember');
    if (!ctx) return;
    this.charts.byMember = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: counts.map(u => u.name),
        datasets: [
          { label: 'En cours', data: counts.map(u => u.active), backgroundColor: '#3b82f6cc', borderColor: '#3b82f6', borderWidth: 2, borderRadius: 4 },
          { label: 'Terminées', data: counts.map(u => u.done), backgroundColor: '#10b981cc', borderColor: '#10b981', borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: false }, y: { beginAtZero: true } }
      }
    });
  },

  renderPriorityChart(tasks) {
    this.destroyChart('priority');
    const counts = {
      'Haute': tasks.filter(t => t.priority === 'high').length,
      'Moyenne': tasks.filter(t => t.priority === 'medium').length,
      'Basse': tasks.filter(t => t.priority === 'low').length
    };
    const ctx = document.getElementById('chartPriority');
    if (!ctx) return;
    this.charts.priority = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#ef4444cc','#f59e0bcc','#10b981cc'],
          borderColor: ['#ef4444','#f59e0b','#10b981'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  renderProjectTable() {
    const projects = DB.getProjects();
    const allTasks = DB.getTasks();
    document.getElementById('projectSummaryTable').innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Projet</th>
            <th>Statut</th>
            <th>Priorité</th>
            <th>Membres</th>
            <th>Total tâches</th>
            <th>Terminées</th>
            <th>En retard</th>
            <th>Progression</th>
            <th>Échéance</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => {
            const tasks = allTasks.filter(t => t.projectId === p.id);
            const done = tasks.filter(t => t.status === 'done').length;
            const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;
            return `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:10px;height:10px;border-radius:3px;background:${p.color}"></div>
                    <span style="font-weight:500">${p.name}</span>
                  </div>
                </td>
                <td>${statusBadge(p.status)}</td>
                <td>${priorityBadge(p.priority)}</td>
                <td>${p.members.length}</td>
                <td>${tasks.length}</td>
                <td style="color:var(--success);font-weight:600">${done}</td>
                <td style="color:${overdue > 0 ? 'var(--danger)' : 'var(--text-muted)'};font-weight:${overdue > 0 ? '600' : '400'}">${overdue}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;min-width:120px">
                    <div class="progress-bar" style="flex:1">
                      <div class="progress-fill" style="width:${p.progress}%;background:${p.color}"></div>
                    </div>
                    <span style="font-size:.8rem;font-weight:600;color:${p.color};min-width:32px">${p.progress}%</span>
                  </div>
                </td>
                <td style="font-size:.8rem;color:var(--text-muted)">${formatDate(p.endDate)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
};
