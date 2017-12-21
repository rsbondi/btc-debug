<node-info>
    <h3>General</h3>
    <div class="label">Client Version</div>
    <div class="value">{ version }</div>
    
    <div class="label label2">User Agent</div>
    <div class="value">{ subversion }</div>
    
    <h3>Network</h3>
    <div class="label">Name</div>
    <div class="value">{ chain }</div>
    
    <div class="label">Connections</div>
    <div class="value">{ netconnections }</div>
    
    <h3>Blockchain</h3>
    <div class="label">Number of Blocks </div>
    <div class="value">{ blocks }</div>
    
    <div class="label">Last Block Time</div>
    <div class="value">{ blocktime }</div>
    
    <h3>Mempool</h3>
    <div class="label">Number of transaction </div>
    <div class="value">{ memnum }</div>
    
    <div class="label">Memory Usage</div>
    <div id="mem-usage" class="value">{ memusage }</div>

    <script>
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
    </script>
</node-info>