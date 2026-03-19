/* =============================================
   ProjeXpert – Authentication
   ============================================= */

const Auth = (() => {
  function login(email, password) {
    const users = DB.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect.' };
    }
    DB.setSession({ userId: user.id, loginAt: new Date().toISOString() });
    return { success: true, user };
  }

  function logout() {
    DB.clearSession();
    window.location.href = 'index.html';
  }

  function currentUser() {
    const session = DB.getSession();
    if (!session) return null;
    return DB.getUserById(session.userId);
  }

  function requireAuth() {
    const user = currentUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  }

  function can(action) {
    const user = currentUser();
    if (!user) return false;
    const perms = {
      admin: ['read','write','delete','manage_users','manage_projects'],
      manager: ['read','write','delete','manage_projects'],
      member: ['read','write']
    };
    return (perms[user.role] || []).includes(action);
  }

  return { login, logout, currentUser, requireAuth, can };
})();
