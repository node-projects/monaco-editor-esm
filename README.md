# @node-projects/monaco-editor-esm

[![npm version](https://img.shields.io/npm/v/@node-projects/monaco-editor-esm.svg?style=flat-square)](https://www.npmjs.com/package/@node-projects/monaco-editor-esm)

## Real ESM version of Monaco Editor

This package provides a true ESM (EcmaScript Module) build of the [Monaco Editor](https://github.com/microsoft/monaco-editor), suitable for modern build tools and direct browser usage. All JavaScript modules are available in the `/esm` directory, and all required CSS files are in `/min`.

### Why ESM?
- Native ESM modules allow for better tree-shaking, direct browser imports, and compatibility with modern bundlers (Webpack, Rollup, Vite, etc.).
- The official Monaco Editor package is not fully ESM and includes AMD/CommonJS code and non-standard CSS imports.

### Usage

1. Install the package:
   ```sh
   npm install @node-projects/monaco-editor-esm
   ```
2. Import the editor in your code:
   ```js
   import * as monaco from '@node-projects/monaco-editor-esm/esm/vs/editor/editor.main.js';
   ```
3. Always include the CSS via a `<link>` tag in your **main HTML file** (`index.html`):
   ```html
   <link rel="stylesheet" href="node_modules/@node-projects/monaco-editor-esm/min/vs/editor/editor.main.css">
   ```
   > **Important:** The CSS **must** be loaded through a `<link>` element in the top-level document.
   > Monaco's CSS contains `@font-face` declarations (for Codicon icons), and `@font-face` rules inside
   > `adoptedStyleSheets` or Shadow DOM stylesheets are [ignored by browsers](https://github.com/WICG/construct-stylesheets/issues/119).
   > If you skip the `<link>`, editor icons will not render correctly.

   If you are building a Web Component and still want to adopt the stylesheet for scoped styles, keep the
   `<link>` in the host document **and** optionally adopt for the shadow root:
   ```js
   import editorStyle from '@node-projects/monaco-editor-esm/min/vs/editor/editor.main.css' with { type: 'css' };
   shadowRoot.adoptedStyleSheets.push(editorStyle);
   ```

### CSS Import Caveats
- The ESM modules may contain `import './file.css'` statements, which are not yet supported natively in browsers or Node.js. Most bundlers can handle these imports with the appropriate loader/plugin.
- If you use the modules directly in the browser, you must include the CSS manually as shown above.
- For more background, see the [discussion on ESM and CSS loading](https://github.com/microsoft/monaco-editor/issues/886#issuecomment-4248483831).

### Limitations
- Some features may require additional configuration for web workers. See Monaco Editor documentation for details.
- The ESM build is not guaranteed to be 100% compatible with all Monaco Editor plugins or extensions.

### Updating to a New Monaco Editor Release

When a new version of Monaco Editor is released, update this package by running the `update-monaco` GitHub Actions workflow:

1. Go to the **Actions** tab in your GitHub repository.
2. Select the **Update Monaco Editor** workflow.
3. Click **Run workflow** to trigger the update process.

This workflow will:
- Install the latest Monaco Editor version
- Update the package version
- Rebuild the ESM and CSS outputs
- Commit, tag, and (if configured) create a GitHub release for the new version

After the workflow completes, verify the changes and publish the package if needed.

### License
MIT
