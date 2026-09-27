import * as vscode from 'vscode';
import { MdflowPanel } from './panels/MdflowPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('Mdflow extension is now active!');

  const openCommand = vscode.commands.registerCommand('mdflow.openView', (uri?: vscode.Uri) => {
    MdflowPanel.render(context.extensionUri, uri);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate() {}
