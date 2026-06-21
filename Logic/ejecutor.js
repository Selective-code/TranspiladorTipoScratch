/* ════════════════════════════════════════════════════════════════
   ejecutor.js  —  Ejecutor
   Guarda el código C en disco, lo compila con gcc y lo ejecuta.
   Mantiene los archivos temporales disponibles para descarga
   hasta la siguiente ejecución.
════════════════════════════════════════════════════════════════ */

const fs                    = require('fs');
const { spawnSync }         = require('child_process');
const path                  = require('path');

const ES_WINDOWS = process.platform === 'win32';

class Ejecutor {
  constructor() {
    this.rutaC       = path.join(__dirname, '..', 'temp.c');
    this.rutaBinario = path.join(__dirname, '..', ES_WINDOWS ? 'temp.exe' : 'temp');
    this.stdout      = '';
    this.stderr      = '';
  }

  /* ── guardarArchivo ─────────────────────────────────────────── */
  guardarArchivo(codigo) {
    fs.writeFileSync(this.rutaC, codigo, 'utf8');
  }

  /* ── compilar ───────────────────────────────────────────────── */
  compilar() {
    try { fs.unlinkSync(this.rutaBinario); } catch (_) {}

    /* cc1.exe y los linkers de MinGW64 necesitan su propio bin en PATH
       para resolver DLLs internas.  Node no hereda ese segmento de
       la instalación de MSYS2, así que lo inyectamos explícitamente. */
    const envGcc = {
      ...process.env,
      PATH: `C:\\msys64\\mingw64\\bin;C:\\msys64\\usr\\bin;${process.env.PATH}`
    };

    const resultado = spawnSync(
      'gcc',
      [this.rutaC, '-o', this.rutaBinario],
      { encoding: 'utf8', stdio: 'pipe', timeout: 15000, env: envGcc }
    );

    if (resultado.error) {
      this.stderr = resultado.error.code === 'ENOENT'
        ? 'gcc no encontrado — instala MinGW y agrégalo al PATH'
        : resultado.error.message;
      return false;
    }

    if (resultado.status !== 0) {
      this.stderr =
        resultado.stdout?.trim() ||
        resultado.stderr?.trim() ||
        `gcc salió con código ${resultado.status}`;
      return false;
    }

    this.stderr = '';
    return true;
  }

  /* ── ejecutar ───────────────────────────────────────────────── */
  ejecutar() {
    const envRun = {
      ...process.env,
      PATH: `C:\\msys64\\mingw64\\bin;C:\\msys64\\usr\\bin;${process.env.PATH}`
    };
    const resultado = spawnSync(
      this.rutaBinario,
      [],
      { encoding: 'utf8', stdio: 'pipe', timeout: 5000, env: envRun }
    );

    if (resultado.error?.code === 'ETIMEDOUT') {
      this.stderr = 'Error: La ejecución superó los 5 segundos (posible bucle infinito).';
      this.stdout = '';
      return '';
    }

    if (resultado.error) {
      this.stderr = resultado.error.message;
      this.stdout = '';
      return '';
    }

    this.stdout = resultado.stdout ?? '';
    this.stderr = resultado.stderr?.trim() ?? '';
    return this.stdout;
  }

  /* ── obtenerErrores ─────────────────────────────────────────── */
  obtenerErrores() {
    return this.stderr;
  }

  /* ── limpiar ────────────────────────────────────────────────── */
  limpiar() {
    for (const ruta of [this.rutaC, this.rutaBinario]) {
      try { fs.unlinkSync(ruta); } catch (_) { /* no existe, ignorar */ }
    }
  }

  /* ── compilarYEjecutar ──────────────────────────────────────── */
  compilarYEjecutar(codigo) {
    try {
      this.guardarArchivo(codigo);

      if (!this.compilar()) {
        return { output: '', error: this.stderr };
      }

      const output = this.ejecutar();

      if (this.stderr) {
        return { output, error: this.stderr };
      }

      return { output, error: '' };

    } catch (err) {
      return { output: '', error: err.message };
    }
    /* No llamamos limpiar() — los archivos quedan disponibles para descarga */
  }
}

module.exports = Ejecutor;
