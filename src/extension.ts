// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as glob from 'glob';
import * as path from 'path';
const hbs = require("handlebars");
const ab2str = require('arraybuffer-to-string');
const util = require('util');
const readFileContent = util.promisify(require('fs').readFile);
// const fs = vscode.workspace.fs;

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
					const template = hbs.compile(ab2str(a));
					css.then((b: Uint8Array) => {
						papayaCss.then((c: Uint8Array) => {
							papayaJs.then((d: Uint8Array) => {
								panel.webview.html = template({
									css: ab2str(b),
									papayaCss: ab2str(c),
									papayaJs: ab2str(d),
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
