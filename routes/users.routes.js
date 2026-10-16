import { Router } from 'express';
import pool from '../config/database.js';
import { validarRegistroUsuario } from '../validators/users.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const UsersRouter = Router();

UsersRouter.post('/', validarRegistroUsuario, validarResultados, async (req, res, next) => {
  try {
    const { identification_number, name, phone_number, address, email } = req.body;

    // El registro público siempre crea usuarios con rol 'Usuario'.
    const role = 'Usuario';

    const [result] = await pool.execute(
      'INSERT INTO clients (identification_number, name, phone_number, address, email, role) VALUES (?, ?, ?, ?, ?, ?)',
      [identification_number, name, phone_number, address, email, role]
    );

    return res.status(201).json({
      id: result.insertId,
      mensaje: 'Usuario registrado correctamente',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'El correo electrónico o número de identificación ya está registrado.',
      });
    }
    next(error);
  }
});

export default UsersRouter;