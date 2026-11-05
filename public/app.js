const estado = { libros: [], usuarios: [], prestamos: [], ventas: [] };
const hoy = () => new Date().toISOString().split('T')[0];

function notificar(mensaje, esError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.style.borderLeft = esError ? '4px solid #ef4444' : '4px solid #10b981';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

async function api(url, method = 'GET', body = null) {
  const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalle = data.detalles ? data.detalles.map((d) => d.mensaje).join(' ') : '';
    throw new Error(detalle || data.error || 'Error en la petición');
  }
  return data;
}

function mostrarVista(vista) {
  ['public', 'login', 'admin'].forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== vista);
  });
  if (vista === 'public') cargarCatalogoPublico();
  if (vista === 'admin') cargarDatosAdmin();
}

function cambiarTab(tabId) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== tabId));
}

function autocompletarDemo() {
  document.getElementById('login-correo').value = 'admin@libreria.com';
  document.getElementById('login-identificacion').value = '1000000001';
}

// 1. Versión SemVer y Catálogo Público
async function cargarVersion() {
  try {
    const info = await api('/version');
    document.getElementById('public-version').textContent = `v${info.version}`;
    document.getElementById('admin-version').textContent = `v${info.version}`;
    document.getElementById('stat-semver').textContent = `SemVer ${info.version}`;
  } catch {}
}

async function cargarCatalogoPublico() {
  try {
    const libros = await api('/books?activos=true');
    const totalUnidades = libros.reduce((acc, l) => acc + Number(l.cantidad || 0), 0);
    document.getElementById('stat-titulos').textContent = libros.length;
    document.getElementById('stat-unidades').textContent = totalUnidades;

    const grid = document.getElementById('public-books-grid');
    grid.innerHTML = libros.length
      ? libros
          .map(
            (l) => `
        <article class="book-card">
          <div>
            <span class="badge ${l.cantidad > 0 ? 'badge-success' : 'badge-danger'}">
              ${l.cantidad > 0 ? `${l.cantidad} disponibles` : 'Agotado'}
            </span>
            <h4 style="margin-top:0.5rem">${l.titulo}</h4>
            <p class="book-meta">${l.autor} · ${l.categoria}</p>
            <p class="book-meta">Editorial: ${l.editorial || 'N/A'}</p>
          </div>
          <div class="book-footer">
            <span class="price-tag">$${Number(l.precio).toFixed(2)}</span>
            <small class="text-muted">${l.fecha_de_publicacion ? l.fecha_de_publicacion.split('T')[0] : ''}</small>
          </div>
        </article>`
          )
          .join('')
      : '<p class="text-muted">No hay libros activos registrados actualmente.</p>';
  } catch (err) {
    notificar(err.message, true);
  }
}

// 2. Autenticación Administrador (JWT + Cookies)
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const correo = document.getElementById('login-correo').value;
    const identificacion = document.getElementById('login-identificacion').value;
    const res = await api('/auth/login', 'POST', { correo, identificacion });
    document.getElementById('admin-user-info').textContent = `${res.usuario.nombre} (${res.usuario.rol})`;
    notificar('Bienvenido al panel administrativo');
    mostrarVista('admin');
  } catch (err) {
    notificar(err.message, true);
  }
});

async function cerrarSesion() {
  await api('/auth/logout', 'POST');
  notificar('Sesión cerrada correctamente');
  mostrarVista('public');
}

// 3. Carga y renderizado del Panel Administrador
async function cargarDatosAdmin() {
  try {
    const [libros, usuarios, prestamos, ventas] = await Promise.all([
      api('/books'),
      api('/users'),
      api('/loans'),
      api('/sales'),
    ]);
    Object.assign(estado, { libros, usuarios, prestamos, ventas });
    renderLibros();
    renderSelectores();
    renderPrestamos();
    renderVentas();
    renderUsuarios();
  } catch (err) {
    notificar(err.message, true);
    mostrarVista('login');
  }
}

function renderSelectores() {
  const librosActivos = estado.libros.filter((l) => l.activo);
  const opcionesLibros = librosActivos
    .map((l) => `<option value="${l.id}">${l.titulo} (Stock: ${l.cantidad} - $${Number(l.precio).toFixed(2)})</option>`)
    .join('');
  document.getElementById('loan-libro').innerHTML = opcionesLibros;
  document.getElementById('sale-libro').innerHTML = opcionesLibros;

  const opcionesClientes = estado.usuarios
    .map((u) => `<option value="${u.id}">${u.nombre} (${u.identificacion})</option>`)
    .join('');
  document.getElementById('loan-cliente').innerHTML = opcionesClientes;
  document.getElementById('sale-cliente').innerHTML = `<option value="">-- Venta Mostrador --</option>${opcionesClientes}`;
}

