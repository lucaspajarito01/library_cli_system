import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import pool from '../config/database.js';
import { validarResultados } from '../middlewares/validate.middleware.js';
import { JWT_SECRET, COOKIE_NAME, verificarAdmin } from '../middlewares/auth.middleware.js';

const AuthRouter = Router();

const validarLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Ingrese un correo electrónico válido.'),
  body('identificacion')
    .trim()
    .notEmpty().withMessage('El número de identificación (clave) es obligatorio.')
];

// Iniciar sesión (solo Administradores)
AuthRouter.post('/login', validarLogin, validarResultados, async (req, res, next) => {
  try {
    const { correo, identificacion } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE email = ? AND identification_number = ? LIMIT 1',
      [correo, identificacion]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas. Verifique su correo y número de identificación.',
      });
    }

    const usuario = rows[0];

    if (usuario.role !== 'Administrador') {
      return res.status(403).json({
        error: 'Acceso restringido. Únicamente el personal con rol Administrador puede ingresar al sistema.',
      });
    }

    const payload = {
      id: usuario.id,
      identificacion: usuario.identification_number,
      nombre: usuario.name,
      correo: usuario.email,
      rol: usuario.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    });

    return res.json({
      mensaje: 'Inicio de sesión exitoso.',
      usuario: payload,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Verificar sesión activa mediante cookie o JWT
AuthRouter.get('/me', verificarAdmin, (req, res) => {
  return res.json({
    autenticado: true,
    usuario: req.usuario,
  });
});

// Cerrar sesión y limpiar cookie
AuthRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
  });
  return res.json({ mensaje: 'Sesión cerrada correctamente.' });
});

export default AuthRouter;
