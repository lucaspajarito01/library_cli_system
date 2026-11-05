import { body, param } from 'express-validator';

export const validarCrearVenta = [
  body('id_libro')
    .if((value, { req }) => req.body.book_id === undefined)
    .notEmpty().withMessage('El id del libro es obligatorio.')
    .isInt({ min: 1 }).withMessage('El id del libro debe ser un entero positivo.'),

  body('book_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El book_id debe ser un entero positivo.'),

  body('cantidad')
    .if((value, { req }) => req.body.quantity === undefined)
    .notEmpty().withMessage('La cantidad es obligatoria.')
    .isInt({ min: 1 }).withMessage('La cantidad a vender debe ser al menos 1.'),

  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad a vender debe ser al menos 1.'),

  body(['id_cliente', 'client_id'])
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('El id del cliente debe ser un entero positivo.'),

  body(['fecha_compra', 'purchase_date'])
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha de compra debe tener formato YYYY-MM-DD.')
];

export const validarActualizarVenta = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id de la venta debe ser un entero positivo.'),

  body(['id_libro', 'book_id'])
    .optional()
    .isInt({ min: 1 }).withMessage('El id del libro debe ser un entero positivo.'),

  body(['cantidad', 'quantity'])
    .optional()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor o igual a 1.'),

  body(['id_cliente', 'client_id'])
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('El id del cliente debe ser un entero positivo.'),

  body(['fecha_compra', 'purchase_date'])
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha de compra debe tener formato YYYY-MM-DD.')
];

export const validarIdVenta = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id de la venta debe ser un entero positivo.')
];

