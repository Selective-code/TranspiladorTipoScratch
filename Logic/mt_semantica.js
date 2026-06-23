/* ════════════════════════════════════════════════════════════════
   mt_semantica.js  —  MTSemantica
   MT de dos cintas para análisis semántico de variables.

   Cinta 1 (entrada) : tokens con parámetros — misma que MTTransductora
   Cinta 2 (símbolos): pila de scopes, cada scope es un Set de nombres

   Q  = { q0, q1, q_accept, q_error }
   q0 = q0  |  F = { q_accept }

   Verifica:
     · Toda variable usada fue declarada en el scope actual o en uno padre
     · Ninguna variable se declara dos veces en el mismo scope
════════════════════════════════════════════════════════════════ */

class MTSemantica {
  constructor() {
    this.cintaEntrada  = [];        /* cinta 1 */
    this.cintaSimbolos = [];        /* cinta 2 — pila de Sets */
    this.funciones     = new Set(); /* funciones declaradas */
    this.cabezal       = 0;
    this.estadoActual  = 'q0';
    this.ultimoError   = '';
  }

  /* ── cargarCinta ────────────────────────────────────────────── */
  cargarCinta(tokens) {
    this.cintaEntrada  = [...tokens];
    this.cintaSimbolos = [new Set()]; /* scope global */
    this.funciones     = new Set();
    this.cabezal       = 0;
    this.estadoActual  = 'q0';
    this.ultimoError   = '';
  }

  /* ── Operaciones sobre cinta 2 ──────────────────────────────── */

  _abrirScope() {
    this.cintaSimbolos.push(new Set());
  }

  _cerrarScope() {
    if (this.cintaSimbolos.length > 1) this.cintaSimbolos.pop();
  }

  _scopeActual() {
    return this.cintaSimbolos[this.cintaSimbolos.length - 1];
  }

  /* Escribe una variable en el scope actual (cinta 2) */
  _declarar(nombre) {
    if (this._scopeActual().has(nombre)) {
      this.ultimoError  = `Error semántico: '${nombre}' ya fue declarada en este scope`;
      this.estadoActual = 'q_error';
      return false;
    }
    this._scopeActual().add(nombre);
    return true;
  }

  /* Busca una variable en cinta 2 desde el scope actual hacia arriba */
  _verificar(nombre) {
    for (let i = this.cintaSimbolos.length - 1; i >= 0; i--) {
      if (this.cintaSimbolos[i].has(nombre)) return true;
    }
    this.ultimoError  = `Error semántico: '${nombre}' usada sin declarar`;
    this.estadoActual = 'q_error';
    return false;
  }

