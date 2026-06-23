/* ════════════════════════════════════════════════════════════════
   mt_transductora.js  —  MTTransductora
   MT = (Q, q0, F, Σ, Γ, b, δ)

   Q  = { q0, q1, q_accept }
   q0 = q0  |  F = { q_accept }

   Recibe la cinta con parámetros de AST.obtenerCintaConParametros()
   y la transforma token a token en código C completo.
   Avanza siempre hacia la derecha — nunca retrocede.
════════════════════════════════════════════════════════════════ */

class MTTransductora {
  constructor() {
    this.cinta        = [];
    this.cintaSalida  = [];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }

  /* ── cargarCinta ────────────────────────────────────────────── */
  cargarCinta(tokens) {
    this.cinta        = [...tokens];
    this.cintaSalida  = [];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }

  /* ── formato ────────────────────────────────────────────────── */
  formato(tipoDato) {
    const tabla = { int: '%d', float: '%f', double: '%lf', char: ' %c', texto: '%s' };
    return tabla[tipoDato] ?? '%d';
  }

  /* ── paso ───────────────────────────────────────────────────── */
  paso() {
    const tokenCompleto = this.cinta[this.cabezal];
    const partes        = tokenCompleto.split(':');
    const tipo          = partes[0];
    let salida          = '';

    /* ── Primero intenta la tabla DELTA para tokens sin parámetros ── */
    const entrada = MTTransductora.DELTA[this.estadoActual]?.[tipo];

    if (entrada) {
      salida            = entrada.salida;
      this.estadoActual = entrada.siguiente;
      this.cintaSalida.push(salida);
      this.cabezal++;
      return;
    }

    /* ── Tokens con parámetros — construcción dinámica ── */
    if (this.estadoActual !== 'q1') {
      this.ultimoError  = `Error: Token inesperado '${tipo}' en estado '${this.estadoActual}'`;
      this.estadoActual = 'q_error';
      return;
    }

    switch (tipo) {

      case 'DECL':
        salida = `${partes[1]} ${partes[2]};\n`;
        break;

      case 'ASSIGN':
        salida = `${partes[1]}=${partes[2]};\n`;
        break;

      case 'DECL_ASSIGN':
        salida = `${partes[1]} ${partes[2]}=${partes[3]};\n`;
        break;

      case 'PRINT': {
        const fmt = this.formato(partes[2]);
        salida = `printf("${fmt}\\n",${partes[1]});\n`;
        break;
      }

      case 'READ': {
        const fmt = this.formato(partes[2]);
        salida = `scanf("${fmt}",&${partes[1]});\n`;
        break;
      }

      case 'FOR':
        salida = `for(int ${partes[1]}=${partes[2]};${partes[1]}<${partes[3]};${partes[1]}+=${partes[4]}){\n`;
        break;

      case 'WHILE':
        salida = `while(${partes[1]}){\n`;
        break;

      case 'IF':
        salida = `if(${partes[1]}){\n`;
        break;

      case 'SWITCH':
        salida = `switch(${partes[1]}){\n`;
        break;

      case 'CASE':
        salida = `case ${partes[1]}:\n`;
        break;

      case 'VEC_DECL':
        salida = `${partes[1]} ${partes[2]}[${partes[3]}];\n`;
        break;

      case 'VEC_ASSIGN':
        salida = `${partes[1]}[${partes[2]}]=${partes[3]};\n`;
        break;

      case 'MAT_DECL':
        salida = `${partes[1]} ${partes[2]}[${partes[3]}][${partes[4]}];\n`;
        break;

      case 'MAT_ASSIGN':
        salida = `${partes[1]}[${partes[2]}][${partes[3]}]=${partes[4]};\n`;
        break;

      case 'FUNC_DEF': {
        /* FUNC_DEF:nombre:tipoRetorno:numParams:tipo1:nom1:tipo2:nom2:tipo3:nom3 */
        const fnNombre    = partes[1];
        const tipoRetorno = partes[2];
        const numParams   = parseInt(partes[3], 10) || 0;
        const paramList   = [];
        for (let i = 0; i < numParams; i++) {
          paramList.push(`${partes[4 + i * 2]} ${partes[5 + i * 2]}`);
        }
        salida = `${tipoRetorno} ${fnNombre}(${paramList.join(', ')}){\n`;
        break;
      }

      case 'FUNC_CALL': {
        /* FUNC_CALL:nombre:numArgs:arg1:arg2:arg3 */
        const callNombre = partes[1];
        const numArgs    = parseInt(partes[2], 10) || 0;
        const args       = [];
        for (let i = 0; i < numArgs; i++) args.push(partes[3 + i]);
        salida = `${callNombre}(${args.join(',')});\n`;
        break;
      }

      case 'RETURN': {
        const val = partes[1] ?? '';
        salida = val.trim() ? `return ${val};\n` : 'return;\n';
        break;
      }

      default:
        this.ultimoError  = `Error: Token desconocido '${tokenCompleto}'`;
        this.estadoActual = 'q_error';
        return;
    }

    this.cintaSalida.push(salida);
    this.cabezal++;
    /* estado permanece q1 para todos los tokens con parámetros */
  }

