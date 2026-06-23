/* ════════════════════════════════════════════════════════════════
   UIBloques.js
   Interfaz visual Blockly para el compilador tipo Scratch.
   Responsabilidades: registrar bloques, manejar el workspace,
   exportar el AST en JSON.
   No conoce la MT ni el GeneradorC.
════════════════════════════════════════════════════════════════ */

/* ── Constantes compartidas ── */
const TIPOS_DATO       = [['int','int'],['float','float'],['double','double'],['char','char']];
const TIPOS_DATO_PRINT = [...TIPOS_DATO, ['texto','texto']];

/* ────────────────────────────────────────────────────────────────
   Registro de bloques personalizados
──────────────────────────────────────────────────────────────── */

function defBloque(tipo, color, campos, cuerpos) {
  Blockly.Blocks[tipo] = {
    init() {
      this.setColour(color);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      campos(this);
      if (cuerpos) cuerpos(this);
    }
  };
}

/* ── Variables ── */
defBloque('bloque_decl', '#283593', b => {
  b.appendDummyInput()
    .appendField('Declarar')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField(new Blockly.FieldTextInput('variable'), 'variable');
  b.setTooltip('Declara una variable sin valor inicial');
});

defBloque('bloque_assign', '#283593', b => {
  b.appendDummyInput()
    .appendField(new Blockly.FieldTextInput('variable'), 'variable')
    .appendField('=')
    .appendField(new Blockly.FieldTextInput('0'), 'valor');
  b.setTooltip('Asigna un valor a una variable existente');
});

defBloque('bloque_decl_assign', '#283593', b => {
  b.appendDummyInput()
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField(new Blockly.FieldTextInput('variable'), 'variable')
    .appendField('=')
    .appendField(new Blockly.FieldTextInput('0'), 'valor');
  b.setTooltip('Declara una variable con valor inicial');
});

/* ── Entrada / Salida ── */
defBloque('bloque_print', '#2e7d32', b => {
  b.appendDummyInput()
    .appendField('Imprimir')
    .appendField(new Blockly.FieldTextInput('valor'), 'valor')
    .appendField('como')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO_PRINT), 'tipoDato');
  b.setTooltip('Imprime un valor por pantalla');
});

defBloque('bloque_read', '#2e7d32', b => {
  b.appendDummyInput()
    .appendField('Leer')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField('en')
    .appendField(new Blockly.FieldTextInput('variable'), 'variable');
  b.setTooltip('Lee un valor del usuario y lo guarda en una variable');
});

/* ── Ciclos ── */
defBloque('bloque_for', '#e65100',
  b => {
    b.appendDummyInput()
      .appendField('for (')
      .appendField(new Blockly.FieldTextInput('i'), 'variable')
      .appendField('de')
      .appendField(new Blockly.FieldNumber(0), 'inicio')
      .appendField('hasta')
      .appendField(new Blockly.FieldNumber(10), 'fin')
      .appendField('++')
      .appendField(new Blockly.FieldNumber(1), 'incremento')
      .appendField(')');
  },
  b => b.appendStatementInput('cuerpo').setCheck(null).appendField('hacer')
);

defBloque('bloque_while', '#e65100',
  b => {
    b.appendDummyInput()
      .appendField('while (')
      .appendField(new Blockly.FieldTextInput('condicion'), 'condicion')
      .appendField(')');
  },
  b => b.appendStatementInput('cuerpo').setCheck(null).appendField('hacer')
);

/* ── Condicionales ── */
defBloque('bloque_if', '#f9a825',
  b => {
    b.appendDummyInput()
      .appendField('if (')
      .appendField(new Blockly.FieldTextInput('condicion'), 'condicion')
      .appendField(')');
  },
  b => b.appendStatementInput('cuerpo').setCheck(null).appendField('entonces')
);

