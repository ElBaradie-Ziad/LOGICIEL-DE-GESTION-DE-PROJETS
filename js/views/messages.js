/* =============================================
   ProjeXpert – Messages View
   ============================================= */

const Messages = {
  activeConvId: null,

  render(container) {
    const convs = this.getUserConversations();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Messages</h1>
          <p class="view-subtitle">Communiquez avec votre équipe en temps réel</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="Messages.openNewConvModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle conversation
          </button>
        </div>
      </div>

      <div class="messages-layout">
        <!-- Conversation list -->
        <div class="conversations-list">
          <div class="conv-header">
            <span>Conversations</span>
            <span class="badge badge-primary">${convs.length}</span>
          </div>
          <div id="convList"></div>
        </div>

        <!-- Chat area -->
        <div class="chat-area" id="chatArea">
          <div class="flex-center" style="flex:1;flex-direction:column;gap:12px;color:var(--text-muted);padding:40px">
            <div style="font-size:3rem">💬</div>
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        </div>
      </div>
    `;

    this.renderConvList(convs);
    if (convs.length > 0) this.openConversation(convs[0].id);
  },

  getUserConversations() {
    return DB.getConversations().filter(c => c.participants.includes(App.user.id));
  },

  renderConvList(convs) {
    const el = document.getElementById('convList');
    if (!el) return;
    if (convs.length === 0) {
      el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:.875rem">Aucune conversation</div>`;
      return;
    }

    el.innerHTML = convs.map(c => {
      const unread = c.messages.filter(m => m.senderId !== App.user.id && !(m.read || []).includes(App.user.id)).length;
      const last = c.messages[c.messages.length - 1];
      const otherUser = c.type === 'direct' ? DB.getUserById(c.participants.find(id => id !== App.user.id)) : null;
      const displayName = c.type === 'direct' && otherUser ? otherUser.name : c.name;
      const avatar = c.type === 'direct' && otherUser
        ? `<div class="avatar" style="background:${otherUser.color}">${otherUser.avatar}</div>`
        : `<div class="avatar" style="background:var(--primary)">💬</div>`;

      return `
        <div class="conv-item ${this.activeConvId === c.id ? 'active' : ''}" onclick="Messages.openConversation('${c.id}')">
          ${avatar}
          <div class="conv-info">
            <div class="conv-name">${displayName}</div>
            <div class="conv-preview">${last ? last.text : 'Démarrer la conversation'}</div>
          </div>
          <div class="conv-meta">
            ${last ? `<span class="conv-time">${timeAgo(last.timestamp)}</span>` : ''}
            ${unread > 0 ? `<span class="conv-unread">${unread}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  openConversation(convId) {
    this.activeConvId = convId;
    const convs = this.getUserConversations();
    this.renderConvList(convs);

    const conv = DB.getConversations().find(c => c.id === convId);
    if (!conv) return;

    // Mark messages as read
    const allConvs = DB.getConversations();
    const c = allConvs.find(x => x.id === convId);
    if (c) {
      c.messages.forEach(m => {
        if (!m.read) m.read = [];
        if (!m.read.includes(App.user.id)) m.read.push(App.user.id);
      });
      DB.saveConversations(allConvs);
    }
    App.updateNotifBadge();

    const otherUser = conv.type === 'direct' ? DB.getUserById(conv.participants.find(id => id !== App.user.id)) : null;
    const displayName = conv.type === 'direct' && otherUser ? otherUser.name : conv.name;
    const subtitle = conv.type === 'project'
      ? `Projet · ${conv.participants.length} membres`
      : otherUser ? `${roleName(otherUser.role)}` : '';

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
      <div class="chat-header">
        ${conv.type === 'direct' && otherUser
          ? `<div class="avatar" style="background:${otherUser.color}">${otherUser.avatar}</div>`
          : `<div class="avatar" style="background:var(--primary)">💬</div>`
        }
        <div style="flex:1">
          <div style="font-weight:600;font-size:.9375rem">${displayName}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${subtitle}</div>
        </div>
        ${conv.type === 'project' ? `
          <div style="display:flex;gap:4px">
            ${conv.participants.slice(0, 5).map(uid => {
              const u = DB.getUserById(uid);
              return u ? `<div class="avatar avatar-sm" style="background:${u.color}" title="${u.name}">${u.avatar}</div>` : '';
            }).join('')}
          </div>
        ` : ''}
      </div>

      <div class="chat-messages" id="chatMessages"></div>

      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chatInput" placeholder="Écrire un message…"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Messages.sendMessage()}" />
        <button class="btn btn-primary" onclick="Messages.sendMessage()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;

    this.renderMessages(conv);
  },

  renderMessages(conv) {
    const el = document.getElementById('chatMessages');
    if (!el) return;

    if (conv.messages.length === 0) {
      el.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;font-size:.875rem">Démarrez la conversation !</div>`;
      return;
    }

    el.innerHTML = conv.messages.map((m, i) => {
      const isOwn = m.senderId === App.user.id;
      const sender = DB.getUserById(m.senderId);
      const showSender = !isOwn && (i === 0 || conv.messages[i-1].senderId !== m.senderId);

      return `
        <div class="message-group ${isOwn ? 'own' : ''}">
          ${!isOwn ? `<div class="avatar avatar-sm" style="background:${sender ? sender.color : '#64748b'}">${sender ? sender.avatar : '?'}</div>` : ''}
          <div>
            ${showSender && !isOwn ? `<div class="message-sender">${sender ? sender.name : '?'}</div>` : ''}
            <div class="message-bubble">
              <div class="message-text">${this.escapeHtml(m.text)}</div>
              <div class="message-time">${timeAgo(m.timestamp)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    el.scrollTop = el.scrollHeight;
  },

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || !this.activeConvId) return;

    const allConvs = DB.getConversations();
    const conv = allConvs.find(c => c.id === this.activeConvId);
    if (!conv) return;

    const msg = {
      id: DB.uid(),
      senderId: App.user.id,
      text,
      timestamp: new Date().toISOString(),
      read: [App.user.id]
    };
    conv.messages.push(msg);
    DB.saveConversations(allConvs);

    input.value = '';
    this.renderMessages(conv);
    this.renderConvList(this.getUserConversations());
  },

  openNewConvModal() {
    const users = DB.getUsers().filter(u => u.id !== App.user.id);
    const projects = DB.getProjects().filter(p => p.members.includes(App.user.id));

    const body = `
      <form id="convForm">
        <div class="form-group">
          <label>Type de conversation</label>
          <select id="convType" onchange="Messages.toggleConvType(this.value)">
            <option value="direct">Message direct</option>
            <option value="project">Discussion projet</option>
          </select>
        </div>
        <div id="directSection">
          <div class="form-group">
            <label>Destinataire</label>
            <select id="convUser">
              ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="projectSection" style="display:none">
          <div class="form-group">
            <label>Projet</label>
            <select id="convProject">
              ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Premier message</label>
          <textarea id="convFirstMsg" placeholder="Bonjour !…" rows="3"></textarea>
        </div>
      </form>`;

    openModal('Nouvelle conversation', body,
      `<button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Messages.createConversation()">Démarrer</button>`);
  },

  toggleConvType(type) {
    document.getElementById('directSection').style.display = type === 'direct' ? 'block' : 'none';
    document.getElementById('projectSection').style.display = type === 'project' ? 'block' : 'none';
  },

  createConversation() {
    const type = document.getElementById('convType').value;
    const firstMsg = document.getElementById('convFirstMsg').value.trim();
    let conv;

    if (type === 'direct') {
      const targetId = document.getElementById('convUser').value;
      const target = DB.getUserById(targetId);
      // Check if conversation already exists
      const existing = DB.getConversations().find(c =>
        c.type === 'direct' && c.participants.includes(App.user.id) && c.participants.includes(targetId)
      );
      if (existing) {
        closeModal();
        this.openConversation(existing.id);
        return;
      }
      conv = {
        id: DB.uid(),
        type: 'direct',
        name: target?.name || 'Direct',
        participants: [App.user.id, targetId],
        messages: []
      };
    } else {
      const projectId = document.getElementById('convProject').value;
      const project = DB.getProjectById(projectId);
      conv = {
        id: DB.uid(),
        type: 'project',
        projectId,
        name: project?.name || 'Projet',
        participants: project?.members || [App.user.id],
        messages: []
      };
    }

    if (firstMsg) {
      conv.messages.push({
        id: DB.uid(),
        senderId: App.user.id,
        text: firstMsg,
        timestamp: new Date().toISOString(),
        read: [App.user.id]
      });
    }

    const allConvs = DB.getConversations();
    allConvs.push(conv);
    DB.saveConversations(allConvs);
    closeModal();
    toast('Conversation créée !', 'success');
    this.activeConvId = conv.id;
    App.navigate('messages');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
