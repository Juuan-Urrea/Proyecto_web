/**
 * ARCHIVO: services/wompi.service.js
 * QUÉ HACE: Encapsula la comunicación con la API de Wompi (pagos colombianos).
 *           Crea transacciones y verifica firmas HMAC de webhooks.
 * DEPENDE DE: process.env.WOMPI_*, crypto
 * EXPORTA: crearTransaccionWompi, verificarFirmaWompi
 */

import crypto from 'crypto';

/**
 * Crea una transacción en la API de Wompi para un pago digital.
 * Devuelve el link al que se debe redirigir al usuario.
 * @param {{ sessionId: string, monto: number, referencia: string, email: string }} datos
 * @returns {{ url: string, wompi_id: string }}
 */
export async function crearTransaccionWompi({ sessionId, monto, referencia, email }) {
  const respuesta = await fetch(`${process.env.WOMPI_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
    body: JSON.stringify({
      amount_in_cents: monto * 100, // Wompi trabaja en centavos
      currency: 'COP',
      customer_email: email,
      reference: referencia,
      redirect_url: `${process.env.FRONTEND_URL}/pages/confirmacion.html?sesion=${sessionId}`,
    }),
  });

  if (!respuesta.ok) {
    throw new Error('Error al crear la transacción en Wompi.');
  }

  const datos = await respuesta.json();
  return {
    url: datos.data?.payment_link?.permalink,
    wompi_id: datos.data?.id,
  };
}

/**
 * Verifica que el webhook de Wompi sea legítimo usando la firma HMAC-SHA256.
 * Wompi documenta el proceso en: https://docs.wompi.co/docs/colombia/eventos/
 * @param {string} cuerpo    - Body crudo del request (como string)
 * @param {string} firma     - Valor del header x-event-checksum
 * @returns {boolean}
 */
export function verificarFirmaWompi(cuerpo, firma) {
  const firmaEsperada = crypto
    .createHmac('sha256', process.env.WOMPI_EVENTS_SECRET)
    .update(cuerpo)
    .digest('hex');
  return firmaEsperada === firma;
}
