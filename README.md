# monaco-editor-esm

## Real ESM version of Monaco Editor

This package provides a true ESM (EcmaScript Module) build of the [Monaco Editor](https://github.com/microsoft/monaco-editor), suitable for modern build tools and direct browser usage. All JavaScript modules are available in the `/esm` directory, and all required CSS files are in `/min`.

### Why ESM?
- Native ESM modules allow for better tree-shaking, direct browser imports, and compatibility with modern bundlers (Webpack, Rollup, Vite, etc.).
- The official Monaco Editor package is not fully ESM and includes AMD/CommonJS code and non-standard CSS imports.

### Usage

#### With a Bundler (Webpack, Rollup, Vite, etc.)
1. Install the package:
   ```sh
   npm install monaco-editor-esm
   ```
2. Import the editor in your code:
   ```js
   import * as monaco from 'monaco-editor-esm/esm/vs/editor/editor.main.js';
   ```
3. Make sure to load the required CSS from `/min`:
   ```js
   import 'monaco-editor-esm/min/vs/editor/editor.main.css';
   ```
   Or include it in your HTML:
   ```html
   <link rel="stylesheet" href="node_modules/monaco-editor-esm/min/vs/editor/editor.main.css">
   ```

#### Directly in the Browser
- You can import modules from `/esm` using `<script type="module">`, but **CSS imports in JS are not natively supported in browsers**. You must manually include the CSS in your HTML:
   ```html
   <link rel="stylesheet" href="path/to/min/vs/editor/editor.main.css">
   <script type="module">
     import * as monaco from './esm/vs/editor/editor.main.js';
     // ...
   </script>
   ```

### CSS Import Caveats
- The ESM modules may contain `import './file.css'` statements, which are not yet supported natively in browsers or Node.js. Most bundlers can handle these imports with the appropriate loader/plugin.
- If you use the modules directly in the browser, you must include the CSS manually as shown above.
- For more background, see the [discussion on ESM and CSS loading](https://github.com/microsoft/monaco-editor/issues/886#issuecomment-4248483831).

### Limitations
- Some features may require additional configuration for web workers. See Monaco Editor documentation for details.
- The ESM build is not guaranteed to be 100% compatible with all Monaco Editor plugins or extensions.

### License
MIT
