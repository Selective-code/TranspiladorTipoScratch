/* ════════════════════════════════════════════════════════════════
   automata_pila.js  —  AutomataPila
   AP = (Q, Σ, Γ, δ, q0, Z0, F)

   Q  = { q0, q1, q2, q3 }
   Σ  = tokens producidos por AST.obtenerCinta()
   Γ  = { #, A, P, N, F, W, S }
   q0 = q0  |  Z0 = #  |  F = { q2 }

   Valida que la estructura sintáctica del programa sea correcta:
   · los bloques FOR/WHILE/SWITCH están correctamente cerrados
   · BREAK solo aparece dentro de FOR, WHILE o SWITCH
   · CASE solo aparece dentro de SWITCH
   · FUNC_DEF/ENDFUNC correctamente balanceados al nivel del archivo
   · el archivo abre con ARCHIVO, el programa con PROGRAMA/ENDPROGRAMA
════════════════════════════════════════════════════════════════ */

class AutomataPila {
  constructor() {
    this.pila         = [];
    this.cinta        = [];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }

  /* ── cargarCinta ────────────────────────────────────────────── */
  cargarCinta(tokens) {
    this.cinta        = [...tokens];
    this.pila         = ['#'];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }

  /* ── topePila ───────────────────────────────────────────────── */
  topePila() {
    return this.pila[this.pila.length - 1];
  }

  /* ── paso ───────────────────────────────────────────────────── */
  paso() {
    const token = this.cinta[this.cabezal];
    const tope  = this.topePila();

    /* Busca primero la transición específica (estado, token, tope),
       luego la general (estado, token, λ — tope comodín).          */
    const transicion =
      AutomataPila.DELTA[this.estadoActual]?.[token]?.[tope] ??
      AutomataPila.DELTA[this.estadoActual]?.[token]?.['λ'];

    if (!transicion) {
      this.ultimoError = this._mensajeError(token, tope);
      this.estadoActual = 'q3';
      return;
    }

    /* Aplicar operación de pila */
    if (transicion.op === 'push') {
      this.pila.push(transicion.simbolo);
    } else if (transicion.op === 'pop') {
      this.pila.pop();
    }
    /* no_op: no toca la pila */

    this.estadoActual = transicion.estado;
    this.cabezal++;

    /* Si la transición lleva a q3, generar el mensaje de error */
    if (this.estadoActual === 'q3') {
      this.ultimoError = this._mensajeError(token, tope);
    }
  }

  /* ── ejecutar ───────────────────────────────────────────────── */
  ejecutar() {
    while (this.estadoActual !== 'q2' && this.estadoActual !== 'q3') {
      if (this.cabezal >= this.cinta.length) {
        /* La cinta se agotó sin llegar a q2 */
        this.ultimoError =
          'Error: El programa está incompleto — falta cerrar bloques abiertos ' +
          `(pila: [${this.pila.join(', ')}])`;
        this.estadoActual = 'q3';
        break;
      }
      this.paso();
    }
    return this.estadoActual === 'q2';
  }

  /* ── obtenerError ───────────────────────────────────────────── */
  obtenerError() {
    return this.ultimoError;
  }

  /* ── reiniciar ──────────────────────────────────────────────── */
  reiniciar() {
    this.pila         = [];
    this.cinta        = [];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }

  /* ── _mensajeError (privado) ────────────────────────────────── */
  _mensajeError(token, tope) {
    if (this.estadoActual === 'q0') {
      return 'Error: El programa debe comenzar con el bloque ARCHIVO';
    }
    if (token === 'BREAK') {
      return 'Error: Se encontró BREAK fuera de un ciclo o switch';
    }
    if (token === 'CASE') {
      return 'Error: Se encontró CASE fuera de un bloque SWITCH';
    }
    if (token === 'FUNC_DEF') {
      return 'Error: No se puede definir una función dentro de otra función o del programa';
    }
    if (token === 'ENDFUNC') {
      return 'Error: ENDFUNC sin FUNC_DEF correspondiente o con bloques sin cerrar';
    }
    return `Error: Token inesperado '${token}' en contexto '${tope}'`;
  }
}

