import { body } from 'express-validator';

export const validardatosUsuario = [
  body('identificacion')
    .trim()
    .notEmpty().withMessage('El número de identificación es obligatorio.')
    .isLength({ max: 13 }).withMessage('El número de identificación no puede superar 13 caracteres.'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 60 }).isLength({min: 3}).withMessage('El nombre no puede superar 60 caracteres ni ser menor a 3 caracaters.'),

  body('numero_telefonico')
    .trim()
    .notEmpty().withMessage('El número de teléfono es obligatorio.')
    .isLength({ max: 9 }).withMessage('El número de teléfono no puede superar 9 caracteres.'),

  body('direccion')
    .trim()
    .notEmpty().withMessage('La dirección es obligatoria.')
    .isLength({ max: 120 }).withMessage('La dirección no puede superar 120 caracteres.'),

  body('correo')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('El correo electrónico no tiene un formato válido.')
    .isLength({ max: 120 }).withMessage('El correo electrónico no puede superar 120 caracteres.'),

  body('rol')
    .optional()
    .isIn(['Administrador', 'Usuario']).withMessage('El rol debe ser Administrador o Usuario.'),
];
