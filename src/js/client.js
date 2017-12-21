
const argv = require('electron').remote.process.argv
let tabs = document.querySelectorAll('.tab')
const consoleCommand = document.querySelector('#console-command')
const consoleDisplay = document.querySelector('.console')
const netgraph = document.querySelector('#netgraph')
const graphref = document.querySelector('#graphref')
const peerlist = document.querySelector('#peerlist')
const SVG = 'http://www.w3.org/2000/svg'
let helpers = []
let netinfo = []
const BLOCK_INTERVAL = 1000*60 * .5
let graphindex = 0
const fs = require('fs')
const os = require('os')
let user, password, host, port
const createNS = document.createElementNS // riot breaks this so preserve
window.riot = require('riot')
document.createElementNS = createNS
window.emitter = require('riot-observable')()
const tags = require('./js/tags')
const editorModule = require('./js/editor')
riot.mixin(require('./js/update'))
riot.mount('*')
require('./js/network')  


const args = argv.reduce((o, c) => {
  const a = c.match(/^-([^=]+)=(.+)$/)
  if(a) o[a[1]] = a[2]
  return o
},{})

port = args.port || '8332'
host = args.host || '127.0.0.1'

const config = fs.readFileSync(args.config || `${os.homedir()}/.bitcoin/bitcoin.conf`, 'utf8');
config.split('\n').forEach(line => {
  let rpcuser = line.match(/^\s?rpcuser\s?=\s?([^#]+)$/)
  if (rpcuser) user = rpcuser[1]
  let rpcpass = line.match(/^\s?rpcpassword\s?=\s?([^#]+)$/)
  if (rpcpass) password = rpcpass[1]
})

document.querySelector('#clear-console').addEventListener('click', () => resultEditor.setValue(''))

for(let t=0; t<tabs.length;t++) {
  const tab = tabs[t]
  tab.addEventListener('click', (e) => {
    for (var t = 0; t < tabs.length; t++) {
      const tab = tabs[t]
      const content = document.querySelector(tab.dataset.ref)
      if (tab==e.target) {
        content.classList.add('active')
        tab.classList.add('active')
      } else {
        content.classList.remove('active')
        tab.classList.remove('active')
      }
    }
  })
}

const consoleTab = document.querySelector('div[data-ref="#console"]')
const getHelp = function() {
  if(!window.helpers)
    post({method: 'help'}).then(response => {
      window.helpers = response.result.split('\n').reduce((o, c, i) => {
        if(c && !c.indexOf('==')==0) {
          const pieces = c.split(' ')
          o.push({command: pieces[0], help: pieces.length>1 ? pieces.slice(1).join(' ') : ''})
        }
        return o
      }, [])
    })
  resultEditor.layout()
  commandEditor.layout()
  commandEditor.focus()

}
consoleTab.addEventListener('click', getHelp)

let consoleBuffer = []
let consoleBufferIndex = 0

const MAJOR = 1000000
const MINOR = 10000
const REV = 100
const BUILD = 1
async function getNetInfo() {
  const js = await post({
    method: "getnetworkinfo"
  })
  emitter.trigger('updateobj', { version: js.result.version, subversion: js.result.subversion})

}

async function getBlock() {
  const js = await post({
    method: "getblockchaininfo"
  })
  const block = await post({
    method: "getblock",
    params: [js.result.bestblockhash]
  })
  emitter.trigger('updateobj', { chain: js.result.chain, blocks: js.result.blocks, blocktime: block.result.time})
}

async function getMempool() {
  const pool = await post({
    method: "getmempoolinfo",
  })
  emitter.trigger('updateobj', {memusage: pool.result.bytes, memnum: pool.result.size})
}

async function getBanned() {
  let response = await post({ method: 'listbanned' })
  let tbody = ''
  peers = response.result
  emitter.trigger('banned', {banned: peers})
}

async function getPeerInfo() {
  let response = await post({ method: 'getpeerinfo'})
  peers = response.result
  let con = { in: 0, out: 0 }
  peers.forEach(peer => {
    if (peer.inbound) con.in++; else con.out++
  })      
  emitter.trigger('updateobj', { netconnections: `${con.in + con.out} (in: ${con.in} / out: ${con.out})` })
  emitter.trigger('peers', {peers: peers})
}

getNetInfo()
getBlock()
getMempool()
getPeerInfo()
getBanned()

function blockInt() {
  getBlock()
  getMempool()
  getPeerInfo()
  getBanned()
  setTimeout(blockInt, BLOCK_INTERVAL)
}
setTimeout(blockInt, BLOCK_INTERVAL)

function post(payload) {
  payload.jsonrpc = "1.0"
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", `http://${host}:${port}`, true);

    xhr.setRequestHeader("Content-type", "text/plain");
    xhr.setRequestHeader("Authorization", "Basic " + window.btoa(`${user}:${password}`));

    xhr.onload = function () {
      let resp = xhr.responseText;
      let js = JSON.parse(resp)
      resolve(js)
    };

    xhr.onerror = function () {
      reject(xhr.status)
    };

    xhr.send(JSON.stringify(payload))
  })
 
}
window.postRPC = post

// TODO: probably move all this to editor.js?
editorModule.require(['vs/editor/editor.main'], function () {
  monaco.languages.register({ id: 'bitcoin-rpc' });
  window.resultEditor = monaco.editor.create(consoleDisplay, editorModule.displayConfig);
  window.commandEditor = monaco.editor.create(consoleCommand, editorModule.commandConfig);
  window.addEventListener('resize', () => { resultEditor.layout(); commandEditor.layout();})
  window.commandEditor.onKeyUp(e => {
    consoleCommand.title = ''
    const val = window.commandEditor.getValue().replace(/[\n\r]+/,'')
    if (e.code == 'Enter') {
      let chunks = val.split(' ') // TODO: better parsing to account for varying json format
      const method = chunks[0]
      let params = []
      if(chunks.length > 1) {
          try {
              params = chunks.slice(1).map(c => {
                try {
                  return JSON.parse(c)
                } catch (e) {
                  return JSON.parse(`"${c}"`)
                }
              })
          } catch (err) {
            editorModule.appendToEditor(window.resultEditor, `Parse error: ${val} - ${err}\n\n`)
            window.commandEditor.setValue('')
            return
          }
      }
      consoleBuffer.unshift(val)
      post({ method: method, params: params }).then(response => {
        let content = `// ${method} ${params.join(' ')}\n`
          content += JSON.stringify(response, null, 2) + '\n\n'
          editorModule.appendToEditor(window.resultEditor, content)
      }).catch(err => console.log) 
      window.commandEditor.setValue('')
      consoleBufferIndex = 0
    } 
  })
  editorModule.init(helpers)
  window.resultEditor.addAction({
    id: 'action-id-insert-command',
    label: 'Add to command',
    keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I
    ],
    precondition: null,
    keybindingContext: null,
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.1,
    run: function(ed) {
        const word = ed.getModel().getWordAtPosition(ed.getPosition())
        if(word) {
            const cmd = window.commandEditor.getPosition()
            window.commandEditor.executeEdits('', [
                { range: new monaco.Range(cmd.lineNumber, cmd.column, cmd.lineNumber, cmd.column), text: word.word }
            ])
            const col = cmd.column+word.word.length
            window.commandEditor.setSelection(new monaco.Range(1,col,1,col))
            window.commandEditor.focus()
        }
        return null;
    }
});

});