defBloque('bloque_if_else', '#f9a825',
  b => {
    b.appendDummyInput()
      .appendField('if (')
      .appendField(new Blockly.FieldTextInput('condicion'), 'condicion')
      .appendField(')');
  },
  b => {
    b.appendStatementInput('cuerpoIf').setCheck(null).appendField('entonces');
    b.appendStatementInput('cuerpoElse').setCheck(null).appendField('sino');
  }
);

defBloque('bloque_switch', '#f9a825',
  b => {
    b.appendDummyInput()
      .appendField('switch (')
      .appendField(new Blockly.FieldTextInput('variable'), 'variable')
      .appendField(')');
  },
  b => b.appendStatementInput('cuerpo').setCheck(null).appendField('casos')
);

defBloque('bloque_case', '#f9a825',
  b => {
    b.appendDummyInput()
      .appendField('case')
      .appendField(new Blockly.FieldTextInput('valor'), 'valor')
      .appendField(':');
  },
  b => b.appendStatementInput('cuerpo').setCheck(null)
);

/* ── Vectores y Matrices ── */
defBloque('bloque_vec_decl', '#6a1b9a', b => {
  b.appendDummyInput()
    .appendField('Vector')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField(new Blockly.FieldTextInput('vec'), 'nombre')
    .appendField('[')
    .appendField(new Blockly.FieldTextInput('10'), 'tamanio')
    .appendField(']');
  b.setTooltip('Declara un arreglo unidimensional');
});

defBloque('bloque_vec_assign', '#6a1b9a', b => {
  b.appendDummyInput()
    .appendField(new Blockly.FieldTextInput('vec'), 'nombre')
    .appendField('[')
    .appendField(new Blockly.FieldTextInput('0'), 'indice')
    .appendField('] =')
    .appendField(new Blockly.FieldTextInput('0'), 'valor');
  b.setTooltip('Asigna un valor a una posición del vector');
});

defBloque('bloque_mat_decl', '#6a1b9a', b => {
  b.appendDummyInput()
    .appendField('Matriz')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField(new Blockly.FieldTextInput('mat'), 'nombre')
    .appendField('[')
    .appendField(new Blockly.FieldTextInput('3'), 'filas')
    .appendField('][')
    .appendField(new Blockly.FieldTextInput('3'), 'columnas')
    .appendField(']');
  b.setTooltip('Declara una matriz bidimensional');
});

defBloque('bloque_mat_assign', '#6a1b9a', b => {
  b.appendDummyInput()
    .appendField(new Blockly.FieldTextInput('mat'), 'nombre')
    .appendField('[')
    .appendField(new Blockly.FieldTextInput('0'), 'fila')
    .appendField('][')
    .appendField(new Blockly.FieldTextInput('0'), 'columna')
    .appendField('] =')
    .appendField(new Blockly.FieldTextInput('0'), 'valor');
  b.setTooltip('Asigna un valor a una celda de la matriz');
});

/* ── Control de Flujo ── */
defBloque('bloque_break', '#b71c1c', b => {
  b.appendDummyInput().appendField('break');
  b.setTooltip('Rompe el ciclo o switch actual');
});

/* ── Funciones ── */
Blockly.Blocks['bloque_func_def'] = {
  init() {
    this.setColour('#00695c');
    this.appendDummyInput()
      .appendField('función')
      .appendField(new Blockly.FieldDropdown(
        [['void','void'],['int','int'],['float','float'],['double','double'],['char','char']]
      ), 'tipoRetorno')
      .appendField(new Blockly.FieldTextInput('miFuncion'), 'nombre');
    this.appendStatementInput('params').setCheck(null).appendField('parámetros');
    this.appendStatementInput('cuerpo').setCheck(null).appendField('cuerpo');
    this.setDeletable(true);
    this.setMovable(true);
    this.setTooltip('Define una función personalizada. Arrastra bloques "parámetro" al input de parámetros.');
  }
};

defBloque('bloque_param', '#00695c', b => {
  b.appendDummyInput()
    .appendField('parámetro')
    .appendField(new Blockly.FieldDropdown(TIPOS_DATO), 'tipoDato')
    .appendField(new Blockly.FieldTextInput('param'), 'nombre');
  b.setTooltip('Parámetro de una función. Colócalo dentro del input "parámetros" de una función.');
});

