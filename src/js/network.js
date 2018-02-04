function drawLine(x, y, x2, y2, color, graph) {
  const line = document.createElementNS(SVG, 'line')
  line.setAttribute('x1', x)
  line.setAttribute('x2', x2)
  line.setAttribute('y1', y)
  line.setAttribute('y2', y2)
  line.setAttribute('stroke', color)
  line.setAttribute('stroke-width', 2)
  graph = graph || netgraph
  graph.appendChild(line)
  return line
}

function netRate(curr, prev, seconds) {
  return (curr - prev) / seconds
}
const netTab = document.querySelector('div[data-ref="#network"]')
const NET_INTERVAL_COUNT = 168
const width = 500
const height = 400
let ref = null, refsvgtext = null
const getNet = function () {
  post({ method: 'getnettotals' }).then(response => {
    netinfo.push({
      received: response.result.totalbytesrecv,
      sent: response.result.totalbytessent,
      time: response.result.timemillis,
      sentrate: 0, recrate: 0
    })
    if (netinfo.length > 1) {
      const current = netinfo[netinfo.length - 1]
      const previous = netinfo[netinfo.length - 2]
      const seconds = (current.time - previous.time) / 1000
      current.sentrate = netRate(current.sent, previous.sent, seconds)
      current.recrate = netRate(current.received, previous.received, seconds)
      const maxrate = netinfo.slice(netinfo.length > NET_INTERVAL_COUNT ? 1 : 0).reduce((max, inf) => { return Math.max(max, inf.recrate, inf.sentrate) }, 0)

      if(maxrate > 0) {
          const yscale = height / maxrate / 1.03 // leave some space at top of graph
          const yoffset = 0 - (yscale * height - height)
          drawLine(width + graphindex, height, width + graphindex, height - (current.sent - previous.sent) / seconds, 'red')
          drawLine(width - 1 + graphindex, height, width - 1 + graphindex, height - (current.received - previous.received) / seconds, 'green')
    
          if (ref) graphref.removeChild(ref)
          const maxtext = maxrate.toFixed(0)
          const refnum = Math.pow(10, maxtext.length - 1)
          const refh = height - height * (refnum / maxrate)
          ref = drawLine(0, refh, width, refh, 'lightgray', graphref)
    
          if (refsvgtext) graphref.removeChild(refsvgtext)
          refsvgtext = document.createElementNS(SVG, 'text')
          refsvgtext.innerHTML = refnum.toString()
          refsvgtext.setAttribute('x', width / 2 - refsvgtext.getBBox().width / 2)
          const abovebelow = refh < height * .4 ? 20 : -10
          refsvgtext.setAttribute('y', refh + abovebelow)
          refsvgtext.setAttribute('fill', 'lightgray')
          graphref.appendChild(refsvgtext)
    
          netgraph.setAttribute('transform', `translate(-${graphindex}, ${yoffset}) scale(1 ${yscale})`)
          graphindex += 3
          if (netinfo.length > NET_INTERVAL_COUNT) {
            netgraph.removeChild(netgraph.childNodes[1])
            netgraph.removeChild(netgraph.childNodes[0])
          }
    
          emitter.trigger('net-stat', {
            "sent": netRate(current.sent, previous.sent, seconds).toFixed(0),
            "received": netRate(current.received, previous.received, seconds).toFixed(0)
          })
          if (netinfo.length > NET_INTERVAL_COUNT) netinfo.shift()
        }
      }
  })
  setTimeout(getNet, 2000)
}

const startNet = function () {
  getNet()
  netTab.removeEventListener('click', startNet)
}
netTab.addEventListener('click', startNet)

module.exports = getNet