import fetch from 'node-fetch';
import * as vscode from 'vscode';

export const is_login = async () => {
    
    const config = vscode.workspace.getConfiguration('nethammersession');

    const request = await fetch("http://23.105.226.161:9090/is_login", {
        method: "POST",
        body: JSON.stringify({
            "token": config.get("token"),
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

    if(requestData?.success) {
        return true;
    }else if(requestData?.error) {
        return false;
    }else {
        return false;
    }

} 