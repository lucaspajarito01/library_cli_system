import { Router } from 'express';
import pool from '../config/database.js';
import {  validardatosUsuario } from '../validators/users.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const UsersRouter = Router();
// Listar todos los usuarios.
UsersRouter.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clients');

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No existen clientes registrados.' });
    }

    return res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Obtener usuario por medio de ID.
UsersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no existente.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// Registrar cliente.
UsersRouter.post('/', validardatosUsuario, validarResultados, async (req, res, next) => {
  try {
    const { identification_number, name, phone_number, address, email } = req.body;

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

//Actualizar cliente.
UsersRouter.put('/:id', validardatosUsuario, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { identification_number, name, phone_number, address, email, role } = req.body;

    const [result] = await pool.execute(
      'UPDATE clients SET identification_number = IFNULL(?, identification_number), name = IFNULL(?, name), phone_number = IFNULL(?, phone_number), address = IFNULL(?, address), email = IFNULL(?, email), role = IFNULL(?, role) WHERE id = ?',
      [identification_number || null, name || null, phone_number || null, address || null, email || null, role || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no existente.' });
    }

    return res.json({ mensaje: 'Usuario actualizado correctamente.' });
  } catch (error) {
    next(error);
  }
});

// Eliminar Usuario.
UsersRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM clients WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `El usuario con id: ${id}, no existe.` });
    }

    return res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
});

export default UsersRouter;