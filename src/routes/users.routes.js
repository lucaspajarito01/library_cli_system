import { Router } from 'express';
import pool from '../config/database.js';
import UserCreate from '../dtos/user.create.dto.js';
import UserGet from '../dtos/user.get.dto.js';
import { validardatosUsuario } from '../validators/users.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const UsersRouter = Router();

// Listar todos los usuarios.
UsersRouter.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clients ORDER BY id DESC');
    const usuarios = rows.map((row) => new UserGet(row).data);
    return res.json(usuarios);
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
    const usuario = new UserGet(rows[0]);
    res.json(usuario.data);
  } catch (error) {
    next(error);
  }
});

// Registrar cliente.
UsersRouter.post('/', validardatosUsuario, validarResultados, async (req, res, next) => {
  try {
    const usuario = new UserCreate({ ...req.body });
    const [result] = await pool.execute(
      'INSERT INTO clients (identification_number, name, phone_number, address, email, role) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario.identificacion, usuario.nombre, usuario.numero_telefonico, usuario.direccion, usuario.correo, usuario.rol]
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

// Actualizar cliente.
UsersRouter.put('/:id', validardatosUsuario, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const identification_number = req.body.identificacion ?? req.body.identification_number ?? null;
    const name = req.body.nombre ?? req.body.name ?? null;
    const phone_number = req.body.numero_telefonico ?? req.body.phone_number ?? null;
    const address = req.body.direccion ?? req.body.address ?? null;
    const email = req.body.correo ?? req.body.email ?? null;
    const role = req.body.rol ?? req.body.role ?? null;

    const [result] = await pool.execute(
      `UPDATE clients
       SET identification_number = IFNULL(?, identification_number),
           name = IFNULL(?, name),
           phone_number = IFNULL(?, phone_number),
           address = IFNULL(?, address),
           email = IFNULL(?, email),
           role = IFNULL(?, role)
       WHERE id = ?`,
      [identification_number, name, phone_number, address, email, role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no existente.' });
    }

    return res.json({ mensaje: 'Usuario actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'El correo electrónico o número de identificación ya está registrado.',
      });
    }
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
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        error: 'No se puede eliminar el usuario porque tiene préstamos o ventas asociadas.',
      });
    }
    next(error);
  }
});

export default UsersRouter;
