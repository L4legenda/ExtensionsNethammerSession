// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getUri } from "./utilities/getUri";

class ColorViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'nethammer-session-view';
	private _view?: vscode.WebviewView;
	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const toolkitUri = getUri(webview, this._extensionUri, [
			"node_modules",
			"@vscode",
			"webview-ui-toolkit",
			"dist",
			"toolkit.js",
		  ]);
		  const mainUri = getUri(webview, this._extensionUri, ["webview-ui", "main.js"]);
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${mainUri}"></script>
          <title>Hello World</title>
		</head>
		<body>
			<vscode-text-area resize="none" style='width: 100%;'></vscode-text-area>
          	<vscode-button>Закрыть сессию</vscode-button>
		</body>
		</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {


	console.log('Congratulations, your extension "nethammer-session" is now active!');


	let loginCommand = vscode.commands.registerCommand('nethammer-session.login', async () => {
		let login = await vscode.window.showInputBox({ placeHolder: 'login' });
		let password = await vscode.window.showInputBox({ placeHolder: 'password' });



		// vscode.window.showInformationMessage('Login' + what);
	});

	const provider = new ColorViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ColorViewProvider.viewType, provider));

	context.subscriptions.push(loginCommand);


	
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
