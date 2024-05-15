"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const net = require("net");
const child_process_1 = require("child_process");
let client;
let debugChannel = null;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const serverHome = context.asAbsolutePath("fat.jar");
    const javaHome = "java";
    let prc = (0, child_process_1.spawn)(javaHome, ['-jar', serverHome]);
    prc.stdout.on('data', function (data) {
        let portAsStringWithBrackets = data.toString();
        let closingBracketPos = portAsStringWithBrackets.indexOf(">");
        let portNumber = parseInt(portAsStringWithBrackets.substring(1, closingBracketPos));
        if (Number.isNaN(portNumber)) {
            return;
        }
        let connectionInfo = {
            port: portNumber,
        };
        //console.log("Engineer gaming");
        let serverOptions = () => {
            let socket = net.connect(connectionInfo);
            let result = {
                writer: socket,
                reader: socket
            };
            return Promise.resolve(result);
        };
        if (debugChannel == null) {
            debugChannel = vscode_1.window.createOutputChannel("LibSL language server");
        }
        // Options to control the language client
        let clientOptions = {
            // Register the server for LibSL files
            documentSelector: [{ scheme: 'file', language: 'libsl' }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
            },
            outputChannel: debugChannel,
        };
        // Create the language client and start the client.
        client = new node_1.LanguageClient('libslls', 'LibSL Language Server', serverOptions, clientOptions);
        let item = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, Number.MIN_VALUE);
        item.text = 'Starting LibSL LSP...';
        toggleItem(vscode_1.window.activeTextEditor, item);
        client.start();
        //const debugMode: Boolean = workspace.getConfiguration("prob").get("debugMode")
        const debugMode = true;
        if (!debugMode) {
            debugChannel.hide();
        }
        else {
            debugChannel.show();
        }
        vscode_1.window.onDidOpenTerminal(() => {
            showDebugMessages(debugChannel);
        });
    });
}
exports.activate = activate;
function showDebugMessages(debugChannel) {
    //const debugMode: Boolean = workspace.getConfiguration("prob").get("debugMode")
    const debugMode = true;
    if (debugMode) {
        debugChannel.show();
    }
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
function toggleItem(editor, item) {
    if (editor && editor.document &&
        (editor.document.languageId === "libsl")) {
        item.show();
    }
    else {
        item.hide();
    }
}
//# sourceMappingURL=extension.js.map