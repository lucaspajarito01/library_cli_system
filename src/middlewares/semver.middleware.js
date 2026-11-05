import semver from 'semver';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export const APP_VERSION = semver.clean(pkg.version) || '1.0.0';

export const semverMiddleware = (req, res, next) => {
  res.setHeader('X-API-Version', APP_VERSION);

  const requestedVersion = req.headers['x-api-version'] || req.headers['accept-version'];
  if (requestedVersion) {
    if (!semver.validRange(requestedVersion)) {
      return res.status(400).json({
        error: `El formato de versión solicitado "${requestedVersion}" no cumple con SemVer.`,
        version_actual: APP_VERSION,
      });
    }

    if (!semver.satisfies(APP_VERSION, requestedVersion)) {
      return res.status(426).json({
        error: `La versión solicitada (${requestedVersion}) no es compatible con la versión actual del servidor (${APP_VERSION}).`,
        version_actual: APP_VERSION,
      });
    }
  }

  next();
};

export const obtenerInfoVersion = (req, res) => {
  const parsed = semver.parse(APP_VERSION);
  return res.json({
    nombre: pkg.name,
    version: APP_VERSION,
    semver_valido: Boolean(semver.valid(APP_VERSION)),
    major: parsed?.major ?? 1,
    minor: parsed?.minor ?? 0,
    patch: parsed?.patch ?? 0,
  });
};
