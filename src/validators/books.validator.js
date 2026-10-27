import { body, param } from 'express-validator';

export const validardatosLibro = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio.')
    .isLength({ max: 40 }).withMessage('El título no puede superar 40 caracteres.'),

  body('categoria')
    .trim()
    .notEmpty().withMessage('La categoría es obligatoria.')
    .isLength({ max: 20 }).withMessage('La categoría no puede superar 20 caracteres.'),

  body('editorial')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 }).withMessage('La editorial no puede superar 30 caracteres.'),

  body('autor')
    .trim()
    .notEmpty().withMessage('El autor es obligatorio.')
    .isLength({ max: 60 }).withMessage('El autor no puede superar 60 caracteres.'),

  body('fecha_p')
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha de publicación debe tener formato YYYY-MM-DD.'),

  body('precio')
    .isFloat({ min: 0, max: 99999999.99 })
    .withMessage('El precio debe ser un número entre 0 y 99999999.99.'),

  body('cantidad')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La cantidad debe ser un entero mayor o igual a 0.')
];

export const validarIdLibro = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un entero positivo.')
];