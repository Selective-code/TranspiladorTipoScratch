/* ════════════════════════════════════════════════════════════════
   ast.js  —  NodoAST y AST
   Parte del compilador visual tipo Scratch → C.

   Responsabilidades:
     · Representar el programa como un árbol de nodos (NodoAST)
     · Construir ese árbol desde el JSON que produce UIBloques
     · Linearizar el árbol en una cinta de tokens para la MT
════════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════
   CLASE NodoAST
════════════════════════════════════════════════════════════════ */

class NodoAST {
  /**
   * @param {string} tipo        - Tipo semántico del nodo ('decl', 'for', 'if', …)
   * @param {object} parametros  - Campos del bloque { variable, tipoDato, … }
   * @param {NodoAST[]} hijos    - Nodos anidados (cuerpo de ciclos, ramas, etc.)
   */
  constructor(tipo, parametros = {}, hijos = []) {
    this.tipo       = tipo;
    this.parametros = parametros;
    this.hijos      = hijos;
  }

  /* Añade un NodoAST al final de la lista de hijos */
  agregarHijo(nodo) {
    this.hijos.push(nodo);
  }

  /* Retorna true si el nodo tiene al menos un hijo */
  tieneHijos() {
    return this.hijos.length > 0;
  }

  /* Retorna el valor de un parámetro por clave */
  obtenerParam(clave) {
    return this.parametros[clave];
  }
}


/* ════════════════════════════════════════════════════════════════
   CLASE AST
════════════════════════════════════════════════════════════════ */

class AST {
  constructor() {
    this.raiz = null; // NodoAST de tipo "programa"
  }

  /* ── construirDesdeUI ──────────────────────────────────────────
     Recibe el array JSON de UIBloques.exportarBloques() y
     construye el árbol completo de NodoAST.
     La raíz es siempre un nodo "programa" cuyos hijos directos
     son los bloques del nivel superior del workspace.
  ────────────────────────────────────────────────────────────── */
  construirDesdeUI(datos) {
    /* datos puede ser { funciones, hijos } (nuevo) o un array legacy */
    const funciones = Array.isArray(datos) ? [] : (datos.funciones ?? []);
    const hijos     = Array.isArray(datos) ? datos : (datos.hijos ?? []);

    const nodoPrograma = new NodoAST('programa', {}, hijos.map(b => this._jsonANodo(b)));
    const nodoArchivo  = new NodoAST('archivo', {}, [
      ...funciones.map(b => this._jsonANodo(b)),
      nodoPrograma
    ]);
    this.raiz = nodoArchivo;
    return this;
  }

  /* ── _jsonANodo ────────────────────────────────────────────────
     Convierte recursivamente un objeto JSON plano
     { tipo, parametros, hijos } en un NodoAST real.
     Los hijos del JSON se convierten primero y se pasan
     al constructor del nodo padre.
  ────────────────────────────────────────────────────────────── */
  _jsonANodo(bloqueJSON) {
    const hijosConvertidos = (bloqueJSON.hijos ?? []).map(h => this._jsonANodo(h));
    const nodo = new NodoAST(
      bloqueJSON.tipo,
      { ...bloqueJSON.parametros },
      hijosConvertidos
    );
    /* ifElse necesita indiceElse fuera de parametros para que
       _nodoATokens pueda separar las dos ramas */
    if (bloqueJSON.indiceElse !== undefined) {
      nodo.indiceElse = bloqueJSON.indiceElse;
    }
    return nodo;
  }

  /* ── obtenerCinta ──────────────────────────────────────────────
     Recorre el árbol en DFS preorder y devuelve un array de
     tokens String que la MaquinaTuring consumirá.
     Alfabeto: DECL, ASSIGN, DECL_ASSIGN, PRINT, READ,
               VEC_DECL, VEC_ASSIGN, MAT_DECL, MAT_ASSIGN,
               FOR, ENDFOR, WHILE, ENDWHILE,
               IF, ELSE, ENDIF,
               SWITCH, ENDSWITCH, CASE, BREAK
  ────────────────────────────────────────────────────────────── */
  obtenerCinta() {
    if (!this.raiz) return [];
    const cinta = [];
    this._nodoATokens(this.raiz, cinta);
    return cinta;
  }

