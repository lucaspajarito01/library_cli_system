import { Router } from 'express';
import pool from '../config/database.js';
import SaleCreate from '../dtos/sale.create.dto.js';
import SaleGet from '../dtos/sale.get.dto.js';
import {
  validarCrearVenta,
  validarActualizarVenta,
  validarIdVenta,
} from '../validators/sales.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const SalesRouter = Router();

const SQL_VENTAS = `
  SELECT s.id, s.book_id, b.title AS book_title, b.price AS unit_price,
         s.client_id, c.name AS client_name,
         s.quantity, s.total, s.purchase_date
  FROM sales s
  JOIN books b ON b.book_id = s.book_id
  LEFT JOIN clients c ON c.id = s.client_id`;

// Listar todas las ventas
SalesRouter.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`${SQL_VENTAS} ORDER BY s.id DESC`);
    const ventas = rows.map((row) => new SaleGet(row).data);
    return res.json(ventas);
  } catch (error) {
    next(error);
  }
});

// Obtener una venta por ID
SalesRouter.get('/:id', validarIdVenta, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`${SQL_VENTAS} WHERE s.id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Venta no existente.' });
    }

    return res.json(new SaleGet(rows[0]).data);
  } catch (error) {
    next(error);
  }
});

// Registrar una venta y descontar automáticamente la cantidad del inventario
SalesRouter.post('/', validarCrearVenta, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const ventaDto = new SaleCreate(req.body);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [libros] = await conn.execute(
      `SELECT b.book_id, b.title, b.price, b.activo, COALESCE(i.quantity, 0) AS quantity
       FROM books b
       LEFT JOIN inventory i ON i.book_id = b.book_id
       WHERE b.book_id = ?
       FOR UPDATE`,
      [ventaDto.id_libro]
    );

    if (libros.length === 0 || !libros[0].activo) {
      await conn.rollback();
      return res.status(404).json({ error: 'El libro seleccionado no existe o está inactivo.' });
    }

    const libro = libros[0];
    const stockActual = Number(libro.quantity);

    if (stockActual < ventaDto.cantidad) {
      await conn.rollback();
      return res.status(400).json({
        error: `Stock insuficiente para "${libro.title}". Disponible: ${stockActual}, solicitado: ${ventaDto.cantidad}.`,
      });
    }

    if (ventaDto.id_cliente) {
      const [clientes] = await conn.execute('SELECT id FROM clients WHERE id = ?', [
        ventaDto.id_cliente,
      ]);
      if (clientes.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'El cliente especificado no existe.' });
      }
    }

    const totalCalculado = Number((Number(libro.price) * ventaDto.cantidad).toFixed(2));

    // Disminuir automáticamente la cantidad en inventario
    await conn.execute('UPDATE inventory SET quantity = quantity - ? WHERE book_id = ?', [
      ventaDto.cantidad,
      ventaDto.id_libro,
    ]);

    const [result] = await conn.execute(
      `INSERT INTO sales (book_id, client_id, quantity, total, purchase_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ventaDto.id_libro,
        ventaDto.id_cliente,
        ventaDto.cantidad,
        totalCalculado,
        ventaDto.fecha_compra,
      ]
    );

    await conn.commit();

    return res.status(201).json({
      id: result.insertId,
      total: totalCalculado,
      stock_restante: stockActual - ventaDto.cantidad,
      mensaje: 'Venta registrada correctamente y stock actualizado.',
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar una venta ajustando automáticamente la diferencia de inventario
SalesRouter.put('/:id', validarActualizarVenta, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [ventasActuales] = await conn.execute('SELECT * FROM sales WHERE id = ? FOR UPDATE', [
      id,
    ]);
    if (ventasActuales.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Venta no existente.' });
    }

    const ventaAnterior = ventasActuales[0];
    const nuevoBookId = Number(req.body.id_libro ?? req.body.book_id ?? ventaAnterior.book_id);
    const nuevaCantidad = Number(req.body.cantidad ?? req.body.quantity ?? ventaAnterior.quantity);
    const nuevoClientId =
      req.body.id_cliente !== undefined
        ? req.body.id_cliente || null
        : req.body.client_id !== undefined
        ? req.body.client_id || null
        : ventaAnterior.client_id;
    const nuevaFecha =
      req.body.fecha_compra ?? req.body.purchase_date ?? ventaAnterior.purchase_date;

    // Devolver temporalmente la cantidad anterior al inventario
    await conn.execute('UPDATE inventory SET quantity = quantity + ? WHERE book_id = ?', [
      ventaAnterior.quantity,
      ventaAnterior.book_id,
    ]);

    // Verificar disponibilidad para el libro y nueva cantidad
    const [libros] = await conn.execute(
      `SELECT b.book_id, b.title, b.price, COALESCE(i.quantity, 0) AS quantity
       FROM books b
       LEFT JOIN inventory i ON i.book_id = b.book_id
       WHERE b.book_id = ?
       FOR UPDATE`,
      [nuevoBookId]
    );

    if (libros.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'El libro seleccionado no existe.' });
    }

    if (Number(libros[0].quantity) < nuevaCantidad) {
      await conn.rollback();
      return res.status(400).json({
        error: `Stock insuficiente para actualizar la venta. Disponible: ${libros[0].quantity}.`,
      });
    }

    // Descontar la nueva cantidad
    await conn.execute('UPDATE inventory SET quantity = quantity - ? WHERE book_id = ?', [
      nuevaCantidad,
      nuevoBookId,
    ]);

    const nuevoTotal = Number((Number(libros[0].price) * nuevaCantidad).toFixed(2));

    await conn.execute(
      `UPDATE sales
       SET book_id = ?, client_id = ?, quantity = ?, total = ?, purchase_date = ?
       WHERE id = ?`,
      [nuevoBookId, nuevoClientId, nuevaCantidad, nuevoTotal, nuevaFecha, id]
    );

    await conn.commit();
    return res.json({
      total: nuevoTotal,
      mensaje: 'Venta actualizada y stock ajustado correctamente.',
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar venta y reintegrar su cantidad al inventario
SalesRouter.delete('/:id', validarIdVenta, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [ventas] = await conn.execute('SELECT * FROM sales WHERE id = ? FOR UPDATE', [id]);
    if (ventas.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `La venta con id ${id} no existe.` });
    }

    const venta = ventas[0];
    await conn.execute('UPDATE inventory SET quantity = quantity + ? WHERE book_id = ?', [
      venta.quantity,
      venta.book_id,
    ]);

    await conn.execute('DELETE FROM sales WHERE id = ?', [id]);
    await conn.commit();

    return res.json({ mensaje: 'Venta eliminada y ejemplares reintegrados al inventario.' });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

export default SalesRouter;
