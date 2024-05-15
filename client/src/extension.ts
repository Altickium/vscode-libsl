/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window, TextEditor, StatusBarAlignment, OutputChannel } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo
} from 'vscode-languageclient/node';

import * as net from 'net';
import { spawn } from 'child_process';

let client: LanguageClient;
let debugChannel: OutputChannel = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

	const serverHome = context.asAbsolutePath("fat.jar")
	const javaHome: string = "java"

	let prc  = spawn(javaHome, ['-jar', serverHome])
	prc.stdout.on('data', function (data : Buffer) {
		let portAsStringWithBrackets : String = data.toString()
		let closingBracketPos : number = portAsStringWithBrackets.indexOf(">")
		let portNumber : number = parseInt(portAsStringWithBrackets.substring(1, closingBracketPos))
		if (Number.isNaN(portNumber)){
			return;
		}
		let connectionInfo = {
			port: portNumber,
		}

		//console.log("Engineer gaming");

		let serverOptions: ServerOptions = () => {
			let socket = net.connect(connectionInfo);
			let result: StreamInfo = {
				writer: socket,
				reader: socket
			};
			return Promise.resolve(result);
		}

		if (debugChannel == null) {
			debugChannel = window.createOutputChannel("LibSL language server")
		}

		// Options to control the language client
		let clientOptions: LanguageClientOptions = {
			// Register the server for LibSL files
			documentSelector: [{ scheme: 'file', language: 'libsl' }],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			},
			outputChannel: debugChannel,
		}

		// Create the language client and start the client.
		client = new LanguageClient('libslls', 'LibSL Language Server', serverOptions, clientOptions)

		let item = window.createStatusBarItem(StatusBarAlignment.Right, Number.MIN_VALUE);
		item.text = 'Starting LibSL LSP...';
		toggleItem(window.activeTextEditor, item);

		client.start();

		//const debugMode: Boolean = workspace.getConfiguration("prob").get("debugMode")
		const debugMode: Boolean = true
		if (!debugMode) {
			debugChannel.hide()
		} else {
			debugChannel.show()
		}

		window.onDidOpenTerminal(() => {
			showDebugMessages(debugChannel)
		})

	})
}

function showDebugMessages(debugChannel: OutputChannel) {
	//const debugMode: Boolean = workspace.getConfiguration("prob").get("debugMode")
	const debugMode: Boolean = true
	if (debugMode) {
		debugChannel.show()
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function toggleItem(editor: TextEditor, item) {
	if (editor && editor.document &&
		(editor.document.languageId === "libsl")) {
		item.show();
	} else {
		item.hide();
	}
}