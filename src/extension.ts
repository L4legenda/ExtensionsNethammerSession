// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getUri } from "./utilities/getUri";
import {is_session} from './requests/is_session';
import {is_login} from './requests/is_login';
import {open_session} from './requests/open_session';
import {close_session} from './requests/close_session';
import fetch from 'node-fetch';
import {wakatime_durations} from './requests/durations';
import {formatDate} from './utilities/formatDate';

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
				}else if(message.command === 'is-wakatime'){
					const config = vscode.workspace.getConfiguration('nethammersession');
					if(config.get("token_wakatime")){
						this._view?.webview.postMessage({"visible": 'generate-text-session'});
					}

				}else if(message.command === 'generate-text-session'){
					const response = await wakatime_durations();
					const objProject: any = {};
					if(response?.data){
						const data = response.data;
						for(const obj of data){
							const name = obj.project;
							if(objProject[name]){
								objProject[name].duration += obj.duration;
							}else {
								objProject[name] = {
									name: name,
									duration: obj.duration
								};
							}
						}
					}
					const reportStart = formatDate(response.start);
					const reportStop = formatDate(response.end);

					let reportProject = "";

					for(const key in objProject){
						const name = objProject[key].name;
						const duration = objProject[key].duration;
						const second = duration % 60;
						const minute = Math.floor(duration / 60) % 60;
						const hour = Math.floor((duration / 60) / 60);
						reportProject += ` - ${name}: ${hour}ч ${minute}м\n`;
					}

					let report = `Отчет \nC ${reportStart} по ${reportStop}\n\nПроекты:\n${reportProject}`;
					this._view?.webview.postMessage({"set-text-close-session": report});
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
		return /*html*/`<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${mainUri}"></script>
		  <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
		  
          <title>Hello World</title>
		  <style>
		  	#section-open-session, #section-close-session {
				display: none;
			}
			#btn-generate-text-session {
				display: none;
			}
		  </style>
		</head>
		<body>
		  <div id="section-open-session">
          	<vscode-button style='width: 100%;' id="btn-open-session">Открыть сессию</vscode-button>
		  </div>
		  <div id="section-close-session">
			<vscode-text-area resize="vertical" style='width: 100%;' id="text-close-session"></vscode-text-area>
          	<vscode-button style='width: 100%;' id="btn-close-session">Закрыть сессию</vscode-button>
			<vscode-button style='width: 100%; margin-top: 6px;' id="btn-generate-text-session">Сгенерировать отчет</vscode-button>
		  </div>
			<script>
			  	const vscode = acquireVsCodeApi();

			  	const btnOpenSession = document.getElementById('btn-open-session');
				const btnCloseSession = document.getElementById('btn-close-session');
				const btnGenerateTextSession = document.getElementById('btn-generate-text-session');

				const textAreaCloseSession = document.getElementById('text-close-session');

				const sectionOpenSession = document.getElementById('section-open-session');
				const sectionCloseSession = document.getElementById('section-close-session');
				

				window.onload = () => {
					vscode.postMessage({
                        command: 'is-session'
                    });
					vscode.postMessage({
                        command: 'is-wakatime'
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

				btnGenerateTextSession.onclick = function() {
					vscode.postMessage({
                        command: 'generate-text-session',
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
					}else if(message.visible == 'generate-text-session'){
						btnGenerateTextSession.style.display = 'flex';
					}else if(message['set-text-close-session']) {
						textAreaCloseSession.value = message['set-text-close-session'];
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

	let wakatimeCommand = vscode.commands.registerCommand('nethammer-session.token-wakatime', async () => {
		const token = await vscode.window.showInputBox({ placeHolder: 'API-token' });
		
		const config = vscode.workspace.getConfiguration('nethammersession');
	
		if(token){
			config.update("token_wakatime", token, true);
			vscode.window.showInformationMessage("Wakatime Token привязан к Nethammer");
		}
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
	context.subscriptions.push(wakatimeCommand);
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
