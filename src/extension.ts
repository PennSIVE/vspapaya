// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as glob from 'glob';
import * as path from 'path';
const hbs = require("handlebars");
// const url = require('url');
// const fs = vscode.workspace.fs;
const util = require('util');
const readFileContent = util.promisify(require('fs').readFile);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "vspapaya" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let niftiWindow = vscode.commands.registerCommand('vspapaya.viewNifti', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from VSpapaya!');

		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
			const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
			glob(rootPath + '/**/*.nii.gz', (err, res) => {
				const panel = vscode.window.createWebviewPanel(
					'papayaViewer',
					'Papaya Viewer',
					vscode.ViewColumn.One,
					{
						// Enable scripts in the webview
						enableScripts: true
						// localResourceRoots: [vscode.Uri.file(context.extensionPath)]
					}
				);

				// wrap in vscode.Uri.file?
				const cssFile = path.join(context.extensionPath, 'node_modules', 'tailwindcss', 'dist', 'tailwind.min.css');
				const papayaCssFile = path.join(context.extensionPath, 'Papaya', 'build', 'papaya.css');
				const papayaJsFile = path.join(context.extensionPath, 'Papaya', 'build', 'papaya.js');
				const htmlFile = path.join(context.extensionPath, 'templates', 'index.hbs');

				const html = readFileContent(htmlFile);
				const css = readFileContent(cssFile);
				const papayaCss = readFileContent(papayaCssFile);
				const papayaJs = readFileContent(papayaJsFile);
				html.then((a: Uint8Array) => {
					const template = hbs.compile(Utf8ArrayToStr(a));
					css.then((b: Uint8Array) => {
						const cssString = Utf8ArrayToStr(b);
						papayaCss.then((c: Uint8Array) => {
							const papayaCssString = Utf8ArrayToStr(c);
							papayaJs.then((d: Uint8Array) => {
								const papayaJsString = Utf8ArrayToStr(d);
								panel.webview.html = template({
									css: cssString,
									papayaCss: papayaCssString,
									papayaJs: papayaJsString,
									files: JSON.stringify(res.map(f => path.relative(rootPath, f)))
								});
							});
						});
					});
				});

				panel.webview.onDidReceiveMessage(
					message => {
						const fn = rootPath + vscode.Uri.parse(message.url).path;
						const contents = readFileContent(fn);
						contents.then((x: any) => panel.webview.postMessage(x));
					},
					undefined,
					context.subscriptions
				);
				

			});

		} else {
			vscode.window.showInformationMessage('Please open a folder first');
		}

	});

	context.subscriptions.push(niftiWindow);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function Utf8ArrayToStr(array: Uint8Array) {
	var out, i, len, c;
	var char2, char3;

	out = "";
	len = array.length;
	i = 0;
	while (i < len) {
		c = array[i++];
		switch (c >> 4) {
			case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
				// 0xxxxxxx
				out += String.fromCharCode(c);
				break;
			case 12: case 13:
				// 110x xxxx   10xx xxxx
				char2 = array[i++];
				out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
				break;
			case 14:
				// 1110 xxxx  10xx xxxx  10xx xxxx
				char2 = array[i++];
				char3 = array[i++];
				out += String.fromCharCode(((c & 0x0F) << 12) |
					((char2 & 0x3F) << 6) |
					((char3 & 0x3F) << 0));
				break;
		}
	}

	return out;
}