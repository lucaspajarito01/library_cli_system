import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'library_cli_system_secret_key_2026';
export const COOKIE_NAME = 'admin_token';

export const verificarAdmin = (req, res, next) => {
  try {
    const bearerHeader = req.headers.authorization;
    const tokenFromHeader =
      bearerHeader && bearerHeader.startsWith('Bearer ')
        ? bearerHeader.split(' ')[1]
        : null;

    const token = req.cookies?.[COOKIE_NAME] || tokenFromHeader;

    if (!token) {
      return res.status(401).json({
        error: 'No autenticado. Inicie sesión como Administrador.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.rol !== 'Administrador') {
      return res.status(403).json({
        error: 'Acceso denegado. Esta vista y operación es exclusiva para Administradores.',
      });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Sesión inválida o expirada. Por favor inicie sesión nuevamente.',
    });
  }
};

