riot.tag2('node-info', '<h3>General</h3> <div class="label">Client Version</div> <div class="value">{version}</div> <div class="label label2">User Agent</div> <div class="value">{subversion}</div> <h3>Network</h3> <div class="label">Name</div> <div class="value">{chain}</div> <div class="label">Connections</div> <div class="value">{netconnections}</div> <h3>Blockchain</h3> <div class="label">Number of Blocks </div> <div class="value">{blocks}</div> <div class="label">Last Block Time</div> <div class="value">{blocktime}</div> <h3>Mempool</h3> <div class="label">Number of transaction </div> <div class="value">{memnum}</div> <div class="label">Memory Usage</div> <div id="mem-usage" class="value">{memusage}</div>', '', '', function(opts) {
      const self=this
      emitter.on('updateobj', v => {
          if(v.blocktime) v.blocktime = (new Date(v.blocktime * 1000)).toString()
          if(v.version) {
            const myver = v.version
            const major = Math.floor(myver / MAJOR)
            const minor = Math.floor((myver - major * MAJOR) / MINOR)
            const rev = Math.floor((myver - major * MAJOR - minor * MINOR) / REV)
            const build = Math.floor((myver - major * MAJOR - minor * MINOR - rev * REV) / BUILD)

            v.version = `v${major}.${minor}.${rev}${build ? '.' + build : ''}`
          }
          self.updateObj(v)
      })
});
riot.tag2('node-net', '<div> <label>Sent/sec</label> <span>{sent}</span> </div> <div> <label>Received/sec</label> <span>{received}</span> </div>', '', '', function(opts) {
      const self = this
      emitter.on('net-stat', v => self.updateObj(v))
});
riot.tag2('node-peers', '<div class="peer-wrapper"> <div class="col peers"> <div> <table> <thead> <tr> <th>NodeId</th> <th>Node/Service</th> <th>User Agent</th> <th>Ping</th> </tr> </thead> <tbody> <tr each="{peer in peers}" class="{parent.selectedPeer==peer.id ? \'selected-peer\': \'peer\'}" onclick="{showPeerDetail}"> <td>{peer.id}</td> <td>{peer.addr}</td> <td>{peer.subver}</td> <td>{peer.pingtime}</td> </tr> </tbody> </table> </div> </div> <div show="{selectedPeer > -1}" class="col peer-detail"> <div> <div class="label">Whitelisted</div> <div class="value">{whitelist}</div> </div> <div> <div class="label">Direction</div> <div class="value">{inbound}</div> </div> <div> <div class="label">Version</div> <div class="value">{version}</div> </div> <div> <div class="label">User Agent</div> <div class="value">{agent}</div> </div> <div> <div class="label">Services</div> <div class="value"> <div each="{s in services}">{s}</div></div> </div> <div> <div class="label">Starting Block</div> <div class="value">{startingheight}</div> </div> <div> <div class="label">Synced Headers</div> <div class="value">{synced_headers}</div> </div> <div> <div class="label">Synced Blocks</div> <div class="value">{synced_blocks}</div> </div> <div> <div class="label">Ban Score</div> <div class="value">{banscore}</div> </div> <div> <div class="label">Connection Time</div> <div class="value">{conntime}</div> </div> </div> </div> <h2 class="newrow">Banned Peers</h2> <table> <thead> <tr> <th>IP/Netmask</th> <th>Banned Until</th> </tr> </thead> <tbody> <tr each="{peer in banned}"> <td>{peer.address}</td> <td>{(new Date(peer.banned_until*1000)).toISOString()}</td> </tr> </tbody> </table>', '', '', function(opts) {
    const self = this
    const Services = {
        1: 'NODE_NETWORK',
        2: 'NODE_GETUTXO',
        4: 'NODE_BLOOM',
        8: 'NODE_WITNESS',
        16: 'NODE_XTHIN'
      }
    function NA(num) {
      return num == -1 ? 'N/A' : num
    }

    function HHMMSS(secs) {
      const seconds = Math.floor(secs)
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const sec = Math.floor(seconds % 60)
      return `${hours ? hours + 'h ' : ''}${mins ? mins + 'm ' : ''}${sec}s`
    }

    emitter.on('peer-detail', v => self.updateObj(v))
    emitter.on('peers', v => self.updateObj(v))
    emitter.on('banned', v => self.updateObj(v))

    this.showPeerDetail = function(e) {
      let peer = e.item.peer
      if (peer) {
        const s = parseInt(peer.services, 16)
        self.selectedPeer = peer.id
        emitter.trigger('peer-detail', {
          'whitelist': peer.whitelisted ? 'Yes' : 'No',
          'inbound': peer.inbound ? 'Inbound' : 'Outbound',
          'version': peer.version,
          'agent': peer.subver,
          'services': Object.keys(Services).reduce((o, c) => {
            if (s & c) o.push(Services[c])
            return o
          }, []) || ['None'],
          'startingheight': NA(peer.startingheight),
          'synced_headers': NA(peer.synced_headers),
          'synced_blocks': NA(peer.synced_blocks),
          'banscore': NA(peer.banscore),
          'conntime': HHMMSS((new Date().getTime()) / 1000 - peer.conntime)
        })
      }
    }.bind(this)

});