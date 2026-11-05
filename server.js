import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import AuthRouter from './src/routes/auth.routes.js';
import usersRouter from './src/routes/users.routes.js';
import BooksRouter from './src/routes/books.routes.js';
import LoansRouter from './src/routes/loans.routes.js';
import SalesRouter from './src/routes/sales.routes.js';
import { semverMiddleware, obtenerInfoVersion, APP_VERSION } from './src/middlewares/semver.middleware.js';
import { verificarAdmin } from './src/middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(semverMiddleware);

// Archivos estáticos del Frontend (Vista pública y Panel Administrador)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de versión con SemVer
app.get('/version', obtenerInfoVersion);

// Rutas de Autenticación (JWT + Cookies)
app.use('/auth', AuthRouter);

// Rutas de Libros (GET público para presentación, escritura protegida para Administrador)
app.use(
  '/books',
  (req, res, next) => {
    if (req.method === 'GET') return next();
    return verificarAdmin(req, res, next);
  },
  BooksRouter
);

// Rutas exclusivas de Administración
app.use('/users', verificarAdmin, usersRouter);
app.use('/loans', verificarAdmin, LoansRouter);
app.use('/sales', verificarAdmin, SalesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'El cuerpo de la petición no es un JSON válido.',
    });
  }

  console.error('Error interno:', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`Server v${APP_VERSION} running on http://localhost:${port}`);
});
