/**
 * ARCHIVO: controllers/pagos.controller.js
 * QUÉ HACE: Inicia pagos en Wompi y procesa el webhook con verificación HMAC.
 *           Si el pago es aprobado, confirma la sesión y crea notificaciones.
 * DEPENDE DE: ../config/base-de-datos.js, ../services/wompi.service.js,
 *             ../services/notificaciones.service.js
 * EXPORTA: iniciarPago, webhookWompi, estadoPago
 */

import { pool } from '../config/base-de-datos.js';
import { crearTransaccionWompi, verificarFirmaWompi } from '../services/wompi.service.js';
import { crearNotificacion } from '../services/notificaciones.service.js';

/** POST /api/pagos/iniciar */
export async function iniciarPago(req, res) {
  const { session_id } = req.body;
  const { rows } = await pool.query(
    `SELECT s.*, u.email FROM sessions s JOIN users u ON u.id=s.estudiante_id WHERE s.id=$1`,
    [session_id]
  );
  const sesion = rows[0];
  if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada.' });

  const referencia = `myteacher-${sesion.id}-${Date.now()}`;

  try {
    const { url, wompi_id } = await crearTransaccionWompi({
      sessionId: sesion.id,
      monto: sesion.precio_total,
      referencia,
      email: sesion.email,
    });

    // Guarda la referencia de Wompi en la sesión
    await pool.query(
      `UPDATE sessions SET wompi_ref=$1, updated_at=NOW() WHERE id=$2`,
      [referencia, sesion.id]
    );

    // Crea el registro de pago en estado pendiente
    await pool.query(
      `INSERT INTO payments (session_id,tutor_id,estudiante_id,monto,metodo,wompi_id,wompi_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [sesion.id, sesion.tutor_id, sesion.estudiante_id, sesion.precio_total, sesion.metodo_pago, wompi_id, referencia]
    );

    res.json({ url, referencia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/** POST /api/pagos/webhook — recibe eventos de Wompi */
export async function webhookWompi(req, res) {
  const firma = req.headers['x-event-checksum'];
  // El body debe estar como string para verificar la firma
  const cuerpoRaw = JSON.stringify(req.body);

  if (!verificarFirmaWompi(cuerpoRaw, firma)) {
    return res.status(401).json({ error: 'Firma inválida.' });
  }

  const { status, reference } = req.body?.data?.transaction ?? {};

  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE wompi_ref=$1`, [reference]
  );
  const sesion = rows[0];
  if (!sesion) return res.sendStatus(200); // No es una sesión conocida, ignorar

  if (status === 'APPROVED') {
    await pool.query(
      `UPDATE sessions SET status='confirmada', updated_at=NOW() WHERE id=$1`, [sesion.id]
    );
    await pool.query(
      `UPDATE payments SET status='aprobado', updated_at=NOW() WHERE wompi_ref=$1`, [reference]
    );
    await crearNotificacion(sesion.tutor_id, 'pago_confirmado', 'Pago recibido',
      `El pago de la sesión del ${sesion.fecha} fue aprobado.`, '/pages/tutorias.html');
    await crearNotificacion(sesion.estudiante_id, 'reserva_confirmada', 'Sesión confirmada',
      `Tu sesión del ${sesion.fecha} fue confirmada.`, '/pages/tutorias.html');
  } else if (['DECLINED', 'VOIDED'].includes(status)) {
    await pool.query(
      `UPDATE sessions SET status='cancelada', updated_at=NOW() WHERE id=$1`, [sesion.id]
    );
    await pool.query(
      `UPDATE payments SET status='rechazado', updated_at=NOW() WHERE wompi_ref=$1`, [reference]
    );
    await crearNotificacion(sesion.estudiante_id, 'reserva_cancelada', 'Pago rechazado',
      'Tu pago no pudo procesarse. Intenta de nuevo.', '/pages/tutorias.html');
  }

  // Wompi requiere 200 para no reintentar el webhook
  res.sendStatus(200);
}

/** GET /api/pagos/sesion/:sessionId */
export async function estadoPago(req, res) {
  const { rows } = await pool.query(
    `SELECT status, monto, metodo, wompi_ref, created_at FROM payments WHERE session_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [req.params.sessionId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'No se encontró pago para esta sesión.' });
  res.json({ pago: rows[0] });
}