Blockly.Blocks['bloque_func_call'] = {
  init() {
    this.setColour('#00695c');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this._numArgs = 0;
    this.appendDummyInput('FUNC_ROW')
      .appendField('llamar')
      .appendField(
        new Blockly.FieldDropdown(() => this._opcionesFunciones()),
        'nombre'
      );
    this.setTooltip('Llama a una función definida en el workspace.');
  },

  saveExtraState() {
    const args = {};
    for (let i = 1; i <= this._numArgs; i++) {
      args['arg' + i] = this.getFieldValue('arg' + i) ?? '';
    }
    return { numArgs: this._numArgs, args };
  },

  loadExtraState(state) {
    if (!state) return;
    this._setArgFields(state.numArgs ?? 0);
    const guardados = state.args ?? {};
    for (let i = 1; i <= this._numArgs; i++) {
      if (guardados['arg' + i] != null) {
        try { this.setFieldValue(guardados['arg' + i], 'arg' + i); } catch (_) {}
      }
    }
  },

  onchange(e) {
    if (!this.workspace || this.workspace.isFlyout) return;
    /* Al cambiar la función seleccionada, regenerar args */
    if (e.type === Blockly.Events.BLOCK_CHANGE &&
        e.blockId === this.id && e.name === 'nombre') {
      this._actualizarArgs();
      return;
    }
    /* Al modificar un func_def o param en el workspace, revalidar */
    const b = this.workspace.getBlockById(e.blockId);
    if (b?.type === 'bloque_func_def' || b?.type === 'bloque_param') {
      this._actualizarArgs();
    }
  },

  _opcionesFunciones() {
    const ws = this.workspace;
    if (!ws) return [['(ninguna)', '']];
    const funcs = ws.getBlocksByType('bloque_func_def', false)
      .filter(b => !b.workspace?.isFlyout);
    if (!funcs.length) return [['(ninguna)', '']];
    return funcs.map(b => {
      const n = b.getFieldValue('nombre') || '?';
      return [n, n];
    });
  },

  _actualizarArgs() {
    const nombre = this.getFieldValue('nombre');
    if (!nombre || !this.workspace) { this._setArgFields(0); return; }
    const funcBlock = this.workspace.getBlocksByType('bloque_func_def', false)
      .find(b => b.getFieldValue('nombre') === nombre && !b.workspace?.isFlyout);
    if (!funcBlock) { this._setArgFields(0); return; }
    let count = 0;
    let p = funcBlock.getInput('params')?.connection?.targetBlock();
    while (p) { count++; p = p.getNextBlock(); }
    this._setArgFields(count);
  },

  _setArgFields(count) {
    if (count === this._numArgs) return;
    for (let i = 1; i <= this._numArgs + count + 1; i++) {
      if (this.getInput('ARG' + i)) this.removeInput('ARG' + i);
    }
    for (let j = 1; j <= count; j++) {
      this.appendDummyInput('ARG' + j)
        .appendField('  arg' + j + ':')
        .appendField(new Blockly.FieldTextInput(''), 'arg' + j);
    }
    this._numArgs = count;
  }
};

defBloque('bloque_return', '#00695c', b => {
  b.appendDummyInput()
    .appendField('return')
    .appendField(new Blockly.FieldTextInput(''), 'valor');
  b.setTooltip('Retorna un valor de la función. Dejar vacío para void.');
});

/* ── Bloque raíz: programa ─────────────────────────────────────
   Contenedor único de todo el programa.
   No tiene previousStatement ni nextStatement:
   no puede conectarse debajo de ningún otro bloque.
   No es eliminable ni movible por el usuario.
────────────────────────────────────────────────────────────── */
Blockly.Blocks['bloque_programa'] = {
  init() {
    this.setColour('#1a1a2e');
    this.appendDummyInput()
      .appendField('⬛  programa');
    this.appendStatementInput('cuerpo')
      .setCheck(null);
    this.setDeletable(false);
    this.setMovable(true);
    this.setTooltip('Bloque principal del programa. Todo el código va aquí dentro.');
  },
  customContextMenu(opciones) {
    /* Elimina las opciones de duplicar y copiar del menú contextual */
    return opciones.filter(o => !/duplic|copy/i.test(o.text ?? ''));
  }
};