  /* ── paso ───────────────────────────────────────────────────── */
  paso() {
    const tokenCompleto = this.cintaEntrada[this.cabezal];
    const partes        = tokenCompleto.split(':');
    const tipo          = partes[0];

    if (this.estadoActual === 'q0') {
      if (tipo === 'ARCHIVO') {
        this.estadoActual = 'q1';
      } else {
        this.ultimoError  = `Error: se esperaba ARCHIVO, se encontró '${tipo}'`;
        this.estadoActual = 'q_error';
        return;
      }
      this.cabezal++;
      return;
    }

    /* ── q1: procesa cuerpo del programa ── */
    switch (tipo) {

      /* ── Tokens de nivel archivo ── */
      case 'PROGRAMA':
        /* entrada al main — no requiere acción semántica */
        break;

      case 'ENDPROGRAMA':
        this.estadoActual = 'q_accept';
        break;

      /* ── Definición de función ── */
      case 'FUNC_DEF': {
        /* FUNC_DEF:nombre:tipoRetorno:numParams:tipo1:nom1:tipo2:nom2:tipo3:nom3 */
        const nombre    = partes[1];
        const numParams = parseInt(partes[3], 10) || 0;
        this.funciones.add(nombre);
        this._abrirScope();
        for (let i = 0; i < numParams; i++) {
          const nomParam = partes[5 + i * 2]; /* nom1 @ index 5, nom2 @ 7, nom3 @ 9 */
          if (nomParam && !this._declarar(nomParam)) return;
        }
        break;
      }

      case 'ENDFUNC':
        this._cerrarScope();
        break;

      /* ── Llamada a función ── */
      case 'FUNC_CALL': {
        /* FUNC_CALL:nombre:numArgs:arg1:arg2:arg3 */
        const fnNombre = partes[1];
        if (!this.funciones.has(fnNombre)) {
          this.ultimoError  = `Error semántico: función '${fnNombre}' usada sin declarar`;
          this.estadoActual = 'q_error';
          return;
        }
        break;
      }

      /* ── Return ── */
      case 'RETURN':
        break;

      /* ── Declaraciones → escribir en cinta 2 ── */
      case 'DECL':         /* DECL:tipoDato:variable */
        if (!this._declarar(partes[2])) return;
        break;

      case 'DECL_ASSIGN':  /* DECL_ASSIGN:tipoDato:variable:valor */
        if (!this._declarar(partes[2])) return;
        break;

      case 'VEC_DECL':     /* VEC_DECL:tipoDato:nombre:tamanio */
        if (!this._declarar(partes[2])) return;
        break;

      case 'MAT_DECL':     /* MAT_DECL:tipoDato:nombre:filas:columnas */
        if (!this._declarar(partes[2])) return;
        break;

      /* ── FOR: abre scope y declara su variable de iteración ── */
      case 'FOR':          /* FOR:variable:inicio:fin:incremento */
        this._abrirScope();
        if (!this._declarar(partes[1])) return;
        break;

      /* ── Estructuras que abren scope sin declarar variables ── */
      case 'WHILE':        /* WHILE:condicion */
        this._abrirScope();
        break;

      case 'IF':           /* IF:condicion */
        this._abrirScope();
        break;

      /* ── SWITCH: verifica la variable y abre scope ── */
      case 'SWITCH':       /* SWITCH:variable */
        if (!this._verificar(partes[1])) return;
        this._abrirScope();
        break;

      /* ── ELSE: cierra scope de rama if, abre scope de rama else ── */
      case 'ELSE':
        this._cerrarScope();
        this._abrirScope();
        break;

      /* ── Cierres de scope ── */
      case 'ENDFOR':
      case 'ENDWHILE':
      case 'ENDIF':
      case 'ENDSWITCH':
        this._cerrarScope();
        break;

      /* ── Usos de variables → verificar en cinta 2 ── */
      case 'ASSIGN':       /* ASSIGN:variable:valor */
        if (!this._verificar(partes[1])) return;
        break;

      case 'PRINT':        /* PRINT:variable:tipoDato */
        if (!this._verificar(partes[1])) return;
        break;

      case 'READ':         /* READ:variable:tipoDato */
        if (!this._verificar(partes[1])) return;
        break;

      case 'VEC_ASSIGN':   /* VEC_ASSIGN:nombre:indice:valor */
        if (!this._verificar(partes[1])) return;
        break;

      case 'MAT_ASSIGN':   /* MAT_ASSIGN:nombre:fila:columna:valor */
        if (!this._verificar(partes[1])) return;
        break;

      /* ── Tokens que no involucran variables ── */
      case 'BREAK':
      case 'CASE':
        break;

      default:
        this.ultimoError  = `Error: token desconocido '${tipo}'`;
        this.estadoActual = 'q_error';
        return;
    }

    this.cabezal++;
  }

  /* ── ejecutar ───────────────────────────────────────────────── */
  ejecutar() {
    while (
      this.estadoActual !== 'q_accept' &&
      this.estadoActual !== 'q_error'
    ) {
      if (this.cabezal >= this.cintaEntrada.length) {
        this.ultimoError  = 'Error: la cinta terminó sin llegar a ENDPROGRAMA';
        this.estadoActual = 'q_error';
        break;
      }
      this.paso();
    }
    return this.estadoActual === 'q_accept';
  }

  /* ── obtenerError ───────────────────────────────────────────── */
  obtenerError() {
    return this.ultimoError;
  }
}
