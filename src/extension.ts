// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getUri } from "./utilities/getUri";
import {is_session} from './requests/is_session';
import {is_login} from './requests/is_login';
import {open_session} from './requests/open_session';
import {close_session} from './requests/close_session';
import fetch from 'node-fetch';

class ColorViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'nethammer-session-view';
	public _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _subscriptions: any
	) { }

	 public async resolveWebviewView(
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

		webviewView.webview.html = this._getHtml(webviewView.webview);
		

		

		webviewView.webview.onDidReceiveMessage(
			async (message) => {
				if(message.command === 'open-session') {
					await open_session();
					this._view?.webview.postMessage({"visible": "close-session"});
				}else if(message.command === 'close-session') {
					await close_session(message.report);
					this._view?.webview.postMessage({"visible": "open-session"});
				}else if(message.command === 'is-session') {
					if(await is_login()){
						setTimeout(async ()=>{
							if(await is_session()){
								this._view?.webview.postMessage({"visible": "close-session"});
							} else {
								this._view?.webview.postMessage({"visible": "open-session"});
							}
						}, 300);
					}
				}
			},
			undefined,
			this._subscriptions
		);

		

	}

	private _getHtml(webview: vscode.Webview) {
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
		  <style>
		  	#section-open-session, #section-close-session {
				display: none;
			}
		  </style>
		</head>
		<body>
		  <div id="section-open-session">
          	<vscode-button style='width: 100%;' id="btn-open-session">Открыть сессию</vscode-button>
		  </div>
		  <div id="section-close-session">
			<vscode-text-area resize="none" style='width: 100%;' id="text-close-session"></vscode-text-area>
          	<vscode-button style='width: 100%;' id="btn-close-session">Закрыть сессию</vscode-button>
		  </div>
			<script>
			  	const vscode = acquireVsCodeApi();
			  	const btnOpenSession = document.getElementById('btn-open-session');
				const btnCloseSession = document.getElementById('btn-close-session');
				const textAreaCloseSession = document.getElementById('text-close-session');
				const sectionOpenSession = document.getElementById('section-open-session');
				const sectionCloseSession = document.getElementById('section-close-session');

				window.onload = () => {
					vscode.postMessage({
                        command: 'is-session'
                    })
				}

				btnOpenSession.onclick = function(){
					vscode.postMessage({
                        command: 'open-session'
                    })
				}

				btnCloseSession.onclick = function(){
					vscode.postMessage({
                        command: 'close-session',
						report: textAreaCloseSession.value,
                    })
				}


				window.addEventListener('message', event => {
					const message = event.data;
					if(message.visible == 'close-session'){
						sectionOpenSession.style.display = 'none';
						sectionCloseSession.style.display = 'block';
					}else if(message.visible == 'open-session'){
						sectionOpenSession.style.display = 'block';
						sectionCloseSession.style.display = 'none';
					}

				})
		  	</script>
		</body>
		</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {

	const provider = new ColorViewProvider(context.extensionUri, context.subscriptions);
	

	let loginCommand = vscode.commands.registerCommand('nethammer-session.login', async () => {
		const username = await vscode.window.showInputBox({ placeHolder: 'login' });
		const password = await vscode.window.showInputBox({ placeHolder: 'password', password: true });
		
		const config = vscode.workspace.getConfiguration('nethammersession');
	
		const request = await fetch("http://23.105.226.161:9090/login", {
			method: "POST",
			body: JSON.stringify({
				"username": username,
				"password": password
			}),
			headers: {
				"Content-Type": "application/json;charset=utf-8"
			},
		});
	
		const requestData = await request.json();
	
		if(requestData?.success?.message){
			vscode.window.showInformationMessage(requestData.success.message);
		}else if(requestData?.error?.message) {
			vscode.window.showErrorMessage(requestData.error.message);
		}
	
		if(requestData?.success?.token){
			config.update("token", requestData.success.token, true);
		}
		setTimeout(async () => {
			if(await is_session()){
				provider._view?.webview.postMessage({"visible": "close-session"});
			} else {
				provider._view?.webview.postMessage({"visible": "open-session"});
			}
		}, 200);
		
	} );

	let isSessionCommand = vscode.commands.registerCommand('nethammer-session.is_session', is_session);

	let testCommand = vscode.commands.registerCommand('nethammer-session.test', ()=>{
		vscode.window.showInformationMessage("Test");
		provider._view?.webview.postMessage({command: "ref"});
	});

	

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ColorViewProvider.viewType, provider));

	context.subscriptions.push(loginCommand);
	context.subscriptions.push(isSessionCommand);
	context.subscriptions.push(testCommand);
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