/* ════════════════════════════════════════════════════════════════
   CLASE UIBloques
════════════════════════════════════════════════════════════════ */

class UIBloques {
  /**
   * @param {object|null} interprete  - Instancia del intérprete/compilador.
   *   Si es null, onEjecutar() opera en modo debug y muestra el AST.
   *   La interfaz esperada cuando se conecte:
   *     interprete.ejecutarPrograma(ast) → { codigoC: string, output: string }
   */
  constructor(interprete = null) {
    this.bloquesCanvas = [];
    this.interprete    = interprete;
    this.workspace     = null;
  }

  /* ── inicializar ── */
  inicializar() {
    /* Lee las variables CSS del tema para pasarlas a Blockly */
    const css = getComputedStyle(document.documentElement);
    const v   = name => css.getPropertyValue(name).trim();

    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox:    document.getElementById('toolbox'),
      scrollbars: true,
      trashcan:   true,
      zoom:  { controls: true, wheel: true, startScale: 1.0 },
      grid:  { spacing: 20, length: 3, colour: v('--blockly-grid'), snap: true },
      theme: Blockly.Theme.defineTheme('tema-ui', {
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: v('--blockly-bg')      || '#12122a',
          toolboxBackgroundColour:   v('--color-surface')   || '#16213e',
          toolboxForegroundColour:   v('--color-text')      || '#e0e0e0',
          flyoutBackgroundColour:    v('--blockly-bg')      || '#1a1a3a',
          flyoutForegroundColour:    v('--color-text')      || '#e0e0e0',
          flyoutOpacity: 0.95,
          scrollbarColour:           v('--blockly-scrollbar') || '#333',
          insertionMarkerColour:     v('--blockly-marker')    || '#e94560',
          insertionMarkerOpacity: 0.5,
        }
      })
    });

    /* Mantener bloquesCanvas sincronizado con eventos del workspace */
    this.workspace.addChangeListener(e => {
      if (e.type === Blockly.Events.BLOCK_CREATE) {
        this.bloquesCanvas.push(e.blockId);
      } else if (e.type === Blockly.Events.BLOCK_DELETE) {
        this.bloquesCanvas = this.bloquesCanvas.filter(id => id !== e.blockId);
      }
    });

    /* Crear bloque_programa inicial */
    Blockly.Events.disable();
    const bloquePrograma = this.workspace.newBlock('bloque_programa');
    bloquePrograma.initSvg();
    bloquePrograma.render();
    bloquePrograma.moveBy(50, 50);
    Blockly.Events.enable();
  }

  /* ── guardarJSON ─────────────────────────────────────────────── */
  guardarJSON() {
    const estado = Blockly.serialization.workspaces.save(this.workspace);
    const blob   = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = 'programa.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── cargarJSON ──────────────────────────────────────────────── */
  cargarJSON(archivo) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const estado = JSON.parse(e.target.result);
        const topBlockStates = estado?.blocks?.blocks ?? [];

        /* Paso 1: igual que btn-limpiar — sin workspace.clear(), sin papelera */
        for (const b of this.workspace.getTopBlocks(false)) {
          if (b.type !== 'bloque_programa') b.dispose(false);
        }
        const [prog] = this.workspace.getBlocksByType('bloque_programa', false);
        if (prog) {
          let actual = prog.getInput('cuerpo')?.connection?.targetBlock();
          while (actual) { const sig = actual.getNextBlock(); actual.dispose(false); actual = sig; }
        }

        /* Paso 2: reconstruir bloques desde el JSON sin usar workspaces.load()
           (que siempre llama workspace.clear() e inevitablemente usa el trashcan) */
        const progState   = topBlockStates.find(b => b.type === 'bloque_programa');
        const otrosStates = topBlockStates.filter(b => b.type !== 'bloque_programa');

        Blockly.Events.disable();

        for (const blockState of otrosStates) {
          const b = this._cargarBloqueDesdeEstado(blockState);
          b.render();
          if (blockState.x != null) b.moveBy(blockState.x, blockState.y ?? 0);
        }

        const cuerpoBloqueState = progState?.inputs?.cuerpo?.block;
        if (cuerpoBloqueState && prog) {
          const primero = this._cargarBloqueDesdeEstado(cuerpoBloqueState);
          const conn = prog.getInput('cuerpo')?.connection;
          if (conn && primero?.previousConnection) conn.connect(primero.previousConnection);
        }

        if (prog) prog.render();
        Blockly.Events.enable();

      } catch (err) {
        alert('No se pudo cargar el archivo: ' + err.message);
      }
    };
    reader.readAsText(archivo);
  }

  /* ── _cargarBloqueDesdeEstado ─────────────────────────────────── */
  _cargarBloqueDesdeEstado(blockState) {
    const block = this.workspace.newBlock(blockState.type);
    block.initSvg();

    /* extraState primero — crea campos dinámicos antes de intentar llenarlos */
    if (blockState.extraState != null && typeof block.loadExtraState === 'function') {
      block.loadExtraState(blockState.extraState);
    }

    for (const [name, val] of Object.entries(blockState.fields ?? {})) {
      try { block.setFieldValue(String(val), name); } catch (_) {}
    }

    for (const [inputName, inputState] of Object.entries(blockState.inputs ?? {})) {
      if (inputState?.block) {
        const child = this._cargarBloqueDesdeEstado(inputState.block);
        const input = block.getInput(inputName);
        if (input?.connection && child.previousConnection) {
          input.connection.connect(child.previousConnection);
        }
      }
    }

    if (blockState.next?.block) {
      const next = this._cargarBloqueDesdeEstado(blockState.next.block);
      if (block.nextConnection && next.previousConnection) {
        block.nextConnection.connect(next.previousConnection);
      }
    }

    return block;
  }

  /* ── agregarBloque ── */
  agregarBloque(tipo) {
    const bloque = this.workspace.newBlock(tipo);
    bloque.initSvg();
    bloque.render();
    const metrics = this.workspace.getMetrics();
    bloque.moveBy(
      metrics ? metrics.viewLeft + 50 : 50,
      metrics ? metrics.viewTop  + 50 : 50
    );
  }

  /* ── eliminarBloque ── */
  eliminarBloque(id) {
    const bloque = this.workspace.getBlockById(id);
    if (bloque) {
      bloque.dispose(true);
      this.bloquesCanvas = this.bloquesCanvas.filter(bid => bid !== id);
    }
  }

  /* ── exportarBloques ── */
  exportarBloques() {
    const funciones = [];
    for (const b of this.workspace.getTopBlocks(false)) {
      if (b.type === 'bloque_func_def') funciones.push(this._convertirBloque(b));
    }
    const [prog] = this.workspace.getBlocksByType('bloque_programa', false);
    const hijos = prog ? this._obtenerHijosDeInput(prog, 'cuerpo') : [];
    return { funciones, hijos };
  }

  /* ── onEjecutar ── */
  async onEjecutar() {
    /* 1. Exportar bloques del workspace */
    const bloquesJSON = this.exportarBloques();
    if (bloquesJSON.hijos.length === 0 && bloquesJSON.funciones.length === 0) {
      this.mostrarOutput('El programa está vacío. Agrega bloques dentro del bloque programa.');
      return;
    }

    /* 2. Construir AST */
    const ast = new AST().construirDesdeUI(bloquesJSON);

    /* 3. Validar con el Autómata de Pila */
    const ap = new AutomataPila();
    ap.cargarCinta(ast.obtenerCinta());
    if (!ap.ejecutar()) {
      this.mostrarOutput(ap.obtenerError());
      return;
    }

    /* 4. Análisis semántico con la MT Semántica */
    const mts = new MTSemantica();
    mts.cargarCinta(ast.obtenerCintaConParametros());
    if (!mts.ejecutar()) {
      this.mostrarOutput(mts.obtenerError());
      return;
    }

    /* 5. Generar código C con la MT Transductora */
    const mt = new MTTransductora();
    mt.cargarCinta(ast.obtenerCintaConParametros());
    const codigo = mt.ejecutar();

    if (!codigo) {
      this.mostrarOutput('Error al generar código C:\n' + mt.obtenerError());
      return;
    }

    document.getElementById('codigo-c').textContent = codigo;

    /* 5. Enviar al servidor para compilar y ejecutar */
    this.mostrarOutput('Compilando...');
    try {
      const stdin = document.getElementById('stdin-area')?.value ?? '';
      const res = await fetch('/ejecutar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ codigo, stdin })
      });

      const { output, error } = await res.json();

      if (error) {
        this.mostrarOutput('Error de compilación / ejecución:\n' + error);
        return;
      }

      /* 6. Mostrar resultado y habilitar botones de descarga */
      this.mostrarOutput(output || '(sin output)');
      document.getElementById('btn-descargar-c').disabled   = false;
      document.getElementById('btn-descargar-exe').disabled = false;

    } catch (err) {
      this.mostrarOutput('Error de red — ¿está corriendo el servidor?\n' + err.message);
    }
  }

  /* ── mostrarOutput ── */
  mostrarOutput(texto) {
    document.getElementById('output-area').textContent = texto;
  }

  /* ────────────────────────────────────────────────────────────
     Métodos privados de conversión bloque → NodoAST
  ──────────────────────────────────────────────────────────── */

  _convertirBloque(bloque) {
    const tipo = bloque.type;
    let nodo;

    switch (tipo) {

      /* Variables */
      case 'bloque_decl':
        nodo = {
          tipo: 'decl',
          parametros: {
            tipoDato: bloque.getFieldValue('tipoDato'),
            variable: bloque.getFieldValue('variable')
          }
        };
        break;

      case 'bloque_assign':
        nodo = {
          tipo: 'asignacion',
          parametros: {
            variable: bloque.getFieldValue('variable'),
            valor:    bloque.getFieldValue('valor')
          }
        };
        break;

      case 'bloque_decl_assign':
        nodo = {
          tipo: 'declAsignacion',
          parametros: {
            tipoDato: bloque.getFieldValue('tipoDato'),
            variable: bloque.getFieldValue('variable'),
            valor:    bloque.getFieldValue('valor')
          }
        };
        break;

      /* Entrada / Salida */
      case 'bloque_print':
        nodo = {
          tipo: 'print',
          parametros: {
            valor:    bloque.getFieldValue('valor'),
            tipoDato: bloque.getFieldValue('tipoDato')
          }
        };
        break;

      case 'bloque_read':
        nodo = {
          tipo: 'read',
          parametros: {
            variable: bloque.getFieldValue('variable'),
            tipoDato: bloque.getFieldValue('tipoDato')
          }
        };
        break;

      /* Ciclos */
      case 'bloque_for': {
        nodo = {
          tipo: 'for',
          parametros: {
            variable:   bloque.getFieldValue('variable'),
            inicio:     bloque.getFieldValue('inicio'),
            fin:        bloque.getFieldValue('fin'),
            incremento: bloque.getFieldValue('incremento')
          },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;
      }

      case 'bloque_while':
        nodo = {
          tipo: 'while',
          parametros: { condicion: bloque.getFieldValue('condicion') },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;

      /* Condicionales */
      case 'bloque_if':
        nodo = {
          tipo: 'if',
          parametros: { condicion: bloque.getFieldValue('condicion') },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;

      case 'bloque_if_else': {
        const hijosIf   = this._obtenerHijosDeInput(bloque, 'cuerpoIf');
        const hijosElse = this._obtenerHijosDeInput(bloque, 'cuerpoElse');
        nodo = {
          tipo: 'ifElse',
          parametros: { condicion: bloque.getFieldValue('condicion') },
          hijos: [...hijosIf, ...hijosElse],
          indiceElse: hijosIf.length
        };
        break;
      }

      case 'bloque_switch':
        nodo = {
          tipo: 'switch',
          parametros: { variable: bloque.getFieldValue('variable') },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;

      case 'bloque_case':
        nodo = {
          tipo: 'case',
          parametros: { valor: bloque.getFieldValue('valor') },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;

      /* Vectores y Matrices */
      case 'bloque_vec_decl':
        nodo = {
          tipo: 'declVector',
          parametros: {
            tipoDato: bloque.getFieldValue('tipoDato'),
            nombre:   bloque.getFieldValue('nombre'),
            tamanio:  bloque.getFieldValue('tamanio')
          }
        };
        break;

      case 'bloque_vec_assign':
        nodo = {
          tipo: 'asignVector',
          parametros: {
            nombre: bloque.getFieldValue('nombre'),
            indice: bloque.getFieldValue('indice'),
            valor:  bloque.getFieldValue('valor')
          }
        };
        break;

      case 'bloque_mat_decl':
        nodo = {
          tipo: 'declMatriz',
          parametros: {
            tipoDato: bloque.getFieldValue('tipoDato'),
            nombre:   bloque.getFieldValue('nombre'),
            filas:    bloque.getFieldValue('filas'),
            columnas: bloque.getFieldValue('columnas')
          }
        };
        break;

      case 'bloque_mat_assign':
        nodo = {
          tipo: 'asignMatriz',
          parametros: {
            nombre:  bloque.getFieldValue('nombre'),
            fila:    bloque.getFieldValue('fila'),
            columna: bloque.getFieldValue('columna'),
            valor:   bloque.getFieldValue('valor')
          }
        };
        break;

      /* Control de Flujo */
      case 'bloque_break':
        nodo = { tipo: 'break', parametros: {} };
        break;

      /* Funciones */
      case 'bloque_func_def': {
        const paramNodos = this._obtenerHijosDeInput(bloque, 'params');
        nodo = {
          tipo: 'funcDef',
          parametros: {
            nombre:      bloque.getFieldValue('nombre'),
            tipoRetorno: bloque.getFieldValue('tipoRetorno'),
            params: paramNodos.map(p => ({
              tipoDato: p.parametros.tipoDato,
              nombre:   p.parametros.nombre
            }))
          },
          hijos: this._obtenerHijosDeInput(bloque, 'cuerpo')
        };
        break;
      }

      case 'bloque_param':
        nodo = {
          tipo: 'param',
          parametros: {
            tipoDato: bloque.getFieldValue('tipoDato'),
            nombre:   bloque.getFieldValue('nombre')
          }
        };
        break;

      case 'bloque_func_call': {
        const args = [];
        for (let i = 1; bloque.getInput('ARG' + i); i++) {
          args.push(bloque.getFieldValue('arg' + i) ?? '');
        }
        nodo = {
          tipo: 'funcCall',
          parametros: { nombre: bloque.getFieldValue('nombre'), args }
        };
        break;
      }

      case 'bloque_return':
        nodo = {
          tipo: 'return',
          parametros: { valor: bloque.getFieldValue('valor') }
        };
        break;

      default:
        nodo = { tipo, parametros: {} };
    }

    if (!nodo.hijos) nodo.hijos = [];
    return nodo;
  }

  /* Recorre la cadena de bloques conectados dentro de un statementInput */
  _obtenerHijosDeInput(bloque, nombreInput) {
    const input = bloque.getInput(nombreInput);
    if (!input?.connection) return [];
    const hijos = [];
    let actual  = input.connection.targetBlock();
    while (actual) {
      hijos.push(this._convertirBloque(actual));
      actual = actual.getNextBlock();
    }
    return hijos;
  }
}
