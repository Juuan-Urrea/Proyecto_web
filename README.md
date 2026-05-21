<p align="center">
  <img src="https://i.ibb.co/qLKRg7c9/image.png?text=myTEACHER+Banner" alt="Banner del Proyecto">
</p>

<h1 align="center">myTEACHER</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-En%20Desarrollo-yellow" alt="Estado">
  <img src="https://img.shields.io/badge/Tipo-Proyecto%20Educativo-blue" alt="Tipo">
  <img src="https://img.shields.io/badge/Modalidad-Presencial%20%7C%20Virtual-green" alt="Modalidad">
  <img src="https://img.shields.io/badge/Stack-Node.js%20%7C%20JS%20Vanilla%20%7C%20PostgreSQL-blueviolet" alt="Tecnologías">
</p>

<p align="center">
  Plataforma diseñada para conectar a estudiantes con tutores calificados en diferentes materias y niveles educativos.
</p>

<hr>

<h3>Resumen</h3>
<p>El proyecto myTEACHER es una Plataforma de Tutorías en Línea y presencial construida desde cero. Esta solución está diseñada para conectar a estudiantes con tutores calificados en diferentes materias y niveles educativos. Los estudiantes pueden buscar y reservar sesiones de tutoría, mientras que los tutores pueden gestionar su disponibilidad y proporcionar sesiones a través de videoconferencias seguras o encuentros presenciales.</p>

<hr>

<h3>Objetivos del Proyecto</h3>
<p>El objetivo principal es desarrollar una aplicación web moderna y escalable que permita a los usuarios acceder a la plataforma desde cualquier dispositivo (web o móvil), garantizando una experiencia de usuario (UX) excepcional y una separación limpia de responsabilidades en la arquitectura del software.</p>

<table>
  <thead>
    <tr>
      <th align="left">Área</th>
      <th align="left">Objetivo Específico</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Tecnología</b></td>
      <td>Implementar una API RESTful robusta en Node.js, combinada con un Frontend en JS Vainilla moderno y CSS Puro (Glassmorphism, Responsive).</td>
    </tr>
    <tr>
      <td><b>Búsqueda</b></td>
      <td>Permitir buscar tutores por materia, nivel educativo, área geográfica, precio y disponibilidad.</td>
    </tr>
    <tr>
      <td><b>Gestión</b></td>
      <td>Facilitar la reserva interactiva de sesiones y la aceptación/rechazo de solicitudes por parte de los tutores.</td>
    </tr>
    <tr>
      <td><b>Comunicación</b></td>
      <td>Integrar chat de mensajería instantánea por WebSockets y salas de videoconferencias virtuales privadas.</td>
    </tr>
    <tr>
      <td><b>Seguridad</b></td>
      <td>Garantizar la autenticación de usuarios y la protección de datos mediante JWT y encriptación de contraseñas.</td>
    </tr>
  </tbody>
</table>

<hr>

<h3>Reglas del Negocio</h3>

<p>El funcionamiento de la plataforma se rige por las siguientes reglas implementadas:</p>

  <p><b>1. Registro de Usuarios:</b> Estudiantes y tutores tienen flujos de registro separados. Los tutores definen su perfil profesional, materias y tarifas.</p>

  <p><b>2. Búsqueda de Tutores:</b> Los estudiantes pueden filtrar la base de datos de tutores y consultar sus perfiles públicos antes de reservar.</p>

  <p><b>3. Reserva de Sesiones:</b> Los estudiantes pueden reservar sesiones eligiendo fechas y horas basadas exactamente en la disponibilidad calculada del tutor en tiempo real.</p>

  <p><b>4. Gestión de Disponibilidad:</b> Los tutores establecen un horario base de trabajo y tienen la potestad de aceptar o rechazar solicitudes de tutoría entrantes.</p>

  <p><b>5. Videoconferencia Integrada:</b> Las sesiones virtuales tienen habilitadas salas privadas de video (vía API de Daily.co) que solo se activan cuando la reserva está confirmada.</p>

<hr>

<h3>Alcance del Proyecto y Características</h3>
<p>El desarrollo actual incluye las siguientes características principales y completamente funcionales:</p>

<ul>
  <li>✓ <b>Registro e Inicio de Sesión:</b> Control de acceso basado en roles (Tutor/Estudiante).</li>
  <li>✓ <b>Motor de Búsqueda de Tutores:</b> Con soporte de paginación y filtros por parámetros URL.</li>
  <li>✓ <b>Sistema de Reputación:</b> Calificación por estrellas al terminar una clase.</li>
  <li>✓ <b>Motor de Calendario Interactivo:</b> Cálculo automático de <i>slots</i> libres para evitar cruce de horarios.</li>
  <li>✓ <b>Centro de Mensajería:</b> Chat en vivo con persistencia en base de datos PostgreSQL y ordenamiento por último mensaje.</li>
  <li>✓ <b>Salas Virtuales:</b> Integración directa de Video y Audio.</li>
  <li>✓ <b>Paneles de Control (Dashboards):</b> Tableros informativos con KPIs personalizados según el rol del usuario.</li>
  <li>✓ <b>Base de Datos Relacional:</b> Estructura optimizada, escalable y con restricciones estrictas de integridad.</li>
</ul>

<hr>

<h3>Estructura del Repositorio</h3>
<p>El proyecto sigue una arquitectura estricta de cliente-servidor:</p>
<ul>
  <li><b><code>/backend</code></b>: Contiene la lógica del servidor Express.js, las migraciones SQL (en <code>scripts/migrar.js</code>), el servidor de WebSockets, controladores y servicios externos.</li>
  <li><b><code>/frontend</code></b>: Contiene el diseño y la interfaz del usuario, servido por Vite. Está compuesto por 15+ páginas HTML integradas a un núcleo estricto de utilidades JS modulares, y CSS estructurado (Layout, Componentes, Variables y Pages).</li>
</ul>

<hr>

<h3>Equipo</h3>
<p>El equipo de desarrollo está conformado por:</p>

<table>
  <thead>
    <tr>
      <th align="left">Integrante</th>
      <th align="left">Rol</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Luis Caicedo</b></td>
      <td>Líder Técnico</td>
    </tr>
    <tr>
      <td><b>Juan Urrea</b></td>
      <td>Desarrollador Fronted</td>
    </tr>
    <tr>
      <td><b>Ángel Góngora</b></td>
      <td>Desarrollador Fullstack</td>
    </tr>
    <tr>
      <td><b>Jhon Suárez</b></td>
      <td>Desarrollador Backend</td>
    </tr>
  </tbody>
</table>
