/**
 * ARCHIVO: core/constants.js
 * QUÉ HACE: Define todos los valores fijos del sistema como constantes.
 *           Mantiene sincronización con los ENUMs de PostgreSQL.
 * EXPORTA: ROLES, SESSION_STATUS, MODALIDAD, PAGO, NOTIF_TYPE, MATERIAS, funciones de label.
 */

export const ROLES = {
  ESTUDIANTE: 'estudiante',
  TUTOR:      'tutor',
};

export const SESSION_STATUS = {
  PENDIENTE:   'pendiente',
  CONFIRMADA:  'confirmada',
  EN_CURSO:    'en_curso',
  COMPLETADA:  'completada',
  CANCELADA:   'cancelada',
  RECHAZADA:   'rechazada',
  NO_ASISTIO:  'no_asistio',
};

export const MODALIDAD = {
  VIRTUAL:    'virtual',
  PRESENCIAL: 'presencial',
};

export const PAGO = {
  TRANSFERENCIA: 'transferencia',
  EFECTIVO:      'efectivo',
  NEQUI:         'nequi',
  PSE:           'pse',
  TARJETA:       'tarjeta',
};

export const MATERIAS = [
  { id: 'matematicas',  label: 'Matemáticas',  emoji: '📐' },
  { id: 'fisica',       label: 'Física',       emoji: '⚛️' },
  { id: 'quimica',      label: 'Química',      emoji: '🧪' },
  { id: 'ingles',       label: 'Inglés',       emoji: '🌍' },
  { id: 'programacion', label: 'Programación', emoji: '💻' },
  { id: 'historia',     label: 'Historia',     emoji: '📚' },
  { id: 'biologia',     label: 'Biología',     emoji: '🔬' },
  { id: 'economia',     label: 'Economía',     emoji: '📊' },
  { id: 'estadistica',  label: 'Estadística',  emoji: '📈' },
  { id: 'calculo',      label: 'Cálculo',      emoji: '∫'  },
];

export function labelStatus(status) {
  const mapa = {
    [SESSION_STATUS.PENDIENTE]:   'Pendiente',
    [SESSION_STATUS.CONFIRMADA]:  'Confirmada',
    [SESSION_STATUS.EN_CURSO]:    'En curso',
    [SESSION_STATUS.COMPLETADA]:  'Completada',
    [SESSION_STATUS.CANCELADA]:   'Cancelada',
    [SESSION_STATUS.RECHAZADA]:   'Rechazada',
    [SESSION_STATUS.NO_ASISTIO]:  'No asistió',
  };
  return mapa[status] ?? status;
}

export function badgeClassStatus(status) {
  const mapa = {
    [SESSION_STATUS.PENDIENTE]:  'badge-amarillo',
    [SESSION_STATUS.CONFIRMADA]: 'badge-verde',
    [SESSION_STATUS.EN_CURSO]:   'badge-morado',
    [SESSION_STATUS.COMPLETADA]: 'badge-gris',
    [SESSION_STATUS.CANCELADA]:  'badge-rojo',
    [SESSION_STATUS.RECHAZADA]:  'badge-rojo',
    [SESSION_STATUS.NO_ASISTIO]: 'badge-gris',
  };
  return mapa[status] ?? 'badge-gris';
}

export function formatearDinero(monto) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(monto);
}
