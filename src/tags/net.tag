<node-net>
    <div>
      <label>Sent/sec</label>
      <span>{ sent }</span>
    </div>
    <div>
      <label>Received/sec</label>
      <span>{ received }</span>
    </div>
  
    <script>
      const self = this
      emitter.on('net-stat', v => self.updateObj(v))
    </script>
</node-net>