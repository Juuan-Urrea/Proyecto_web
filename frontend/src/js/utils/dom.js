/**
 * ARCHIVO: utils/dom.js
 * QUÉ HACE: Funciones auxiliares para manipular el DOM rápidamente.
 * EXPORTA: qs, qsa, renderEstrellas, crearTarjetaTutor
 */

import { MATERIAS } from '../core/constants.js';
import { formatearDinero } from '../core/constants.js';

// Selectores rápidos (alias para querySelector)
export const qs = (selector) => document.querySelector(selector);
export const qsa = (selector) => document.querySelectorAll(selector);

/**
 * Genera el HTML de las estrellas (ej: 4.5 -> 4 llenas, 1 media vacía/vacía)
 */
export function renderEstrellas(ratingStr) {
  const rating = Number(ratingStr) || 0;
  let html = '<div class="estrellas">';
  
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span>★</span>'; // Llena
    } else {
      html += '<span class="estrellas-vacia">★</span>'; // Vacía
    }
  }
  
  html += `</div> <span class="estrellas-texto">(${rating.toFixed(1)})</span>`;
  return html;
}

/**
 * Genera el HTML completo de una tarjeta de Tutor (usada en Búsqueda y Landing)
 */
export function crearTarjetaTutor(tutor) {
  // Encuentra el emoji de la primera materia
  const primeraMateria = tutor.materias?.[0];
  const materiaInfo = MATERIAS.find(m => m.label === primeraMateria);
  const emoji = materiaInfo ? materiaInfo.emoji : '🎓';

  const avatar = tutor.avatar_url 
    ? `<img src="${tutor.avatar_url}" class="avatar avatar-lg" alt="${tutor.nombre}">`
    : `<div class="avatar-iniciales avatar-lg">${tutor.nombre.charAt(0)}</div>`;

  // Se envuelve en enlace para llevar al perfil completo
  return `
    <a href="/pages/perfil-tutor.html?id=${tutor.id}" class="tarjeta tarjeta-hover tutor-card" style="text-decoration:none; color:inherit; display:flex; flex-direction:column;">
      <div style="padding: 24px; text-align: center; border-bottom: var(--ancho-borde) solid var(--color-borde);">
        <div style="display:flex; justify-content:center; margin-bottom:16px;">
          ${avatar}
        </div>
        <h3 style="margin-bottom:4px; display:flex; align-items:center; justify-content:center; gap:6px;">
          ${tutor.nombre} ${tutor.apellido}
          ${tutor.verificado ? '<span title="Verificado">✅</span>' : ''}
        </h3>
        <p style="margin-bottom:12px;">📍 ${tutor.ciudad || 'Virtual'}</p>
        
        <div style="display:flex; justify-content:center; align-items:center; gap:8px;">
          ${renderEstrellas(tutor.rating)} 
          <span style="font-size:12px; color:var(--color-texto-suave);">(${tutor.total_reviews})</span>
        </div>
      </div>
      
      <div style="padding: 16px 24px; background: var(--color-fondo-pagina); flex:1; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="margin-bottom:16px;">
          <span class="badge badge-morado">${emoji} ${primeraMateria || 'General'}</span>
          ${tutor.materias?.length > 1 ? `<span class="badge badge-gris">+${tutor.materias.length - 1}</span>` : ''}
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:18px; font-weight:700; color:var(--color-texto-oscuro);">
              ${formatearDinero(tutor.precio_hora)}
            </span>
            <span style="font-size:12px; color:var(--color-texto-suave);">/ hr</span>
          </div>
        </div>
      </div>
    </a>
  `;
}
