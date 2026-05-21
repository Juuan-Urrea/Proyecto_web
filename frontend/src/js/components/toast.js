/**
 * ARCHIVO: components/toast.js
 * QUÉ HACE: Crea y muestra notificaciones flotantes en la esquina inferior.
 *           Elimina la notificación del DOM después de 4 segundos.
 * EXPORTA: toast (objeto con success, error, warning)
 */

// Asegura que el contenedor exista en el DOM
function asegurarContenedor() {
  let contenedor = document.getElementById('contenedor-toasts');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'contenedor-toasts';
    document.body.appendChild(contenedor);
  }
  return contenedor;
}

function mostrar(mensaje, tipo) {
  const contenedor = asegurarContenedor();
  
  // Crea el elemento del toast
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  
  // Define el icono según el tipo
  const iconos = {
    exito: '✅',
    error: '❌',
    aviso: '⚠️'
  };
  
  el.innerHTML = `
    <span class="toast-icono">${iconos[tipo]}</span>
    <span class="toast-mensaje">${mensaje}</span>
  `;
  
  // Agrega al DOM
  contenedor.appendChild(el);
  
  // Elimina después de 4 segundos
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s ease';
    
    // Espera a que termine la transición para remover del DOM
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

export const toast = {
  success: (msg) => mostrar(msg, 'exito'),
  error:   (msg) => mostrar(msg, 'error'),
  warning: (msg) => mostrar(msg, 'aviso'),
};
