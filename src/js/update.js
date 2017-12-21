module.exports = {
  updateObj: function(obj) {
    Object.keys(obj).forEach(k => this[k] = obj[k])
    this.update()
  }
}