function renderLibros() {
  document.getElementById('tbody-books').innerHTML = estado.libros
    .map(
      (l) => `
    <tr>
      <td>#${l.id}</td>
      <td><strong>${l.titulo}</strong><br><small class="text-muted">${l.autor} (${l.editorial || 'S/E'})</small></td>
      <td>${l.categoria}</td>
      <td>$${Number(l.precio).toFixed(2)}</td>
      <td><span class="badge ${l.cantidad > 0 ? 'badge-success' : 'badge-danger'}">${l.cantidad} uds.</span></td>
      <td><span class="badge ${l.activo ? 'badge-success' : 'badge-warning'}">${l.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarLibro(${l.id})">Editar</button>
        ${l.activo ? `<button class="btn btn-danger btn-sm" onclick="eliminarLibro(${l.id})">Baja</button>` : ''}
      </td>
    </tr>`
    )
    .join('');
}

function renderPrestamos() {
  document.getElementById('tbody-loans').innerHTML = estado.prestamos
    .map(
      (p) => `
    <tr>
      <td>#${p.id}</td>
      <td><strong>${p.titulo_libro}</strong></td>
      <td>${p.nombre_cliente}</td>
      <td>${String(p.fecha_prestamo).split('T')[0]}</td>
      <td>${String(p.fecha_devolucion_estimada).split('T')[0]}</td>
      <td>${p.fecha_devolucion ? String(p.fecha_devolucion).split('T')[0] : '-'}</td>
      <td><span class="badge ${p.estado === 'Devuelto' ? 'badge-success' : 'badge-warning'}">${p.estado}</span></td>
      <td>
        ${!p.fecha_devolucion ? `<button class="btn btn-primary btn-sm" onclick="devolverPrestamo(${p.id})">Devolver</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="eliminarPrestamo(${p.id})">Eliminar</button>
      </td>
    </tr>`
    )
    .join('');
}

function renderVentas() {
  document.getElementById('tbody-sales').innerHTML = estado.ventas
    .map(
      (v) => `
    <tr>
      <td>#${v.id}</td>
      <td><strong>${v.titulo_libro}</strong></td>
      <td>${v.nombre_cliente}</td>
      <td>${v.cantidad}</td>
      <td>$${Number(v.precio_unitario).toFixed(2)}</td>
      <td><strong>$${Number(v.total).toFixed(2)}</strong></td>
      <td>${String(v.fecha_compra).split('T')[0]}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarVenta(${v.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarVenta(${v.id})">Anular</button>
      </td>
    </tr>`
    )
    .join('');
}

function renderUsuarios() {
  document.getElementById('tbody-users').innerHTML = estado.usuarios
    .map(
      (u) => `
    <tr>
      <td>#${u.id}</td>
      <td>${u.identificacion}</td>
      <td><strong>${u.nombre}</strong><br><small class="text-muted">${u.direccion}</small></td>
      <td>${u.correo}<br><small class="text-muted">${u.numero_telefonico}</small></td>
      <td><span class="badge ${u.rol === 'Administrador' ? 'badge-warning' : 'badge-success'}">${u.rol}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarUsuario(${u.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>
      </td>
    </tr>`
    )
    .join('');
}

// 4. Acciones CRUD (Libros, Préstamos, Ventas, Usuarios)
document.getElementById('form-book').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('book-id').value;
  const body = {
    titulo: document.getElementById('book-titulo').value,
    categoria: document.getElementById('book-categoria').value,
    editorial: document.getElementById('book-editorial').value,
    autor: document.getElementById('book-autor').value,
    fecha_de_publicacion: document.getElementById('book-fecha').value || null,
    precio: Number(document.getElementById('book-precio').value),
    cantidad: Number(document.getElementById('book-cantidad').value),
    activo: true,
  };
  try {
    await api(id ? `/books/${id}` : '/books', id ? 'PUT' : 'POST', body);
    notificar(id ? 'Libro e inventario actualizados' : 'Libro registrado con su inventario inicial');
    limpiarFormLibro();
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
});

function editarLibro(id) {
  const l = estado.libros.find((x) => x.id === id);
  if (!l) return;
  document.getElementById('book-id').value = l.id;
  document.getElementById('book-titulo').value = l.titulo;
  document.getElementById('book-categoria').value = l.categoria;
  document.getElementById('book-editorial').value = l.editorial || '';
  document.getElementById('book-autor').value = l.autor;
  document.getElementById('book-fecha').value = l.fecha_de_publicacion ? String(l.fecha_de_publicacion).split('T')[0] : '';
  document.getElementById('book-precio').value = l.precio;
  document.getElementById('book-cantidad').value = l.cantidad;
  document.getElementById('book-form-title').textContent = `Editar Libro #${l.id}`;
}

function limpiarFormLibro() {
  document.getElementById('form-book').reset();
  document.getElementById('book-id').value = '';
  document.getElementById('book-form-title').textContent = 'Registrar Libro e Inventario';
}

async function eliminarLibro(id) {
  try {
    await api(`/books/${id}`, 'DELETE');
    notificar('Libro dado de baja');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
}

document.getElementById('form-loan').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/loans', 'POST', {
      id_libro: Number(document.getElementById('loan-libro').value),
      id_cliente: Number(document.getElementById('loan-cliente').value),
      fecha_prestamo: document.getElementById('loan-fecha-prestamo').value,
      fecha_devolucion_estimada: document.getElementById('loan-fecha-estimada').value,
    });
    notificar('Préstamo registrado y 1 ejemplar descontado del stock');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
});

async function devolverPrestamo(id) {
  try {
    await api(`/loans/${id}`, 'PUT', { fecha_devolucion: hoy() });
    notificar('Devolución registrada y ejemplar reintegrado al stock');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
}

async function eliminarPrestamo(id) {
  try {
    await api(`/loans/${id}`, 'DELETE');
    notificar('Préstamo eliminado');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
}

document.getElementById('form-sale').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('sale-id').value;
  const body = {
    id_libro: Number(document.getElementById('sale-libro').value),
    id_cliente: document.getElementById('sale-cliente').value ? Number(document.getElementById('sale-cliente').value) : null,
    cantidad: Number(document.getElementById('sale-cantidad').value),
    fecha_compra: document.getElementById('sale-fecha').value,
  };
  try {
    await api(id ? `/sales/${id}` : '/sales', id ? 'PUT' : 'POST', body);
    notificar(id ? 'Venta actualizada y stock ajustado' : 'Venta registrada y stock descontado');
    limpiarFormVenta();
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
});

function editarVenta(id) {
  const v = estado.ventas.find((x) => x.id === id);
  if (!v) return;
  document.getElementById('sale-id').value = v.id;
  document.getElementById('sale-libro').value = v.id_libro;
  document.getElementById('sale-cliente').value = v.id_cliente || '';
  document.getElementById('sale-cantidad').value = v.cantidad;
  document.getElementById('sale-fecha').value = String(v.fecha_compra).split('T')[0];
  document.getElementById('sale-form-title').textContent = `Editar Venta #${v.id}`;
}

function limpiarFormVenta() {
  document.getElementById('form-sale').reset();
  document.getElementById('sale-id').value = '';
  document.getElementById('sale-fecha').value = hoy();
  document.getElementById('sale-form-title').textContent = 'Registrar Venta';
}

async function eliminarVenta(id) {
  try {
    await api(`/sales/${id}`, 'DELETE');
    notificar('Venta anulada y unidades reintegradas al inventario');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
}

document.getElementById('form-user').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('user-id').value;
  const body = {
    identificacion: document.getElementById('user-identificacion').value,
    nombre: document.getElementById('user-nombre').value,
    numero_telefonico: document.getElementById('user-telefono').value,
    direccion: document.getElementById('user-direccion').value,
    correo: document.getElementById('user-correo').value,
    rol: document.getElementById('user-rol').value,
  };
  try {
    await api(id ? `/users/${id}` : '/users', id ? 'PUT' : 'POST', body);
    notificar(id ? 'Usuario actualizado' : 'Usuario registrado');
    limpiarFormUsuario();
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
});

function editarUsuario(id) {
  const u = estado.usuarios.find((x) => x.id === id);
  if (!u) return;
  document.getElementById('user-id').value = u.id;
  document.getElementById('user-identificacion').value = u.identificacion;
  document.getElementById('user-nombre').value = u.nombre;
  document.getElementById('user-telefono').value = u.numero_telefonico;
  document.getElementById('user-direccion').value = u.direccion;
  document.getElementById('user-correo').value = u.correo;
  document.getElementById('user-rol').value = u.rol;
  document.getElementById('user-form-title').textContent = `Editar Usuario #${u.id}`;
}

function limpiarFormUsuario() {
  document.getElementById('form-user').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('user-form-title').textContent = 'Registrar Usuario / Cliente';
}

async function eliminarUsuario(id) {
  try {
    await api(`/users/${id}`, 'DELETE');
    notificar('Usuario eliminado');
    cargarDatosAdmin();
  } catch (err) {
    notificar(err.message, true);
  }
}

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('loan-fecha-prestamo').value = hoy();
  document.getElementById('sale-fecha').value = hoy();
  await cargarVersion();
  await cargarCatalogoPublico();
  try {
    const sesion = await api('/auth/me');
    if (sesion.autenticado) {
      document.getElementById('admin-user-info').textContent = `${sesion.usuario.nombre} (${sesion.usuario.rol})`;
    }
  } catch {}
});