/* ════════════════════════════════════════════════════════════════
   TABLA DE TRANSICIONES  δ
   Estructura: DELTA[estado][token][tope] = { estado, op, simbolo? }
   tope 'λ' actúa como comodín (no importa el tope)
════════════════════════════════════════════════════════════════ */
AutomataPila.DELTA = {

  /* ── q0: estado inicial, espera ARCHIVO ── */
  q0: {
    ARCHIVO: {
      '#': { estado: 'q1', op: 'push', simbolo: 'A' }
    }
  },

  /* ── q1: dentro del archivo ── */
  q1: {

    /* FUNC_DEF: solo al nivel del archivo (tope A) */
    FUNC_DEF: {
      A: { estado: 'q1', op: 'push', simbolo: 'N' }
    },

    /* ENDFUNC: cierra función (tope debe ser N) */
    ENDFUNC: {
      N: { estado: 'q1', op: 'pop' }
    },

    /* PROGRAMA: empieza el main, solo al nivel del archivo (tope A) */
    PROGRAMA: {
      A: { estado: 'q1', op: 'push', simbolo: 'P' }
    },

    /* Apertura de bloques — empuja símbolo en la pila */
    FOR:    { λ: { estado: 'q1', op: 'push', simbolo: 'F' } },
    WHILE:  { λ: { estado: 'q1', op: 'push', simbolo: 'W' } },
    SWITCH: { λ: { estado: 'q1', op: 'push', simbolo: 'S' } },

    /* Cierre de bloques — pop si el tope coincide */
    ENDFOR:    { F: { estado: 'q1', op: 'pop' } },
    ENDWHILE:  { W: { estado: 'q1', op: 'pop' } },
    ENDSWITCH: { S: { estado: 'q1', op: 'pop' } },

    /* BREAK válido: dentro de FOR, WHILE o SWITCH */
    BREAK: {
      F: { estado: 'q1', op: 'no_op' },
      W: { estado: 'q1', op: 'no_op' },
      S: { estado: 'q1', op: 'no_op' },
      P: { estado: 'q3', op: 'no_op' },
      N: { estado: 'q3', op: 'no_op' }
    },

    /* CASE válido: solo dentro de SWITCH */
    CASE: {
      S: { estado: 'q1', op: 'no_op' },
      P: { estado: 'q3', op: 'no_op' },
      F: { estado: 'q3', op: 'no_op' },
      W: { estado: 'q3', op: 'no_op' },
      N: { estado: 'q3', op: 'no_op' }
    },

    /* Tokens simples — no importa el tope (λ) */
    IF:        { λ: { estado: 'q1', op: 'no_op' } },
    ENDIF:     { λ: { estado: 'q1', op: 'no_op' } },
    ELSE:      { λ: { estado: 'q1', op: 'no_op' } },
    DECL:        { λ: { estado: 'q1', op: 'no_op' } },
    ASSIGN:      { λ: { estado: 'q1', op: 'no_op' } },
    DECL_ASSIGN: { λ: { estado: 'q1', op: 'no_op' } },
    PRINT:        { λ: { estado: 'q1', op: 'no_op' } },
    PRINT_INLINE: { λ: { estado: 'q1', op: 'no_op' } },
    PRINT_TEXTO:  { λ: { estado: 'q1', op: 'no_op' } },
    READ:        { λ: { estado: 'q1', op: 'no_op' } },
    VEC_DECL:    { λ: { estado: 'q1', op: 'no_op' } },
    VEC_ASSIGN:  { λ: { estado: 'q1', op: 'no_op' } },
    MAT_DECL:    { λ: { estado: 'q1', op: 'no_op' } },
    MAT_ASSIGN:  { λ: { estado: 'q1', op: 'no_op' } },
    FUNC_CALL:   { λ: { estado: 'q1', op: 'no_op' } },
    RETURN:      { λ: { estado: 'q1', op: 'no_op' } },

    /* Fin del programa — solo si el tope es P */
    ENDPROGRAMA: {
      P: { estado: 'q2', op: 'pop' }
    }
  }

  /* q2 y q3 son estados de parada — no tienen transiciones salientes */
};


/* ════════════════════════════════════════════════════════════════
   BLOQUE DE PRUEBA
   Descomenta para verificar en la consola del navegador o Node.js

const ap = new AutomataPila();

// ── Caso 1: programa válido con FOR y BREAK ──
ap.cargarCinta(["PROGRAMA", "FOR", "BREAK", "ENDFOR", "ENDPROGRAMA"]);
console.log("Caso 1 (esperado true) :", ap.ejecutar());

// ── Caso 2: BREAK inválido fuera de ciclo ──
ap.cargarCinta(["PROGRAMA", "BREAK", "ENDPROGRAMA"]);
console.log("Caso 2 (esperado false):", ap.ejecutar());
console.log("  Error:", ap.obtenerError());
// "Error: Se encontró BREAK fuera de un ciclo o switch"

// ── Caso 3: CASE inválido fuera de SWITCH ──
ap.cargarCinta(["PROGRAMA", "FOR", "CASE", "ENDFOR", "ENDPROGRAMA"]);
console.log("Caso 3 (esperado false):", ap.ejecutar());
console.log("  Error:", ap.obtenerError());
// "Error: Se encontró CASE fuera de un bloque SWITCH"

// ── Caso 4: FOR sin cerrar ──
ap.cargarCinta(["PROGRAMA", "FOR", "DECL", "ENDPROGRAMA"]);
console.log("Caso 4 (esperado false):", ap.ejecutar());
console.log("  Error:", ap.obtenerError());
// "Error: Token inesperado 'ENDPROGRAMA' en contexto 'F'"

// ── Caso 5: programa complejo válido ──
ap.cargarCinta([
  "PROGRAMA",
    "DECL",
    "WHILE",
      "IF", "PRINT", "ENDIF",
      "SWITCH",
        "CASE", "ASSIGN",
        "CASE", "READ",
        "BREAK",
      "ENDSWITCH",
    "ENDWHILE",
  "ENDPROGRAMA"
]);
console.log("Caso 5 (esperado true) :", ap.ejecutar());

*/