  /* ── _nodoATokens ──────────────────────────────────────────────
     DFS preorder recursivo.
     Emite tokens ANTES de entrar a los hijos (apertura)
     y tokens DESPUÉS cuando el nodo tiene un bloque de cierre.
  ────────────────────────────────────────────────────────────── */
  _nodoATokens(nodo, cinta) {
    switch (nodo.tipo) {

      /* ── Nodo archivo: envuelve funciones + programa ── */
      case 'archivo':
        cinta.push('ARCHIVO');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        break;

      /* ── Nodo función definida ── */
      case 'funcDef':
        cinta.push('FUNC_DEF');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDFUNC');
        break;

      /* ── Llamada a función ── */
      case 'funcCall':
        cinta.push('FUNC_CALL');
        break;

      /* ── Return ── */
      case 'return':
        cinta.push('RETURN');
        break;

      /* ── Nodo raíz: delimita el programa completo ── */
      case 'programa':
        cinta.push('PROGRAMA');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDPROGRAMA');
        break;

      /* ── Sentencias simples ── */
      case 'decl':
        cinta.push('DECL');
        break;

      case 'asignacion':
        cinta.push('ASSIGN');
        break;

      case 'declAsignacion':
        cinta.push('DECL_ASSIGN');
        break;

      case 'print':
        cinta.push('PRINT');
        break;

      case 'printInline':
        cinta.push('PRINT_INLINE');
        break;

      case 'printTexto':
        cinta.push('PRINT_TEXTO');
        break;


      case 'read':
        cinta.push('READ');
        break;

      case 'break':
        cinta.push('BREAK');
        break;

      /* ── Vectores y matrices ── */
      case 'declVector':
        cinta.push('VEC_DECL');
        break;

      case 'asignVector':
        cinta.push('VEC_ASSIGN');
        break;

      case 'declMatriz':
        cinta.push('MAT_DECL');
        break;

      case 'asignMatriz':
        cinta.push('MAT_ASSIGN');
        break;

      /* ── Ciclo for ── */
      case 'for':
        cinta.push('FOR');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDFOR');
        break;

      /* ── Ciclo while ── */
      case 'while':
        cinta.push('WHILE');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDWHILE');
        break;

      /* ── Condicional if simple ── */
      case 'if':
        cinta.push('IF');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDIF');
        break;

      /* ── Condicional if-else ──────────────────────────────────
         nodo.hijos contiene la rama if y la rama else concatenadas.
         nodo.indiceElse marca dónde termina la rama if.
      ────────────────────────────────────────────────────────── */
      case 'ifElse': {
        const corte     = nodo.indiceElse ?? 0;
        const ramaIf    = nodo.hijos.slice(0, corte);
        const ramaElse  = nodo.hijos.slice(corte);

        cinta.push('IF');
        for (const hijo of ramaIf)   this._nodoATokens(hijo, cinta);
        cinta.push('ELSE');
        for (const hijo of ramaElse) this._nodoATokens(hijo, cinta);
        cinta.push('ENDIF');
        break;
      }

      /* ── Switch ── */
      case 'switch':
        cinta.push('SWITCH');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        cinta.push('ENDSWITCH');
        break;

      /* ── Case ── */
      case 'case':
        cinta.push('CASE');
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
        break;

      default:
        /* Nodo desconocido: recorre hijos de todas formas para no
           perder contenido anidado durante el desarrollo */
        for (const hijo of nodo.hijos) this._nodoATokens(hijo, cinta);
    }
  }

  /* ── estaVacio ─────────────────────────────────────────────── */
  estaVacio() {
    if (!this.raiz) return true;
    /* archivo tiene funciones + programa como hijos */
    const programa = this.raiz.hijos.find(h => h.tipo === 'programa');
    const funciones = this.raiz.hijos.filter(h => h.tipo === 'funcDef');
    return funciones.length === 0 && (!programa || !programa.tieneHijos());
  }

  /* ── obtenerCintaConParametros ─────────────────────────────────
     Igual que obtenerCinta() pero cada token lleva sus parámetros
     separados por ":" para que MTTransductora pueda traducirlos.
     Ejemplo: "DECL:int:x"  en lugar de  "DECL"
  ────────────────────────────────────────────────────────────── */
  obtenerCintaConParametros() {
    if (!this.raiz) return [];
    const cinta = [];
    this._nodoATokensConParametros(this.raiz, cinta);
    return cinta;
  }

