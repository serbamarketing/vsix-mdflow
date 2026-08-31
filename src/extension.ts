import * as vscode from 'vscode';
import { MdflowPanel } from './panels/MdflowPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('Mdflow extension is now active!');

  const openCommand = vscode.commands.registerCommand('mdflow.openView', () => {
    MdflowPanel.render(context.extensionUri);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate() {}
