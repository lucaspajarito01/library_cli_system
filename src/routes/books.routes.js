import { Router } from 'express';
import pool from '../config/database.js';
import BookAdd from '../dtos/books.add.dto.js';
import GetBook from '../dtos/book.get.dto.js'
import { validardatosLibro, validarIdLibro } from '../validators/books.validator.js';
import { validarResultados } from '../middlewares/validate.middleware.js';

const BooksRouter = Router();

// Consulta base con los datos legibles de cada libro.
const SQL_LIBROS = `
  SELECT b.book_id AS id, b.title, bc.category, e.editorial, a.author,
         b.publication_date, b.price, i.quantity, b.activo
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
    const [rows] = await pool.execute(`${SQL_LIBROS} ORDER BY b.book_id`);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No existen libros registrados.' });
    }

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

// Registrar libro (categoría, editorial y autor se crean si no existen).
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
      `INSERT INTO books (title, id_category, id_editorial, id_author, publication_date, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [libroDto.titulo, idCategoria, idEditorial, idAutor, libroDto.fecha_p, libroDto.precio]
    );

    await conn.execute(
      'INSERT INTO inventory (book_id, quantity) VALUES (?, ?)',
      [libro.insertId, libroDto.cantidad]
    );

    await conn.commit(); 

    return res.status(201).json({
      id: libro.insertId,
      mensaje: 'Libro registrado correctamente.',
    });
  } catch (error) {
    if (conn) await conn.rollback();
    next(error);
  } finally {
    if (conn) conn.release();
  }
});

//Actualizar libro.
BooksRouter.put('/:id', validardatosLibro, validarResultados, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {title,
           id_category,
           id_editorial,
           id_author,
           publication_date,
           price} = req.body;

    

    const [result] = await pool.execute(
      'UPDATE books SET title = IFNULL(?, title), id_category = IFNULL(?, id_category), id_editorial = IFNULL(?, id_editorial), id_author = IFNULL(?, id_author), publication_date = IFNULL(?, publication_date), price = IFNULL(?, price) WHERE book_id = ?',
      [title || null, id_category || null, id_editorial || null, id_author || null, publication_date || null, price || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Libro no existente.' });
    }

    return res.json({ mensaje: 'Libro actualizado correctamente.' });
  } catch (error) {
    next(error);
  }
});

export default BooksRouter;