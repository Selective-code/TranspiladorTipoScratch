# Transpilador Bloques → C

Compilador visual tipo Scratch que genera, compila y ejecuta código C directamente desde el navegador.

## ¿Cómo funciona?

1. Arrastra bloques al workspace (variables, ciclos, condicionales, E/S, vectores, matrices)
2. Presiona **Ejecutar** — el pipeline completo corre automáticamente:
   - Los bloques se exportan como un AST en JSON
   - Un autómata de pila valida la estructura del programa
   - Una máquina de Turing transductora genera el código C
   - El servidor compila con `gcc` y ejecuta el binario
   - El output aparece en el panel derecho

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
│   ├── index.html          # Interfaz principal (Blockly + paneles)
│   ├── theme.css           # Paleta LEGO, tema claro/oscuro
│   ├── UIBloques.js        # Definición de bloques y clase UIBloques
│   └── favicon.png         # Icono del navegador
├── Logic/
│   ├── ast.js              # Clases NodoAST y AST (árbol sintáctico)
│   ├── automata_pila.js    # Autómata de pila (validación estructural)
│   ├── mt_transductora.js  # Máquina de Turing transductora (generación de C)
│   └── ejecutor.js         # Compilación y ejecución con gcc (Node.js)
├── servidor.js             # Servidor Express (API + archivos estáticos)
└── package.json
```

## Bloques disponibles

| Categoría | Bloques |
|---|---|
| Variables | Declarar, Asignar, Declarar+Asignar |
| Entrada / Salida | Imprimir, Leer |
| Ciclos | for, while |
| Condicionales | if, if/else, switch/case |
| Vectores y Matrices | Declarar vector, Asignar vector, Declarar matriz, Asignar matriz |
| Control de flujo | break |

## API del servidor

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/ejecutar` | Recibe código C, compila y ejecuta |
| `GET` | `/descargar/c` | Descarga el último `temp.c` generado |
| `GET` | `/descargar/exe` | Descarga el último `temp.exe` compilado |

## Guardar y cargar proyectos

Usa los botones **💾 Guardar** y **📂 Cargar** en el panel de controles para exportar e importar el workspace como un archivo `.json`.
