// ===== AUTENTICACIÓN =====

const AUTH_KEY = 'oe_usuario';
const PASS_KEY = 'oe_passwords';

// Usuarios del sistema
const USUARIOS_DEF = {
  maria: {
    nombre: 'María Butrón Venegas',
    iniciales: 'MB',
    rol: 'orientador',
    avatar: 'av-1'
  },
  luis: {
    nombre: 'Luis Eduardo Ibarra Hernández',
    iniciales: 'LE',
    rol: 'admin',       // Único con acceso a Configuración
    avatar: 'av-2'
  },
  ivonne: {
    nombre: 'Ivonne Teresa Ortega Alfaro',
    iniciales: 'IT',
    rol: 'orientador',
    avatar: 'av-3'
  },
  alfredo: {
    nombre: 'Alfredo Pérez Torres',
    iniciales: 'AP',
    rol: 'orientador',
    avatar: 'av-4'
  }
};

// Contraseñas por defecto (se pueden cambiar desde Configuración por el admin)
const PASSWORDS_DEFAULT = {
  maria:   'MB2026',
  luis:    'LEI2026',
  ivonne:  'IO2026',
  alfredo: 'AP2026'
};

function obtenerPasswords() {
  try {
    return JSON.parse(localStorage.getItem(PASS_KEY) || JSON.stringify(PASSWORDS_DEFAULT));
  } catch { return { ...PASSWORDS_DEFAULT }; }
}

function verificarCredenciales(usuarioId, password) {
  const passwords = obtenerPasswords();
  if (!USUARIOS_DEF[usuarioId]) return false;
  if (passwords[usuarioId] !== password) return false;
  // Guardar sesión
  const usuario = { ...USUARIOS_DEF[usuarioId], id: usuarioId };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
  return true;
}

function getUsuarioActual() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY));
  } catch { return null; }
}

function esAdmin() {
  const u = getUsuarioActual();
  return u && u.rol === 'admin';
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

// Llamar en index.html para proteger la app
function checkAuth() {
  const usuario = getUsuarioActual();
  if (!usuario) {
    window.location.href = 'login.html';
    return null;
  }
  return usuario;
}

// Cambiar contraseña (solo admin o el propio usuario)
function cambiarPassword(usuarioId, nuevaPassword) {
  const passwords = obtenerPasswords();
  passwords[usuarioId] = nuevaPassword;
  localStorage.setItem(PASS_KEY, JSON.stringify(passwords));
}
