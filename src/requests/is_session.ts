import fetch from 'node-fetch';
import * as vscode from 'vscode';

export const is_session = async () => {
    
    const config = vscode.workspace.getConfiguration('nethammersession');

    const request = await fetch("http://127.0.0.1:8000/is_session", {
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

    if(requestData?.success?.code === 105) {
        return false;
    }else if(requestData?.success?.code === 110) {
        return true;
    }

} 