import { validationResult } from 'express-validator';

export const validarResultados = (req, res, next) => {
  const errores = validationResult(req);

  if (errores.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Datos inválidos.',
    detalles: errores.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
  });
};