  /* ── ejecutar ───────────────────────────────────────────────── */
  ejecutar() {
    while (
      this.estadoActual !== 'q_accept' &&
      this.estadoActual !== 'q_error'
    ) {
      if (this.cabezal >= this.cinta.length) {
        this.ultimoError  = 'Error: La cinta terminó sin llegar a ENDPROGRAMA';
        this.estadoActual = 'q_error';
        break;
      }
      this.paso();
    }

    if (this.estadoActual === 'q_error') return null;
    return this.cintaSalida.join('');
  }

  /* ── obtenerError ───────────────────────────────────────────── */
  obtenerError() {
    return this.ultimoError;
  }

  /* ── reiniciar ──────────────────────────────────────────────── */
  reiniciar() {
    this.cinta        = [];
    this.cintaSalida  = [];
    this.cabezal      = 0;
    this.estadoActual = 'q0';
    this.ultimoError  = '';
  }
}

/* ════════════════════════════════════════════════════════════════
   TABLA DE TRANSICIONES δ
   Solo para tokens sin parámetros (salida estática conocida).
   Los tokens con parámetros se construyen dinámicamente en paso().
════════════════════════════════════════════════════════════════ */
MTTransductora.DELTA = {

  q0: {
    ARCHIVO: {
      siguiente: 'q1',
      salida:    '#include <stdio.h>\n#include <stdlib.h>\n\n'
    }
  },

  q1: {
    PROGRAMA:    { siguiente: 'q1',       salida: 'int main(){\n'  },
    ENDFUNC:     { siguiente: 'q1',       salida: '}\n\n'          },
    ENDPROGRAMA: { siguiente: 'q_accept', salida: '#ifdef _WIN32\nsystem("pause");\n#endif\nreturn 0;\n}' },
    ENDFOR:      { siguiente: 'q1',       salida: '}\n'          },
    ENDWHILE:    { siguiente: 'q1',       salida: '}\n'          },
    ENDIF:       { siguiente: 'q1',       salida: '}\n'          },
    ELSE:        { siguiente: 'q1',       salida: '}else{\n'     },
    ENDSWITCH:   { siguiente: 'q1',       salida: '}\n'          },
    BREAK:       { siguiente: 'q1',       salida: 'break;\n'     }
  }
};


/* ════════════════════════════════════════════════════════════════
   BLOQUE DE PRUEBA
   Descomenta para verificar en la consola del navegador o Node.js

const mt = new MTTransductora();

// ── Ejemplo 1: programa simple con FOR ──
mt.cargarCinta([
  "PROGRAMA",
  "DECL:int:x",
  "DECL_ASSIGN:int:i:0",
  "FOR:i:0:5:1",
  "PRINT:i:int",
  "ENDFOR",
  "ENDPROGRAMA"
]);
console.log("Ejemplo 1:");
console.log(mt.ejecutar());
// #include <stdio.h>
// #include <stdlib.h>
// int main(){int x;int i=0;for(int i=0;i<5;i+=1){printf("%d\n",i);}return 0;}

// ── Ejemplo 2: switch con case y break ──
mt.cargarCinta([
  "PROGRAMA",
  "DECL:int:op",
  "READ:op:int",
  "SWITCH:op",
  "CASE:1",
  "PRINT:op:int",
  "BREAK",
  "ENDSWITCH",
  "ENDPROGRAMA"
]);
console.log("\nEjemplo 2:");
console.log(mt.ejecutar());
// #include <stdio.h>
// #include <stdlib.h>
// int main(){int op;scanf("%d",&op);switch(op){case 1:printf("%d\n",op);break;}return 0;}

// ── Ejemplo 3: if-else ──
mt.cargarCinta([
  "PROGRAMA",
  "DECL_ASSIGN:int:x:10",
  "IF:x>5",
  "PRINT:x:int",
  "ELSE",
  "ASSIGN:x:0",
  "ENDIF",
  "ENDPROGRAMA"
]);
console.log("\nEjemplo 3:");
console.log(mt.ejecutar());
// #include <stdio.h>
// #include <stdlib.h>
// int main(){int x=10;if(x>5){printf("%d\n",x);}else{x=0;}return 0;}

*/
