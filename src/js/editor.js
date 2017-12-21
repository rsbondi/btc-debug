// require node modules before loader.js comes in
var path = require('path');
function uriFromPath(_path) {
  var pathName = path.resolve(_path).replace(/\\/g, '/');
  if (pathName.length > 0 && pathName.charAt(0) !== '/') {
    pathName = '/' + pathName;
  }
  return encodeURI('file://' + pathName);
}
amdRequire.config({
  baseUrl: uriFromPath(path.join(__dirname, '../../node_modules/monaco-editor/min'))
});
// workaround monaco-css not understanding the environment
self.module = undefined;
// workaround monaco-typescript not understanding the environment
self.process.browser = true;

const init = function() {
  monaco.languages.registerCompletionItemProvider('bitcoin-rpc', {
    provideCompletionItems: function (model, position) {
      return window.helpers.reduce((o, c) => {
        o.push({
          label: c.command,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: c.help
        })
        return o
      },[])
    }
  });  

  monaco.languages.registerHoverProvider('bitcoin-rpc', {
    provideHover: function (model, position) {
      const word = model.getWordAtPosition(position).word
      if(word && ~window.helpers.map(h => h.command).indexOf(word)) {
        return window.postRPC({ method: 'help', params: [word] }).then(response => {
          return {
            contents: [
              `**${word}**`,
              { language: 'text', value: response.result }
            ]
          }
        })
      }
    }
  });

  monaco.languages.registerSignatureHelpProvider('bitcoin-rpc', {
    provideSignatureHelp: function (model, position) {
      const word = model.getWordAtPosition({ lineNumber: position.lineNumber, column: 1 }).word
      if(word) return window.postRPC({ method: 'help', params: [word] }).then(response => { 
        let lines = response.result.split("\n")
        let args = false, desc = false
        const obj = lines.reduce((o, c, i) => {
          if (!c && args) {
            args = false
          }
          else if (c.match(/Arguments/)) args = true
          else if (args) {
            let ltokens = c.split(/\s+/)
            if (ltokens[0].match(/[0-9]+\./))
              o.params[ltokens[1].replace(/"/g, '')] = ltokens.slice(2).join(' ')
          }
          else if (i > 1 && !c) desc = true
          else if (i > 0 && !desc) o.desc += c + "\n"
          return o
        }, { params: {}, desc: '' })
        obj.desc = obj.desc.replace(/(^\n|\n$)/, '')
        const index = model.getValue().slice(0, position.column-1).split(' ').length - 2
        const params = Object.keys(obj.params).map(k => { return {label: k, documentation: obj.params[k]}})
        if(index >-1 && index < params.length)
          return {
            activeSignature: 0,
            activeParameter: index,
            signatures: [
              {
                label: lines[0],
                parameters: params
              }
            ]
          }
        else return {}
      })
      else return {}

    },
    signatureHelpTriggerCharacters:[' ']
  })

}

const appendToEditor = function(editor, text) {
    const lineCount = editor.getModel().getLineCount();
    const lastLineLength = editor.getModel().getLineMaxColumn(lineCount);
    
    const range = new monaco.Range(lineCount,lastLineLength,lineCount,lastLineLength);
    
    editor.updateOptions({readOnly: false})
    editor.executeEdits('', [
        { range: range, text: text }
    ])
    editor.updateOptions({readOnly: true})
    editor.setSelection(new monaco.Range(1,1,1,1))
    editor.revealPosition({ lineNumber: editor.getModel().getLineCount(), column: 0 })

}

module.exports = {
  require: amdRequire,
  init: init,
  appendToEditor: appendToEditor,
  commandConfig: {
    value: '',
    language: 'bitcoin-rpc',
    folding: true,
    fontSize: '10px',
    glyphMargin: false,
    lineNumbers: false,
    minimap: { enabled: false },
    scrollbar: { vertical: 'hidden' }
  },
  displayConfig: {
    value: '',
    language: 'javascript',
    readOnly: true,
    folding: true,
    lineNumbers: false,
    fontSize: '10px'
  }
}
