import { body, param } from 'express-validator';

export const validarCrearPrestamo = [
  body('id_libro')
    .if((value, { req }) => req.body.book_id === undefined)
    .notEmpty().withMessage('El id del libro es obligatorio.')
    .isInt({ min: 1 }).withMessage('El id del libro debe ser un entero positivo.'),

  body('book_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El book_id debe ser un entero positivo.'),

  body('id_cliente')
    .if((value, { req }) => req.body.client_id === undefined)
    .notEmpty().withMessage('El id del cliente es obligatorio.')
    .isInt({ min: 1 }).withMessage('El id del cliente debe ser un entero positivo.'),

  body('client_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El client_id debe ser un entero positivo.'),

  body('fecha_devolucion_estimada')
    .if((value, { req }) => req.body.return_attempt === undefined)
    .notEmpty().withMessage('La fecha estimada de devolución es obligatoria.')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha estimada de devolución debe tener formato YYYY-MM-DD.'),

  body('return_attempt')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('El campo return_attempt debe tener formato YYYY-MM-DD.'),

  body(['fecha_prestamo', 'loan_date'])
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha de préstamo debe tener formato YYYY-MM-DD.')
];

export const validarActualizarPrestamo = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id del préstamo debe ser un entero positivo.'),

  body(['fecha_devolucion_estimada', 'return_attempt'])
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha estimada de devolución debe tener formato YYYY-MM-DD.'),

  body(['fecha_devolucion', 'return_date'])
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha de devolución debe tener formato YYYY-MM-DD.')
];

export const validarIdPrestamo = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id del préstamo debe ser un entero positivo.')
];
