import { Router } from 'express';
import pool from '../config/database.js';
import BookAdd from '../dtos/books.add.dto.js';
import GetBook from '../dtos/book.get.dto.js';
import { validardatosLibro, validarActualizarLibro, validarIdLibro } from '../validators/books.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const BooksRouter = Router();

// Consulta base con los datos legibles de cada libro.
const SQL_LIBROS = `
  SELECT b.book_id AS id, b.title, bc.category, e.editorial, a.author,
         b.publication_date, b.price, COALESCE(i.quantity, 0) AS quantity, b.activo
  FROM books b
  JOIN book_category bc ON bc.id = b.id_category
  LEFT JOIN editorials e ON e.id = b.id_editorial
  JOIN authors a ON a.id = b.id_author
  LEFT JOIN inventory i ON i.book_id = b.book_id`;

const obtenerOCrearId = async (conn, tabla, columna, valor) => {
  const [result] = await conn.execute(
    `INSERT INTO ${tabla} (${columna}) VALUES (?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [valor]
  );
  return result.insertId;
};

// Listar todos los libros.
BooksRouter.get('/', async (req, res, next) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const filtro = soloActivos ? 'WHERE b.activo = TRUE' : '';
    const [rows] = await pool.execute(`${SQL_LIBROS} ${filtro} ORDER BY b.book_id DESC`);

    const libros = rows.map((row) => new GetBook(row).data);
    return res.json(libros);
  } catch (error) {
    next(error);
  }
});

// Obtener libro por ID.
BooksRouter.get('/:id', validarIdLibro, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`${SQL_LIBROS} WHERE b.book_id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Libro no existente.' });
    }

    const libroDto = new GetBook(rows[0]);
    return res.json(libroDto.data);
  } catch (error) {
    next(error);
  }
});

// Registrar libro con su cantidad inicial en inventario (categoría, editorial y autor se crean si no existen).
BooksRouter.post('/', validardatosLibro, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const libroDto = new BookAdd(req.body);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const idCategoria = await obtenerOCrearId(conn, 'book_category', 'category', libroDto.categoria);
    const idEditorial = libroDto.editorial
      ? await obtenerOCrearId(conn, 'editorials', 'editorial', libroDto.editorial)
      : null;
    const idAutor = await obtenerOCrearId(conn, 'authors', 'author', libroDto.autor);

    const [libro] = await conn.execute(
      `INSERT INTO books (title, id_category, id_editorial, id_author, publication_date, price, activo)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [libroDto.titulo, idCategoria, idEditorial, idAutor, libroDto.fecha_p, libroDto.precio]
    );

    await conn.execute(
      `INSERT INTO inventory (book_id, quantity) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [libro.insertId, libroDto.cantidad]
    );

    await conn.commit();

    return res.status(201).json({
      id: libro.insertId,
      cantidad_registrada: libroDto.cantidad,
      mensaje: 'Libro y cantidad en inventario registrados correctamente.',
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Actualizar libro y su cantidad en inventario.
BooksRouter.put('/:id', validarActualizarLibro, validarResultados, async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    const titulo = req.body.titulo ?? req.body.title ?? null;
    const categoria = req.body.categoria ?? req.body.category ?? null;
    const editorial = req.body.editorial ?? null;
    const autor = req.body.autor ?? req.body.author ?? null;
    const fecha_p = req.body.fecha_de_publicacion ?? req.body.fecha_p ?? req.body.publication_date ?? null;
    const precio = req.body.precio ?? req.body.price ?? null;
    const cantidad = req.body.cantidad ?? req.body.quantity;
    const activo = req.body.activo;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    let idCategoria = req.body.id_category ?? null;
    if (categoria) {
      idCategoria = await obtenerOCrearId(conn, 'book_category', 'category', categoria);
    }

    let idEditorial = req.body.id_editorial ?? null;
    if (editorial) {
      idEditorial = await obtenerOCrearId(conn, 'editorials', 'editorial', editorial);
    }

    let idAutor = req.body.id_author ?? null;
    if (autor) {
      idAutor = await obtenerOCrearId(conn, 'authors', 'author', autor);
    }

    const [result] = await conn.execute(
      `UPDATE books
       SET title = IFNULL(?, title),
           id_category = IFNULL(?, id_category),
           id_editorial = IFNULL(?, id_editorial),
           id_author = IFNULL(?, id_author),
           publication_date = IFNULL(?, publication_date),
           price = IFNULL(?, price),
           activo = IFNULL(?, activo)
       WHERE book_id = ?`,
      [
        titulo,
        idCategoria,
        idEditorial,
        idAutor,
        fecha_p,
        precio !== null ? Number(precio) : null,
        activo !== undefined ? Boolean(activo) : null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Libro no existente.' });
    }

    if (cantidad !== undefined && cantidad !== null && cantidad !== '') {
      await conn.execute(
        `INSERT INTO inventory (book_id, quantity) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
        [id, Number(cantidad)]
      );
    }

    await conn.commit();
    return res.json({ mensaje: 'Libro actualizado correctamente.' });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

// Eliminar libro (desactivación lógica).
BooksRouter.delete('/:id', validarIdLibro, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('UPDATE books SET activo = FALSE WHERE book_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `El libro con id ${id} no existe.` });
    }
    return res.json({ mensaje: `Libro con id ${id} ha sido desactivado correctamente.` });
  } catch (error) {
    next(error);
  }
});

export default BooksRouter;
