class ResultEditor {
  constructor(editor, command) {
    this.editor = editor
    this.commandEditor = command

    this.editor.addAction({
      id: 'action-result-clear-command',
      label: 'Clear Console',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_L
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.1,
      run: function (ed) {
        ed.setValue('')
        return null;
      }
    })

    this.addInsertAction()
  }

  addInsertAction() {
    const self = this
    this.editor.addAction({
      id: 'action-id-insert-command',
      label: 'Add to command',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.1,
      run: function (ed) {
        const line = ed.getModel().getLineContent(ed.getPosition().lineNumber)
        const tokens = monaco.editor.tokenize(line, 'javascript')[0]
        let t = tokens.length - 1
        for(; ~t; t--) {
            const token = tokens[t]
            if(token.offset <= ed.getPosition().column)
            break
        }
        const token = tokens[t]
        const word = line.slice(token.offset, t==tokens.length-1 ? line.length : tokens[t+1].offset)
        if (word) {
          const cmd = self.commandEditor.getPosition()
          self.commandEditor.executeEdits('', [
            { range: commandEditor.getSelection().cloneRange(), text: word }
          ])
          const col = cmd.column + word.length
          self.commandEditor.setSelection(new monaco.Range(cmd.lineNumber, col, cmd.lineNumber, col))
          self.commandEditor.focus()
        }
        return null;
      }
    });
  }
  
}

module.exports = {
  ResultEditor: ResultEditor
}