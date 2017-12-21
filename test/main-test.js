const Application = require('spectron').Application
const assert = require('assert')
const path = require('path')

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')

var cfg = {
  path: electronPath,
  args: [path.join(__dirname, '..', 'src', 'main.js')]
}

const delay = time => new Promise(resolve => setTimeout(resolve, time));

var app = new Application(cfg)
async function runTests() {
  try {
    await app.start()
    const isVisible = await app.browserWindow.isVisible()
    assert.equal(isVisible, true, 'Window is visible')
  
    const title = await app.client.getTitle()
    assert.equal(title, 'bitcoin debug window', 'Verify Title')

    const logs = await app.client.getRenderProcessLogs();
    const errors = logs.filter(log => {
      console.log(log.message);
      console.log(log.source);
      console.log(log.level);
      return log.level == "ERROR"
    });
    assert.equal(errors.length, 0, 'no render logs');

    const info = await app.client.element('[data-ref="#info"]')
    let infcls = await app.client.elementIdAttribute(info.value.ELEMENT, 'className')
    assert.equal(infcls.value, 'tab active', 'Information tab active');

    await delay(500)
    const version = await app.client.elements('[class="value"]')
    const versiontext = await app.client.elementIdText(version.value[0].ELEMENT)

    assert.ok(versiontext.value.length > 0, 'retrieving values')

    const consoletab = await app.client.element('[data-ref="#console"]')
    await app.client.elementIdClick(consoletab.value.ELEMENT)
    const concls = await app.client.elementIdAttribute(consoletab.value.ELEMENT, 'className')
    assert.equal(concls.value, 'tab active', 'Console tab active');

    infcls = await app.client.elementIdAttribute(info.value.ELEMENT, 'className')
    assert.equal(infcls.value, 'tab', 'Information tab inactive'); // tabs loaded and working


    console.log('All tests passed')
    app.stop()

  } catch(error) {
    console.error('Test failed', error.message)
    app.stop()
  }
}
runTests()
