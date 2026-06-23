/* ════════════════════════════════════════════════════════════════
   servidor.js  —  Servidor Express
   · Sirve la UI (HTML/CSS/JS) en /
   · Sirve Logic/ en /Logic/
   · POST /ejecutar   → compila y ejecuta código C
   · GET  /descargar/c   → descarga temp.c como programa.c
   · GET  /descargar/exe → descarga el binario como programa.exe
════════════════════════════════════════════════════════════════ */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const Ejecutor = require('./Logic/ejecutor');

const app      = express();
const PORT = process.env.PORT || 3000;
const ejecutor = new Ejecutor();

/* ── Middleware ──────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* Sirve UI/ como raíz del sitio */
app.use('/',       express.static(path.join(__dirname, 'UI')));

/* Sirve Logic/ para que el navegador cargue ast.js, etc. */
app.use('/Logic/', express.static(path.join(__dirname, 'Logic')));

/* ── POST /ejecutar ──────────────────────────────────────────── */
app.post('/ejecutar', async (req, res) => {
  const { codigo, stdin = '' } = req.body;

  if (!codigo || typeof codigo !== 'string') {
    return res.status(400).json({ output: '', error: 'No se recibió código C.' });
  }

  const resultado = ejecutor.compilarYEjecutar(codigo, stdin);
  res.json(resultado);
});

/* ── GET /descargar/c ────────────────────────────────────────── */
app.get('/descargar/c', (req, res) => {
  if (!fs.existsSync(ejecutor.rutaC)) {
    return res.status(404).json({ error: 'No hay archivo .c disponible. Ejecuta el programa primero.' });
  }
  res.download(ejecutor.rutaC, 'programa.c');
});

/* ── GET /descargar/exe ──────────────────────────────────────── */
app.get('/descargar/exe', (req, res) => {
  if (!fs.existsSync(ejecutor.rutaBinario)) {
    return res.status(404).json({ error: 'No hay binario disponible. Ejecuta el programa primero.' });
  }
  res.download(ejecutor.rutaBinario, 'programa.exe');
});

/* ── Arranque ────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
