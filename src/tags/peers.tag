<node-peers>
  <div class="peer-wrapper">
    <div class='col peers'>
      <div>
        <table>
          <thead>
            <tr>
              <th>NodeId</th>
              <th>Node/Service</th>
              <th>User Agent</th>
              <th>Ping</th>
            </tr>
          </thead>
          <tbody>
            <tr each={ peer in peers } class="{ parent.selectedPeer==peer.id ? 'selected-peer': 'peer' }" onclick={ showPeerDetail }>
              <td>{ peer.id }</td>
              <td>{ peer.addr }</td>
              <td>{ peer.subver }</td>
              <td>{ peer.pingtime }</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div show={ selectedPeer > -1 } class="col peer-detail">
      <div>
        <div class="label">Whitelisted</div>
        <div class="value">{ whitelist }</div>
      </div>
      <div>
        <div class="label">Direction</div>
        <div class="value">{ inbound }</div>
      </div>
      <div>
        <div class="label">Version</div>
        <div class="value">{ version }</div>
      </div>
      <div>
        <div class="label">User Agent</div>
        <div class="value">{ agent }</div>
      </div>
      <div>
        <div class="label">Services</div>
        <div class="value">
          <div each={ s in services }>{ s }</div></div>
      </div>
      <div>
        <div class="label">Starting Block</div>
        <div class="value">{ startingheight }</div>
      </div>
      <div>
        <div class="label">Synced Headers</div>
        <div class="value">{ synced_headers }</div>
      </div>
      <div>
        <div class="label">Synced Blocks</div>
        <div class="value">{ synced_blocks }</div>
      </div>
      <div>
        <div class="label">Ban Score</div>
        <div class="value">{ banscore }</div>
      </div>
      <div>
        <div class="label">Connection Time</div>
        <div class="value">{ conntime }</div>
      </div>
    
    </div>
  </div>
  <h2 class="newrow">Banned Peers</h2>
  <table>
    <thead>
      <tr>
        <th>IP/Netmask</th>
        <th>Banned Until</th>
      </tr>
    </thead>
    <tbody>
      <tr each={ peer in banned }>
        <td>{ peer.address }</td>
        <td>{ (new Date(peer.banned_until*1000)).toISOString() }</td>
      </tr>
    </tbody>
  </table>

  <script>
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

    showPeerDetail(e) {
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
    }

  </script>
</node-peers>