/**
 * ARCHIVO: components/navbar.js
 * QUÉ HACE: Lógica de la barra de navegación:
 *           - Ajusta los links dependiendo de si el usuario está logueado y su rol.
 *           - Consulta y actualiza el contador de notificaciones no leídas.
 *           - Maneja el menú hamburguesa en móvil.
 * DEPENDE DE: api.js, auth.js
 * EXPORTA: initNavbar
 */

import { api } from '../core/api.js';
import { getUser, isLoggedIn, cerrarSesion } from '../core/auth.js';

export async function initNavbar() {
  const user = getUser();
  const estaLogueado = isLoggedIn();
  
  // Obtener referencias a contenedores (estos deben existir en el HTML)
  const contenedorLinks = document.getElementById('navbar-links');
  const contenedorAcciones = document.getElementById('navbar-acciones');
  const btnHamburguesa = document.getElementById('navbar-hamburguesa');
  
  if (!contenedorLinks || !contenedorAcciones) return;

  // 1. Renderizar Links Centrales
  if (!estaLogueado) {
    contenedorLinks.innerHTML = `
      <a href="/index.html" class="navbar-link">Inicio</a>
      <a href="/pages/busqueda.html" class="navbar-link">Buscar Tutores</a>
    `;
    
    contenedorAcciones.innerHTML = `
      <a href="/pages/login.html" class="btn btn-fantasma btn-pequeno">Iniciar Sesión</a>
      <a href="/pages/registro-estudiante.html" class="btn btn-primario btn-pequeno">Regístrate</a>
    `;
  } else {
    // Links para usuarios logueados según su rol
    const linkPanel = user.role === 'tutor' ? '/pages/panel-tutor.html' : '/pages/panel-estudiante.html';
    
    contenedorLinks.innerHTML = `
      <a href="${linkPanel}" class="navbar-link">Dashboard</a>
      <a href="/pages/busqueda.html" class="navbar-link">Buscar Tutores</a>
      <a href="/pages/tutorias.html" class="navbar-link">Mis Tutorías</a>
      <a href="/pages/mensajes.html" class="navbar-link">Mensajes</a>
    `;
    
    // Contenedor de acciones (Campana + Avatar dropdown + Cerrar sesión)
    contenedorAcciones.innerHTML = `
      <a href="/pages/notificaciones.html" class="navbar-campana" id="btn-campana">
        🔔
        <span class="navbar-badge-notif hidden" id="badge-notif">0</span>
      </a>
      
      <a href="/pages/configuracion.html" class="avatar-container" title="Configuración">
        ${user.avatar_url 
          ? `<img src="${user.avatar_url}" class="avatar avatar-sm">`
          : `<div class="avatar-iniciales avatar-sm">${user.nombre.charAt(0)}</div>`
        }
      </a>
      
      <button id="btn-cerrar-sesion" class="btn btn-fantasma btn-pequeno">Salir</button>
    `;

    // Asignar evento al botón de salir
    document.getElementById('btn-cerrar-sesion')?.addEventListener('click', cerrarSesion);

    // 2. Obtener notificaciones no leídas
    actualizarBadgeNotificaciones();
  }

  // 3. Menú Móvil
  if (btnHamburguesa) {
    btnHamburguesa.addEventListener('click', () => {
      contenedorLinks.classList.toggle('mostrar-movil');
    });
  }
}

/**
 * Consulta la API para saber cuántas notificaciones no leídas hay
 */
async function actualizarBadgeNotificaciones() {
  const badge = document.getElementById('badge-notif');
  if (!badge) return;

  try {
    const data = await api.get('/notificaciones?leida=false');
    const total = data.no_leidas;
    
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
  }
}
