# btc-debug

## Description
A clone of bitcoin-qt debug window for use with local or remote daemon, with enhnced console and other minor differences.

## Getting started
### Installation
clone repo

`npm install`

`npm install riot -g`

### Usage
The bitcoin RPC server requires a username and password for access, this is set up in the 
`bitcoin.conf` file, see [bitcoin core documentation](https://en.bitcoin.it/wiki/Running_Bitcoin#Bitcoin.conf_Configuration_File) for further details

The default location for this app is `HOME/.bitcoin/bitcoin.conf`

This can be overridden from the command line with the -config flag ex. `-config=/DIRECTORY/FILE.conf` with the file containing the values of `rpcuser` and `rpcpassword` in the format of the standard `bitcoin.conf` file.

### Command line options
| Command | Description                         |
| ------- | -----------                         |
| -config | path to config file described above |
| -host   | default 127.0.0.1                   |
| -port   | default 8332(Main Net)              |

The `-port` option lets you run on test net by setting to 18332

The `-host` and `-config` options allow for remote connection

## Running

`npm start [-- [-config -port -host]]` 

Also, launch configurations are provided for vscode users

## Console

### Features
#### Command Input
* A multi line code editor for entering commands rather than a single line console input
* Code completion for all RPC commands
* Full help text when hovering a command
* Argument hints based on command entered
* Execute via keyboard, menu, command pallet or codelens
* File load and save

#### Result Display
* Folding of results for better focus on results of interest
* Mini Map for easy navigation
* Insert from results to the command editor
* File load and save

### Keyboard Shortcuts
| Command | Description                         |
| ------- | -----------                         |
| F5      | execute command at command editor cursor postion |
| CtrlCmd+i | Insert from result cursor position to command editior selection, this allows easy reuse of results as command arguments

### Entering Commands

A single command may be multi line.  Leave whitespace for argument separation, JSON objects are parsed as a single argument.

example:
```
createmultisig 2
[
    "key1",
    "key2"
]
```
## Packaging
install [electron-packager](https://www.npmjs.com/package/electron-packager)

and run `electron-packager .`

this will create an executable for your operating system

## Bitcoin Forks
This console should work with bitcoin forks

ex. To run with litecoin testnet `npm start -- -port=19332 -config=/home/yourhome/.litecoin/litecoin.conf`

## Screenshot

![screenshot.png](https://github.com/rsbondi/btc-debug/blob/master/screenshot.png "What it looks like")
