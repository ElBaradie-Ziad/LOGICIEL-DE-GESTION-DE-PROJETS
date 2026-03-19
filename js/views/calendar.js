/* =============================================
   ProjeXpert – Calendar View
   ============================================= */

const CalendarView = {
  currentDate: new Date(),
  selectedDate: null,

  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Calendrier</h1>
          <p class="view-subtitle">Gérez vos échéances et événements</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="CalendarView.openNewEventModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel événement
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 300px;gap:20px" id="calLayout">
        <div>
          <div class="calendar-container">
            <div class="calendar-header">
              <div class="calendar-nav">
                <button onclick="CalendarView.prevMonth()">‹</button>
                <button onclick="CalendarView.goToday()" style="font-weight:600">Aujourd'hui</button>
                <button onclick="CalendarView.nextMonth()">›</button>
              </div>
              <h2 class="calendar-title" id="calTitle"></h2>
              <div></div>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
              </div>
              <div class="calendar-days" id="calDays"></div>
            </div>
          </div>
        </div>

        <!-- Sidebar: events for selected day -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div class="card-title" id="selectedDateTitle">Sélectionnez une date</div>
            </div>
            <div id="dayEventsList">
              <p class="text-muted" style="font-size:.875rem">Cliquez sur une date pour voir ses événements.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Prochains événements</div>
            </div>
            <div id="upcomingEvents"></div>
          </div>
        </div>
      </div>
    `;

    this.renderCalendar();
    this.renderUpcoming();
  },

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();

    document.getElementById('calTitle').textContent =
      this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());

    const events = DB.getEvents();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week (0=Sun → need Mon-based)
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

    const days = [];
    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, current: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), current: true });
    }
    // Next month padding
    while (days.length % 7 !== 0) {
      days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 1), current: false });
    }

    const container = document.getElementById('calDays');
    container.innerHTML = days.map(({ date, current }) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = this.selectedDate === dateStr;

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${!current ? 'other-month' : ''} ${isSelected ? 'selected' : ''}"
          onclick="CalendarView.selectDate('${dateStr}')">
          <div class="day-num">${date.getDate()}</div>
          <div class="day-events">
            ${dayEvents.slice(0, 2).map(e => `
              <div class="day-event-dot" style="background:${e.color}" title="${e.title}">${e.title}</div>
            `).join('')}
            ${dayEvents.length > 2 ? `<div class="day-event-dot" style="background:var(--text-muted)">+${dayEvents.length - 2}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.renderCalendar();

    const events = DB.getEvents().filter(e => e.date === dateStr);
    const tasks = DB.getTasks().filter(t => t.dueDate === dateStr);
    const date = new Date(dateStr);

    document.getElementById('selectedDateTitle').textContent =
      date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace(/^\w/, c => c.toUpperCase());

    const el = document.getElementById('dayEventsList');
    const items = [
      ...events.map(e => ({ ...e, _type: 'event' })),
      ...tasks.map(t => ({ ...t, _type: 'task', title: `[Tâche] ${t.title}`, time: '', color: '#64748b' }))
    ];

    if (items.length === 0) {
      el.innerHTML = `<p class="text-muted" style="font-size:.875rem;padding:8px 0">Aucun événement ce jour.</p>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="CalendarView.openNewEventModal('${dateStr}')">+ Ajouter un événement</button>`;
      return;
    }

    el.innerHTML = items.map(item => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:flex-start">
        <div style="width:4px;background:${item.color};border-radius:2px;min-height:36px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:.875rem;font-weight:500">${item.title}</div>
          ${item.time ? `<div style="font-size:.75rem;color:var(--text-muted)">🕐 ${item.time}</div>` : ''}
          ${item._type === 'event' && item.participants ? `
            <div style="display:flex;gap:4px;margin-top:6px">
              ${item.participants.slice(0, 4).map(uid => {
                const u = DB.getUserById(uid);
                return u ? `<div class="avatar avatar-sm" style="background:${u.color}" title="${u.name}">${u.avatar}</div>` : '';
              }).join('')}
            </div>
          ` : ''}
        </div>
        ${item._type === 'event' ? `<button class="btn btn-ghost btn-sm" onclick="CalendarView.deleteEvent('${item.id}')">🗑️</button>` : ''}
      </div>
    `).join('') + `<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="CalendarView.openNewEventModal('${dateStr}')">+ Ajouter</button>`;
  },

  renderUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    const events = DB.getEvents()
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);

    const el = document.getElementById('upcomingEvents');
    if (events.length === 0) {
      el.innerHTML = `<p class="text-muted text-sm">Aucun événement à venir</p>`;
      return;
    }

    el.innerHTML = events.map(e => `
      <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:${e.color};flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.8rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">${formatDate(e.date)}${e.time ? ` · ${e.time}` : ''}</div>
        </div>
      </div>
    `).join('');
  },

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.renderCalendar();
  },

  goToday() {
    this.currentDate = new Date();
    this.renderCalendar();
  },

  openNewEventModal(defaultDate = '') {
    const projects = DB.getProjects();
    const users = DB.getUsers();

    const body = `
      <form id="eventForm">
        <div class="form-group">
          <label>Titre *</label>
          <input type="text" id="evTitle" placeholder="Nom de l'événement" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" id="evDate" value="${defaultDate || new Date().toISOString().split('T')[0]}" required />
          </div>
          <div class="form-group">
            <label>Heure</label>
            <input type="time" id="evTime" value="09:00" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select id="evType">
              <option value="meeting">Réunion</option>
              <option value="deadline">Échéance</option>
              <option value="task">Tâche</option>
              <option value="event">Événement</option>
            </select>
          </div>
          <div class="form-group">
            <label>Projet associé</label>
            <select id="evProject">
              <option value="">— Aucun —</option>
              ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Couleur</label>
          <input type="color" id="evColor" value="#4f46e5" style="width:48px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer" />
        </div>
        ${memberSelect([], 'Participants')}
      </form>`;

    openModal('Nouvel événement', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="CalendarView.saveEvent()">Créer l'événement</button>`);
  },

  saveEvent() {
    const title = document.getElementById('evTitle').value.trim();
    const date = document.getElementById('evDate').value;
    if (!title || !date) { toast('Titre et date requis', 'error'); return; }
    const participants = [...document.querySelectorAll('input[name="members"]:checked')].map(el => el.value);
    const event = {
      id: DB.uid(),
      title,
      date,
      time: document.getElementById('evTime').value,
      type: document.getElementById('evType').value,
      projectId: document.getElementById('evProject').value || null,
      color: document.getElementById('evColor').value,
      participants
    };
    DB.addEvent(event);
    closeModal();
    toast('Événement créé !', 'success');
    this.renderCalendar();
    this.renderUpcoming();
    if (this.selectedDate === date) this.selectDate(date);
  },

  deleteEvent(id) {
    if (!confirm('Supprimer cet événement ?')) return;
    DB.deleteEvent(id);
    toast('Événement supprimé', 'warning');
    this.renderCalendar();
    this.renderUpcoming();
    if (this.selectedDate) this.selectDate(this.selectedDate);
  }
};