  /* ── _nodoATokensConParametros ─────────────────────────────────
     DFS preorder — misma estructura que _nodoATokens pero
     los tokens simples llevan los parámetros del nodo.
  ────────────────────────────────────────────────────────────── */
  _nodoATokensConParametros(nodo, cinta) {
    const p = nodo.parametros;

    switch (nodo.tipo) {

      case 'archivo':
        cinta.push('ARCHIVO');
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        break;

      case 'funcDef': {
        const p2     = nodo.parametros;
        const params = p2.params ?? [];
        const paramStr = params.map(p => `${p.tipoDato}:${p.nombre}`).join(':');
        const sep = params.length > 0 ? ':' : '';
        cinta.push(`FUNC_DEF:${p2.nombre}:${p2.tipoRetorno}:${params.length}${sep}${paramStr}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDFUNC');
        break;
      }

      case 'funcCall': {
        const pc   = nodo.parametros;
        const args = pc.args ?? [];
        const argStr = args.length > 0 ? ':' + args.join(':') : '';
        cinta.push(`FUNC_CALL:${pc.nombre}:${args.length}${argStr}`);
        break;
      }

      case 'return':
        cinta.push(`RETURN:${nodo.parametros.valor ?? ''}`);
        break;

      case 'programa':
        cinta.push('PROGRAMA');
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDPROGRAMA');
        break;

      case 'decl':
        cinta.push(`DECL:${p.tipoDato}:${p.variable}`);
        break;

      case 'asignacion':
        cinta.push(`ASSIGN:${p.variable}:${p.valor}`);
        break;

      case 'declAsignacion':
        cinta.push(`DECL_ASSIGN:${p.tipoDato}:${p.variable}:${p.valor}`);
        break;

      case 'print':
        cinta.push(`PRINT:${p.valor}:${p.tipoDato}`);
        break;

      case 'printInline':
        cinta.push(`PRINT_INLINE:${p.valor}:${p.tipoDato}`);
        break;

      case 'printTexto':
        cinta.push(`PRINT_TEXTO:${p.texto}`);
        break;


      case 'read':
        cinta.push(`READ:${p.variable}:${p.tipoDato}`);
        break;

      case 'for':
        cinta.push(`FOR:${p.variable}:${p.inicio}:${p.fin}:${p.incremento}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDFOR');
        break;

      case 'while':
        cinta.push(`WHILE:${p.condicion}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDWHILE');
        break;

      case 'if':
        cinta.push(`IF:${p.condicion}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDIF');
        break;

      case 'ifElse': {
        const corte    = nodo.indiceElse ?? 0;
        const ramaIf   = nodo.hijos.slice(0, corte);
        const ramaElse = nodo.hijos.slice(corte);
        cinta.push(`IF:${p.condicion}`);
        for (const hijo of ramaIf)   this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ELSE');
        for (const hijo of ramaElse) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDIF');
        break;
      }

      case 'switch':
        cinta.push(`SWITCH:${p.variable}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        cinta.push('ENDSWITCH');
        break;

      case 'case':
        cinta.push(`CASE:${p.valor}`);
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
        break;

      case 'break':
        cinta.push('BREAK');
        break;

      case 'declVector':
        cinta.push(`VEC_DECL:${p.tipoDato}:${p.nombre}:${p.tamanio}`);
        break;

      case 'asignVector':
        cinta.push(`VEC_ASSIGN:${p.nombre}:${p.indice}:${p.valor}`);
        break;

      case 'declMatriz':
        cinta.push(`MAT_DECL:${p.tipoDato}:${p.nombre}:${p.filas}:${p.columnas}`);
        break;

      case 'asignMatriz':
        cinta.push(`MAT_ASSIGN:${p.nombre}:${p.fila}:${p.columna}:${p.valor}`);
        break;

      default:
        for (const hijo of nodo.hijos) this._nodoATokensConParametros(hijo, cinta);
    }
  }
}


/* ════════════════════════════════════════════════════════════════
   BLOQUE DE PRUEBA
   Descomenta para verificar en la consola del navegador
   o en Node.js que las clases funcionan correctamente.
════════════════════════════════════════════════════════════════

const _bloquesPrueba = [
  {
    tipo: 'decl',
    parametros: { tipoDato: 'int', variable: 'x' },
    hijos: []
  },
  {
    tipo: 'for',
    parametros: { variable: 'i', inicio: '0', fin: '5', incremento: '1' },
    hijos: [
      { tipo: 'print', parametros: { valor: 'i', tipoDato: 'int' }, hijos: [] }
    ]
  }
];

const _ast = new AST();
_ast.construirDesdeUI(_bloquesPrueba);

console.log('=== Árbol ===');
console.log(JSON.stringify(_ast.raiz, null, 2));

console.log('=== Cinta ===');
console.log(_ast.obtenerCinta());
// Esperado: ["PROGRAMA", "DECL", "FOR", "PRINT", "ENDFOR", "ENDPROGRAMA"]

console.log('=== ¿Vacío? ===', _ast.estaVacio());
// Esperado: false

*/
