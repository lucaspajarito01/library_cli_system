import { Router } from 'express';
import pool from '../config/database.js';
import LoanCreate from '../dtos/loan.create.dto.js';
import LoanGet from '../dtos/loan.get.dto.js';
import {
  validarCrearPrestamo,
  validarActualizarPrestamo,
  validarIdPrestamo,
} from '../validators/loans.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const LoansRouter = Router();

const SQL_PRESTAMOS = `
  SELECT l.id, l.book_id, b.title AS book_title,
         l.client_id, c.name AS client_name, c.identification_number AS client_identification,
         l.loan_date, l.return_attempt, l.return_date
  FROM loans l
  JOIN books b ON b.book_id = l.book_id
  JOIN clients c ON c.id = l.client_id`;

// Listar todos los préstamos
LoansRouter.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`${SQL_PRESTAMOS} ORDER BY l.id DESC`);
    const prestamos = rows.map((row) => new LoanGet(row).data);
    return res.json(prestamos);
  } catch (error) {
    next(error);
  }
});

// Obtener un préstamo por ID
LoansRouter.get('/:id', validarIdPrestamo, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`${SQL_PRESTAMOS} WHERE l.id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no existente.' });
    }

    return res.json(new LoanGet(rows[0]).data);
  } catch (error) {
    next(error);
  }
});

// Registrar un préstamo y disminuir automáticamente la cantidad del libro en inventario
LoansRouter.post('/', validarCrearPrestamo, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const prestamoDto = new LoanCreate(req.body);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verificar existencia y stock del libro
    const [libros] = await conn.execute(
      `SELECT b.book_id, b.title, b.activo, COALESCE(i.quantity, 0) AS quantity
       FROM books b
       LEFT JOIN inventory i ON i.book_id = b.book_id
       WHERE b.book_id = ?
       FOR UPDATE`,
      [prestamoDto.id_libro]
    );

    if (libros.length === 0 || !libros[0].activo) {
      await conn.rollback();
      return res.status(404).json({ error: 'El libro seleccionado no existe o está inactivo.' });
    }

    const stockActual = Number(libros[0].quantity);
    if (stockActual < 1) {
      await conn.rollback();
      return res.status(400).json({
        error: `No hay ejemplares disponibles en inventario para el libro "${libros[0].title}".`,
      });
    }

    // Verificar existencia del cliente
    const [clientes] = await conn.execute('SELECT id FROM clients WHERE id = ?', [
      prestamoDto.id_cliente,
    ]);
    if (clientes.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'El cliente especificado no existe.' });
    }

    // Disminuir en 1 el inventario del libro
    await conn.execute('UPDATE inventory SET quantity = quantity - 1 WHERE book_id = ?', [
      prestamoDto.id_libro,
    ]);

    // Registrar el préstamo
    const [result] = await conn.execute(
      `INSERT INTO loans (book_id, loan_date, return_attempt, return_date, client_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        prestamoDto.id_libro,
        prestamoDto.fecha_prestamo,
        prestamoDto.fecha_devolucion_estimada,
        prestamoDto.fecha_devolucion,
        prestamoDto.id_cliente,
      ]
    );

    // Si se registró ya devuelto en el mismo acto, reponer stock
    let stockRestante = stockActual - 1;
    if (prestamoDto.fecha_devolucion) {
      await conn.execute('UPDATE inventory SET quantity = quantity + 1 WHERE book_id = ?', [
        prestamoDto.id_libro,
      ]);
      stockRestante = stockActual;
    }

    await conn.commit();

    return res.status(201).json({
      id: result.insertId,
      stock_restante: stockRestante,
      mensaje: 'Préstamo registrado correctamente y stock actualizado.',
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar préstamo o registrar devolución (repone automáticamente el libro al inventario)
LoansRouter.put('/:id', validarActualizarPrestamo, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    const nuevaFechaEstimada =
      req.body.fecha_devolucion_estimada ?? req.body.return_attempt ?? null;
    const nuevaFechaDevolucion =
      req.body.fecha_devolucion !== undefined
        ? req.body.fecha_devolucion
        : req.body.return_date !== undefined
        ? req.body.return_date
        : undefined;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [prestamos] = await conn.execute(
      'SELECT * FROM loans WHERE id = ? FOR UPDATE',
      [id]
    );

    if (prestamos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Préstamo no existente.' });
    }

    const prestamoActual = prestamos[0];
    const estabaDevuelto = Boolean(prestamoActual.return_date);
    const fechaDevolucionFinal =
      nuevaFechaDevolucion !== undefined ? nuevaFechaDevolucion : prestamoActual.return_date;
    const ahoraDevuelto = Boolean(fechaDevolucionFinal);

    await conn.execute(
      `UPDATE loans
       SET return_attempt = IFNULL(?, return_attempt),
           return_date = ?
       WHERE id = ?`,
      [nuevaFechaEstimada, fechaDevolucionFinal || null, id]
    );

    // Si pasa de Prestado -> Devuelto, aumentar +1 en inventario
    if (!estabaDevuelto && ahoraDevuelto) {
      await conn.execute('UPDATE inventory SET quantity = quantity + 1 WHERE book_id = ?', [
        prestamoActual.book_id,
      ]);
    } else if (estabaDevuelto && !ahoraDevuelto) {
      // Si se revierte la devolución, verificar stock y descontar 1
      const [inv] = await conn.execute(
        'SELECT quantity FROM inventory WHERE book_id = ? FOR UPDATE',
        [prestamoActual.book_id]
      );
      if (!inv.length || inv[0].quantity < 1) {
        await conn.rollback();
        return res.status(400).json({ error: 'No hay stock suficiente para reactivar el préstamo.' });
      }
      await conn.execute('UPDATE inventory SET quantity = quantity - 1 WHERE book_id = ?', [
        prestamoActual.book_id,
      ]);
    }

    await conn.commit();
    return res.json({ mensaje: 'Préstamo actualizado correctamente.' });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar préstamo (si estaba activo sin devolver, repone el ejemplar al inventario)
LoansRouter.delete('/:id', validarIdPrestamo, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [prestamos] = await conn.execute('SELECT * FROM loans WHERE id = ? FOR UPDATE', [id]);
    if (prestamos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `El préstamo con id ${id} no existe.` });
    }

    const prestamo = prestamos[0];
    if (!prestamo.return_date) {
      await conn.execute('UPDATE inventory SET quantity = quantity + 1 WHERE book_id = ?', [
        prestamo.book_id,
      ]);
    }

    await conn.execute('DELETE FROM loans WHERE id = ?', [id]);
    await conn.commit();

    return res.json({ mensaje: 'Préstamo eliminado correctamente.' });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

export default LoansRouter;

