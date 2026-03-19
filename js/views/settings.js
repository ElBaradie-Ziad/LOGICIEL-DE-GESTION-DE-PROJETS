/* =============================================
   ProjeXpert – Settings View
   ============================================= */

const Settings = {
  activeTab: 'profile',

  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Paramètres</h1>
          <p class="view-subtitle">Gérez votre compte, les utilisateurs et les préférences</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Settings nav -->
        <div class="settings-nav">
          <button class="settings-nav-item ${this.activeTab === 'profile' ? 'active' : ''}" onclick="Settings.switchTab('profile')">👤 Mon profil</button>
          <button class="settings-nav-item ${this.activeTab === 'notifications' ? 'active' : ''}" onclick="Settings.switchTab('notifications')">🔔 Notifications</button>
          ${Auth.can('manage_users') ? `<button class="settings-nav-item ${this.activeTab === 'users' ? 'active' : ''}" onclick="Settings.switchTab('users')">👥 Utilisateurs</button>` : ''}
          ${Auth.can('manage_projects') ? `<button class="settings-nav-item ${this.activeTab === 'roles' ? 'active' : ''}" onclick="Settings.switchTab('roles')">🔐 Rôles & Accès</button>` : ''}
          <button class="settings-nav-item ${this.activeTab === 'appearance' ? 'active' : ''}" onclick="Settings.switchTab('appearance')">🎨 Apparence</button>
          <button class="settings-nav-item ${this.activeTab === 'data' ? 'active' : ''}" onclick="Settings.switchTab('data')">💾 Données</button>
        </div>

        <!-- Settings panels -->
        <div id="settingsContent"></div>
      </div>
    `;

    this.renderTab(this.activeTab);
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(b => {
      if (b.textContent.toLowerCase().includes(tab)) b.classList.add('active');
    });
    this.renderTab(tab);
  },

  renderTab(tab) {
    const el = document.getElementById('settingsContent');
    if (!el) return;
    const tabs = {
      profile: () => this.renderProfile(el),
      notifications: () => this.renderNotifications(el),
      users: () => this.renderUsers(el),
      roles: () => this.renderRoles(el),
      appearance: () => this.renderAppearance(el),
      data: () => this.renderData(el)
    };
    if (tabs[tab]) tabs[tab]();
  },

  renderProfile(el) {
    const u = App.user;
    el.innerHTML = `
      <div class="card">
        <div class="settings-section">
          <div class="settings-section-title">Informations personnelles</div>
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px">
            <div class="avatar avatar-lg" style="background:${u.color};width:72px;height:72px;font-size:1.5rem">${u.avatar}</div>
            <div>
              <div style="font-size:1.1rem;font-weight:600">${u.name}</div>
              <div style="font-size:.875rem;color:var(--text-muted)">${u.email}</div>
              <div style="margin-top:4px">${statusBadge(u.role)}</div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" id="profFirst" value="${u.name.split(' ')[0]}" />
            </div>
            <div class="form-group">
              <label>Nom</label>
              <input type="text" id="profLast" value="${u.name.split(' ').slice(1).join(' ')}" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="profEmail" value="${u.email}" />
          </div>
          <div class="form-group">
            <label>Couleur de profil</label>
            <div style="display:flex;align-items:center;gap:12px">
              <input type="color" id="profColor" value="${u.color}" style="width:48px;height:40px;border:1px solid var(--border);border-radius:6px;cursor:pointer" />
              <span style="font-size:.875rem;color:var(--text-muted)">Utilisée pour votre avatar</span>
            </div>
          </div>
          <button class="btn btn-primary" onclick="Settings.saveProfile()">Sauvegarder</button>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Sécurité</div>
          <div class="form-group">
            <label>Mot de passe actuel</label>
            <input type="password" id="pwdCurrent" placeholder="••••••••" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" id="pwdNew" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Confirmer</label>
              <input type="password" id="pwdConfirm" placeholder="••••••••" />
            </div>
          </div>
          <button class="btn btn-secondary" onclick="Settings.changePassword()">Changer le mot de passe</button>
        </div>
      </div>
    `;
  },

  saveProfile() {
    const users = DB.getUsers();
    const u = users.find(x => x.id === App.user.id);
    if (!u) return;
    const first = document.getElementById('profFirst').value.trim();
    const last = document.getElementById('profLast').value.trim();
    const name = `${first} ${last}`.trim();
    const color = document.getElementById('profColor').value;
    const email = document.getElementById('profEmail').value.trim();
    if (!name) { toast('Le nom est requis', 'error'); return; }
    u.name = name;
    u.email = email;
    u.color = color;
    u.avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    DB.saveUsers(users);
    App.user = u;
    App.updateUserUI();
    toast('Profil mis à jour !', 'success');
  },

  changePassword() {
    const current = document.getElementById('pwdCurrent').value;
    const newPwd = document.getElementById('pwdNew').value;
    const confirm = document.getElementById('pwdConfirm').value;
    const users = DB.getUsers();
    const u = users.find(x => x.id === App.user.id);
    if (!u || u.password !== current) { toast('Mot de passe actuel incorrect', 'error'); return; }
    if (!newPwd || newPwd.length < 6) { toast('Le nouveau mot de passe doit faire au moins 6 caractères', 'error'); return; }
    if (newPwd !== confirm) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
    u.password = newPwd;
    DB.saveUsers(users);
    toast('Mot de passe modifié !', 'success');
    document.getElementById('pwdCurrent').value = '';
    document.getElementById('pwdNew').value = '';
    document.getElementById('pwdConfirm').value = '';
  },

  renderNotifications(el) {
    el.innerHTML = `
      <div class="card">
        <div class="settings-section">
          <div class="settings-section-title">Préférences de notifications</div>
          ${[
            { id: 'notifTask', label: 'Nouvelles tâches assignées', desc: 'Recevez une notification quand une tâche vous est assignée', checked: true },
            { id: 'notifDeadline', label: 'Échéances proches', desc: 'Alertes 24h avant une échéance', checked: true },
            { id: 'notifMessage', label: 'Nouveaux messages', desc: 'Notifications pour les messages directs et de groupe', checked: true },
            { id: 'notifProject', label: 'Mises à jour de projet', desc: 'Changements de statut, nouveaux membres', checked: false },
            { id: 'notifEmail', label: 'Notifications par email', desc: 'Résumé hebdomadaire par email', checked: false }
          ].map(n => `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:.875rem;font-weight:500">${n.label}</div>
                <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px">${n.desc}</div>
              </div>
              <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;margin-left:16px">
                <input type="checkbox" id="${n.id}" ${n.checked ? 'checked' : ''} style="opacity:0;width:0;height:0" onchange="Settings.saveNotifPrefs()" />
                <span style="position:absolute;cursor:pointer;inset:0;background:${n.checked ? 'var(--primary)' : 'var(--border)'};border-radius:24px;transition:.3s"></span>
                <span style="position:absolute;content:'';width:18px;height:18px;border-radius:50%;background:#fff;top:3px;left:${n.checked ? '23px' : '3px'};transition:.3s"></span>
              </label>
            </div>
          `).join('')}
          <div style="margin-top:20px">
            <button class="btn btn-primary" onclick="Settings.saveNotifPrefs()">Enregistrer les préférences</button>
          </div>
        </div>
      </div>
    `;
  },

  saveNotifPrefs() {
    toast('Préférences de notifications enregistrées', 'success');
  },

  renderUsers(el) {
    const users = DB.getUsers();
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Gestion des utilisateurs</div>
            <div class="card-subtitle">${users.length} comptes enregistrés</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Settings.openNewUserModal()">+ Ajouter</button>
        </div>
        <div style="overflow-x:auto">
          <table class="user-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Membre depuis</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" style="background:${u.color}">${u.avatar}</div>
                      <span style="font-weight:500">${u.name}</span>
                      ${u.id === App.user.id ? '<span class="badge badge-primary" style="font-size:.65rem">Vous</span>' : ''}
                    </div>
                  </td>
                  <td style="color:var(--text-secondary)">${u.email}</td>
                  <td>
                    <select onchange="Settings.changeRole('${u.id}',this.value)" ${u.id === App.user.id ? 'disabled' : ''} style="padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:.8rem">
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                      <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
                      <option value="member" ${u.role === 'member' ? 'selected' : ''}>Membre</option>
                    </select>
                  </td>
                  <td style="color:var(--text-muted);font-size:.8rem">${formatDate(u.createdAt)}</td>
                  <td>
                    ${u.id !== App.user.id ? `
                      <button class="btn btn-ghost btn-sm" onclick="Settings.deleteUser('${u.id}')" style="color:var(--danger)">🗑️</button>
                    ` : '—'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  changeRole(userId, newRole) {
    const users = DB.getUsers();
    const u = users.find(x => x.id === userId);
    if (u) { u.role = newRole; DB.saveUsers(users); toast(`Rôle de ${u.name} modifié en ${roleName(newRole)}`, 'success'); }
  },

  deleteUser(userId) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const users = DB.getUsers().filter(u => u.id !== userId);
    DB.saveUsers(users);
    toast('Utilisateur supprimé', 'warning');
    this.renderTab('users');
  },

  openNewUserModal() {
    const body = `
      <form id="userForm">
        <div class="form-row">
          <div class="form-group">
            <label>Prénom *</label>
            <input type="text" id="uFirst" placeholder="Prénom" required />
          </div>
          <div class="form-group">
            <label>Nom *</label>
            <input type="text" id="uLast" placeholder="Nom" required />
          </div>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="uEmail" placeholder="email@exemple.fr" required />
        </div>
        <div class="form-group">
          <label>Mot de passe *</label>
          <input type="password" id="uPwd" placeholder="Min. 6 caractères" required minlength="6" />
        </div>
        <div class="form-group">
          <label>Rôle</label>
          <select id="uRole">
            <option value="member">Membre</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div class="form-group">
          <label>Couleur</label>
          <input type="color" id="uColor" value="#4f46e5" style="width:48px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer" />
        </div>
      </form>`;

    openModal('Nouvel utilisateur', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Settings.createUser()">Créer</button>`);
  },

  createUser() {
    const first = document.getElementById('uFirst').value.trim();
    const last = document.getElementById('uLast').value.trim();
    const email = document.getElementById('uEmail').value.trim();
    const pwd = document.getElementById('uPwd').value;
    if (!first || !last || !email || !pwd) { toast('Tous les champs requis doivent être remplis', 'error'); return; }
    const existing = DB.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) { toast('Cet email est déjà utilisé', 'error'); return; }
    const name = `${first} ${last}`;
    const color = document.getElementById('uColor').value;
    const user = {
      id: DB.uid(),
      name,
      email,
      password: pwd,
      role: document.getElementById('uRole').value,
      color,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      createdAt: new Date().toISOString().split('T')[0]
    };
    const users = DB.getUsers();
    users.push(user);
    DB.saveUsers(users);
    closeModal();
    toast(`Utilisateur ${name} créé !`, 'success');
    this.renderTab('users');
  },

  renderRoles(el) {
    el.innerHTML = `
      <div class="card">
        <div class="settings-section">
          <div class="settings-section-title">Rôles et permissions</div>
          ${[
            { role: 'admin', label: 'Administrateur', color: '#ef4444', desc: 'Accès complet à toutes les fonctionnalités', perms: ['Lecture', 'Écriture', 'Suppression', 'Gestion utilisateurs', 'Gestion projets'] },
            { role: 'manager', label: 'Chef de projet', color: '#4f46e5', desc: 'Peut créer et gérer des projets et des tâches', perms: ['Lecture', 'Écriture', 'Suppression', 'Gestion projets'] },
            { role: 'member', label: 'Membre', color: '#10b981', desc: 'Peut lire et modifier les tâches assignées', perms: ['Lecture', 'Écriture'] }
          ].map(r => `
            <div style="padding:20px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
                <div style="width:36px;height:36px;border-radius:50%;background:${r.color}22;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:700;color:${r.color}">${r.label[0]}</div>
                <div>
                  <div style="font-weight:600">${r.label}</div>
                  <div style="font-size:.8rem;color:var(--text-muted)">${r.desc}</div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${r.perms.map(p => `<span class="badge" style="background:${r.color}15;color:${r.color}">${p}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderAppearance(el) {
    el.innerHTML = `
      <div class="card">
        <div class="settings-section">
          <div class="settings-section-title">Thème de l'interface</div>
          <div class="grid-2">
            <div style="border:2px solid var(--primary);border-radius:var(--radius);padding:16px;cursor:pointer;text-align:center">
              <div style="width:100%;height:60px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;gap:4px;padding:8px">
                <div style="width:12px;height:100%;background:#fff;border-radius:3px;border:1px solid #e2e8f0"></div>
                <div style="flex:1;height:100%;background:#f1f5f9;border-radius:3px"></div>
              </div>
              <div style="font-size:.875rem;font-weight:500">Clair ✓</div>
            </div>
            <div style="border:1px solid var(--border);border-radius:var(--radius);padding:16px;cursor:pointer;text-align:center;opacity:.6" title="Bientôt disponible">
              <div style="width:100%;height:60px;background:#1e293b;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;gap:4px;padding:8px">
                <div style="width:12px;height:100%;background:#334155;border-radius:3px"></div>
                <div style="flex:1;height:100%;background:#0f172a;border-radius:3px"></div>
              </div>
              <div style="font-size:.875rem;font-weight:500">Sombre (bientôt)</div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Langue</div>
          <div class="form-group" style="max-width:240px">
            <select>
              <option selected>🇫🇷 Français</option>
              <option>🇬🇧 English</option>
              <option>🇪🇸 Español</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Format de date</div>
          <div class="form-group" style="max-width:240px">
            <select>
              <option selected>JJ/MM/AAAA</option>
              <option>MM/JJ/AAAA</option>
              <option>AAAA-MM-JJ</option>
            </select>
          </div>
          <button class="btn btn-primary mt-8" onclick="toast('Préférences enregistrées !','success')">Enregistrer</button>
        </div>
      </div>
    `;
  },

  renderData(el) {
    const projects = DB.getProjects();
    const tasks = DB.getTasks();
    const messages = DB.getConversations();

    el.innerHTML = `
      <div class="card">
        <div class="settings-section">
          <div class="settings-section-title">Statistiques de données</div>
          <div class="grid-3 mb-16">
            <div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:var(--radius)">
              <div style="font-size:1.75rem;font-weight:700;color:var(--primary)">${projects.length}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">Projets</div>
            </div>
            <div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:var(--radius)">
              <div style="font-size:1.75rem;font-weight:700;color:var(--primary)">${tasks.length}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">Tâches</div>
            </div>
            <div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:var(--radius)">
              <div style="font-size:1.75rem;font-weight:700;color:var(--primary)">${messages.reduce((s,c) => s + c.messages.length, 0)}</div>
              <div style="font-size:.8rem;color:var(--text-muted)">Messages</div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Export des données</div>
          <p style="font-size:.875rem;color:var(--text-secondary);margin-bottom:16px">Exportez toutes vos données au format JSON.</p>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary" onclick="Settings.exportData()">📥 Exporter JSON</button>
          </div>
        </div>

        ${Auth.can('manage_users') ? `
        <div class="settings-section">
          <div class="settings-section-title" style="color:var(--danger)">Zone de danger</div>
          <p style="font-size:.875rem;color:var(--text-secondary);margin-bottom:16px">Réinitialiser toutes les données de démonstration. <strong>Cette action est irréversible.</strong></p>
          <button class="btn btn-danger" onclick="Settings.resetData()">⚠️ Réinitialiser les données</button>
        </div>` : ''}
      </div>
    `;
  },

  exportData() {
    const data = {
      projects: DB.getProjects(),
      tasks: DB.getTasks(),
      events: DB.getEvents(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projexpert-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Données exportées !', 'success');
  },

  resetData() {
    if (!confirm('Êtes-vous sûr ? Toutes les données seront réinitialisées.')) return;
    ['px_projects','px_tasks','px_messages','px_notifications','px_events'].forEach(k => localStorage.removeItem(k));
    // Re-seed
    localStorage.removeItem('px_users');
    DB.seed();
    toast('Données réinitialisées', 'warning');
    App.navigate('dashboard');
  }
};
