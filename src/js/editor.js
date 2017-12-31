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

const registerTokens = function(helpers) {
  monaco.languages.setMonarchTokensProvider('bitcoin-rpc', {
    tokenizer: {
      root: [
        [/([a-zA-Z_\$][\w\$]*)(\s*)(:?)/, {
          cases: { '$1@keywords': ['keyword', 'white', 'delimiter'], '@default': ['identifier', 'white', 'delimiter'] }
        }],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/"/, 'string', '@string."'],
        [/'/, 'string', '@string.\''],
        [/\d+\.\d*(@exponent)?/, 'number.float'],
        [/\.\d+(@exponent)?/, 'number.float'],
        [/\d+@exponent/, 'number.float'],
        [/0[xX][\da-fA-F]+/, 'number.hex'],
        [/0[0-7]+/, 'number.octal'],
        [/\d+/, 'number'],
        // [/[{}\[\]]/, '@brackets'],
        [/\[/, 'bracket.square.open'],
        [/\]/, 'bracket.square.close'],
        [/{/, 'bracket.curly.open'],
        [/}/, 'bracket.curly.close'],
        [/[ \t\r\n]+/, 'white'],
        [/[;,.]/, 'delimiter'],
        [/null/, 'null'],
    ],
     string: [
        [/[^\\"']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/["']/, {
          cases: {
            '$#==$S2': { token: 'string', next: '@pop' },
            '@default': 'string'
          }
        }]
      ],

    },
    keywords: helpers, //.concat('true', 'false', 'null',),
    exponent: /[eE][\-+]?[0-9]+/,
    escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
    brackets: [
      ['{', '}', 'bracket.curly'],
      ['[', ']', 'bracket.square']
    ],

  
  });

}

let getCommandBlock = function(model, position) {
    let line = position.lineNumber, wordAtPos, word = ''
    let block = model.getLineContent(line) ? [] : [{text:''}] // keep block alive on enter
    let tmpline
    while(tmpline = model.getLineContent(line)) {
        wordAtPos = model.getWordAtPosition({lineNumber: line, column: 1})
        block.unshift({text: model.getLineContent(line), offset: line - position.lineNumber})
        if(wordAtPos) word = wordAtPos.word
        if(word) {
            if(~window.helpers.map(w => w.command).indexOf(word)) break;
        }
        line--
        if(line===0) break
    }
    line = position.lineNumber + 1
    if(line > model.getLineCount()) return block
    while(tmpline = model.getLineContent(line)) {
        wordAtPos = model.getWordAtPosition({lineNumber: line, column: 1})
        if(wordAtPos && ~window.helpers.map(w => w.command).indexOf(wordAtPos.word)) break;
        tmpline = tmpline.replace(/^\s+/,'')
        if(!tmpline) break;
        block.push({text: model.getLineContent(line), offset: line - position.lineNumber})
        line++
        if(line > model.getLineCount()) break
    }
    return block
  }

const init = function(editor) {

  var execCommandId = editor.addCommand(0, function (wtf, line) { // don't knnow what first argument is???
    const pos = editor.getPosition()
    editor.setPosition({lineNumber: line, column: 1})
    editor.getAction('action-execute-command').run()
    editor.setPosition(pos)
  }, '');
  monaco.languages.registerCodeLensProvider('bitcoin-rpc', {
    provideCodeLenses: function (model, token) {
      return model.getLinesContent().reduce((o, c, i) => {
        let word = ''
        const lineNumber = i+1
        const wordAtPos = model.getWordAtPosition({ lineNumber: lineNumber, column: 1 })
        if (wordAtPos) word = wordAtPos.word
        if (word && ~window.helpers.map(h => h.command).indexOf(word)) 
          o.push(
            {
              range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber+1,
                endColumn: 1
              },
              id: "lens item"+lineNumber,
              command: {
                id: execCommandId,
                title: "Execute",
                arguments: [lineNumber]
              }
            }

          )
          return o
      },[])
    },
    resolveCodeLens: function (model, codeLens, token) {
      return codeLens;
    }
  });  
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
      let word = ''
      const wordAtPos = model.getWordAtPosition(position)
      if (wordAtPos) word = wordAtPos.word

      if(word && ~window.helpers.map(h => h.command).indexOf(word)) {
        return window.getHelpContent(word).then(response => {
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

  function getBlockIndex(block, col) {
    let index = -1
    let lineindex = block.reduce((o, c, i) => c.offset===0 ? i : o, -1)
    const tokens = monaco.editor.tokenize(block.map(b => b.text).join('\n'), 'bitcoin-rpc')
    let brackets = []
    for(let i=0; i<=lineindex; i++) {
        const token = tokens[i]
        token.forEach((t, ti) => {
            const prevToken =  ti===0 ? i===0 ? null : tokens[i-1][tokens[i-1].length-1] : token[ti-1] 
            switch(t.type) {
                case "white.bitcoin-rpc":
                    if(prevToken.type=="keyword.bitcoin-rpc") index=0
                    if(~["number.bitcoin-rpc", "string.bitcoin-rpc", "identifier.bitcoin-rpc"].indexOf(prevToken.type) && !brackets.length) index++
                    break
                case "bracket.square.open.bitcoin-rpc":
                    brackets.unshift('square')
                    break
                case "bracket.square.close.bitcoin-rpc":
                    brackets.shift('square')   
                    index++             
                    break
                
            }
        });
    }
    return index
  }

  monaco.languages.registerSignatureHelpProvider('bitcoin-rpc', {
    provideSignatureHelp: function (model, position) {
      const block = getCommandBlock(model, position)
      let word = ''
      if(block.length) word = block[0].text.split(' ')[0]
      if(word) return window.getHelpContent(word).then(response => { 
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
        const index = getBlockIndex(block, position.column)
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
    signatureHelpTriggerCharacters:[' ', '\t', '\n']
  })

}

module.exports = {
  require: amdRequire,
  registerTokens: registerTokens,
  init: init,
  getCommandBlock: getCommandBlock,
  commandConfig: {
    value: '',
    language: 'bitcoin-rpc',
    folding: true,
    fontSize: '10px',
    glyphMargin: false,
    lineNumbers: false,
    // theme: "vs-dark",
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
