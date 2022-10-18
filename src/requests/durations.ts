import fetch from 'node-fetch';
import * as vscode from 'vscode';

export const wakatime_durations = async () => {
    
    const config = vscode.workspace.getConfiguration('nethammersession');

    const request = await fetch("http://23.105.226.161:9090/durations", {
        method: "GET",
        headers: {
            "Authorization": config.get("token_wakatime")!,
        },
    });

    const requestData = await request.json();

    if(requestData?.data){
        vscode.window.showInformationMessage(JSON.stringify(requestData));
    }else if(requestData?.error) {
        vscode.window.showErrorMessage(requestData);
    }

    return requestData;
};