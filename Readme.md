# Library CLI System · Gestión Corporativa de Librería (`v1.1.0`)

Sistema integral para librerías modernas desarrollado con **Node.js**, **Express 5**, **MySQL (`mysql2/promise`)**, autenticación **JWT + Cookies (`httpOnly`)**, control de versiones **SemVer** y una interfaz web corporativa con vista pública de presentación y panel exclusivo de administración.

---

## Características Principales

1. **Control Automático de Inventario (`inventory`)**:
   - **Registro de Libros (`POST /books`)**: Al crear un libro se registra obligatoriamente su cantidad inicial en la tabla `inventory` dentro de la misma transacción.
   - **Préstamos (`POST /loans`, `PUT /loans/:id`, `DELETE /loans/:id`)**: Disminuye automáticamente `1` ejemplar al prestar un libro y lo reintegra automáticamente (`+1`) al registrar la fecha de devolución o eliminar un préstamo activo.
   - **Ventas (`POST /sales`, `PUT /sales/:id`, `DELETE /sales/:id`)**: Descuenta automáticamente la cantidad vendida del inventario, calcula el `total` según el precio unitario del libro y ajusta/reintegra el stock si la venta se edita o anula.
2. **Seguridad Backend (JWT + Cookies + SemVer)**:
   - **JWT & Cookies**: Al iniciar sesión en `POST /auth/login` (exclusivo para usuarios con rol `Administrador`), el servidor emite un token firmado con `jsonwebtoken` y lo almacena en la cookie `admin_token` (`httpOnly`).
   - **SemVer**: El middleware `semverMiddleware` expone la cabecera `X-API-Version` y valida rangos de versión enviados en `X-API-Version` o `Accept-Version`. El endpoint `GET /version` devuelve el desglose semántico de la versión actual (`1.1.0`).
3. **Interfaz Frontend Ejecutiva (`/public`)**:
   - **Vista Pública de Presentación**: Portada corporativa, indicadores en vivo y catálogo público de libros activos.
   - **Login de Administrador**: Acceso con correo e identificación.
   - **Panel Administrador**: Gestión completa de Libros e Inventario, Préstamos, Ventas y Usuarios/Clientes.

---

## Credenciales de Prueba (Administrador)

Al ejecutar `docs/sql/schema.sql`, se crea automáticamente el usuario administrador inicial:
- **Correo**: `admin@libreria.com`
- **Identificación (Clave)**: `1000000001`
- **Rol**: `Administrador`

---

## Endpoints de la API

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/version` | Público | Estado de versión SemVer del servidor |
| `POST` | `/auth/login` | Público | Login de Administrador (emite JWT y cookie `admin_token`) |
| `GET` | `/auth/me` | Admin | Verifica sesión activa mediante cookie/JWT |
| `POST` | `/auth/logout` | Público | Cierra sesión y limpia la cookie |
| `GET` | `/books` | Público | Lista libros con su cantidad actual en inventario |
| `POST` | `/books` | Admin | Registra un libro junto con su cantidad en inventario |
| `PUT` | `/books/:id` | Admin | Actualiza datos del libro y/o su cantidad en inventario |
| `DELETE` | `/books/:id` | Admin | Baja lógica del libro (`activo = FALSE`) |
| `GET/POST/PUT/DELETE` | `/loans` | Admin | CRUD de préstamos con ajuste automático de stock |
| `GET/POST/PUT/DELETE` | `/sales` | Admin | CRUD de ventas con descuento automático de stock y cálculo de total |
| `GET/POST/PUT/DELETE` | `/users` | Admin | CRUD de clientes y administradores |

