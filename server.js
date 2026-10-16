import 'dotenv/config';
import express from 'express';
import usersRouter from './src/routes/users.routes.js';

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'El cuerpo de la petición no es un JSON válido.',
    });
  }

  console.error('Error interno:', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
