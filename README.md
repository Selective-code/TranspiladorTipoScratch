# Transpilador Bloques → C

Compilador visual tipo Scratch que genera, compila y ejecuta código C directamente desde el navegador. Desarrollado para la asignatura **Autómatas y Lenguajes Formales**.

## ¿Cómo funciona?

1. Arrastra bloques al workspace (variables, ciclos, condicionales, E/S, funciones, vectores, matrices)
2. Asigna un nombre a tu programa en el bloque principal
3. Presiona **Ejecutar** — el pipeline completo corre automáticamente:
   - Los bloques se exportan como un AST en JSON
   - Un **autómata de pila** valida la estructura sintáctica del programa
   - Una **máquina de Turing semántica de dos cintas** verifica declaración y uso de variables
   - Una **máquina de Turing transductora** genera el código C
   - El servidor compila con `gcc` y ejecuta el binario
   - El output aparece en la pestaña Output

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [MSYS2](https://www.msys2.org/) con MinGW64 instalado (`gcc` disponible en PATH)

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

Luego abre [http://localhost:3000](http://localhost:3000) en el navegador.

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Estructura del proyecto

```
TranspiladorTipoScratch/
├── UI/
│   ├── index.html          # Interfaz principal (Blockly + pestañas)
│   ├── theme.css           # Paleta de colores, tema claro/oscuro
│   ├── UIBloques.js        # Definición de bloques y clase UIBloques
│   └── favicon.png         # Icono del navegador
├── Logic/
│   ├── ast.js              # Clases NodoAST y AST (árbol sintáctico)
│   ├── automata_pila.js    # Autómata de pila (validación estructural)
│   ├── mt_semantica.js     # MT de dos cintas (análisis semántico)
│   ├── mt_transductora.js  # MT transductora (generación de código C)
│   └── ejecutor.js         # Compilación y ejecución con gcc (Node.js)
├── tests/
│   ├── calculadora.json        # Ejemplo: calculadora con float y switch
│   ├── bubblesort.json         # Ejemplo: bubble sort con función
│   └── multiplicacion_matrices.json  # Ejemplo: multiplicación 2x2
├── servidor.js             # Servidor Express (API + archivos estáticos)
└── package.json
```

## Bloques disponibles

| Categoría | Bloques |
|---|---|
| Variables | Declarar, Asignar, Declarar+Asignar |
| Entrada / Salida | Imprimir variable, Imprimir inline, Imprimir texto, Leer |
| Ciclos | for, while |
| Condicionales | if, if/else, switch/case |
| Vectores y Matrices | Declarar vector, Asignar vector, Declarar matriz, Asignar matriz |
| Control de flujo | break |
| Funciones | Definir función, Parámetro, Llamar función, Return |

## Pipeline de compilación

```
Bloques Blockly
      ↓
    AST (NodoAST)
      ↓
Autómata de Pila → valida estructura (FOR/WHILE/IF/SWITCH balanceados, BREAK y CASE en contexto)
      ↓
MT Semántica (2 cintas) → verifica variables declaradas, scopes, funciones registradas
      ↓
MT Transductora → genera código C token a token
      ↓
gcc (spawnSync) → compila a binario
      ↓
Ejecución del binario con stdin → output en pantalla
```

## API del servidor

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/ejecutar` | Recibe código C + stdin, compila y ejecuta |
| `GET` | `/descargar/c?nombre=X` | Descarga el último `.c` generado con el nombre indicado |
| `GET` | `/descargar/exe?nombre=X` | Descarga el último `.exe` compilado con el nombre indicado |

## Guardar y cargar proyectos

Usa los botones **💾 Guardar** y **📂 Cargar** para exportar e importar el workspace como `.json`. El archivo se guarda con el nombre definido en el bloque programa.

Los archivos de ejemplo en `tests/` se pueden cargar directamente desde la interfaz.
