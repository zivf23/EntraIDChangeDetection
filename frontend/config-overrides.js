// ===================================================================
// FILENAME: frontend/config-overrides.js
// PURPOSE: זהו הקובץ שמתקן את בעיית העיצוב של עורך ה-Diff.
//          הוא משכתב את הגדרות ה-Webpack של הפרויקט (בלי לעשות 'eject')
//          כדי לטעון נכון את כל קבצי העזר של Monaco Editor.
// ===================================================================
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config, env) {
  if (!config.plugins) {
    config.plugins = [];
  }
  
  // Add Monaco Editor webpack plugin with comprehensive configuration
  config.plugins.push(
    new MonacoWebpackPlugin({
      // Include all necessary languages and features
      languages: ['json', 'javascript', 'typescript', 'html', 'css', 'markdown'],
      features: [
        'bracketMatching',
        'caretOperations',
        'clipboard',
        'codeAction',
        'codelens',
        'colorDetector',
        'comment',
        'contextmenu',
        'cursorUndo',
        'find',
        'folding',
        'fontZoom',
        'format',
        'hover',
        'iPadShowKeyboard',
        'inPlaceReplace',
        'inspectTokens',
        'linesOperations',
        'links',
        'parameterHints',
        'quickCommand',
        'quickOutline',
        'referenceSearch',
        'rename',
        'smartSelect',
        'snippets',
        'suggest',
        'wordHighlighter',
        'wordOperations',
        'wordPartOperations'
      ],
      // Ensure proper asset handling
      filename: 'static/js/[name].worker.js',
      publicPath: '/static/js/'
    })
  );

  // Ensure proper handling of Monaco Editor assets
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false
  };

  return config;
};