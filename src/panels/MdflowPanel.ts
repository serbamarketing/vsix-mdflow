import * as path from 'path';
import * as vscode from 'vscode';
import { getUri } from '../utils/getUri';
import { getNonce } from '../utils/getNonce';

export class MdflowPanel {
  public static currentPanel: MdflowPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _document: vscode.TextDocument | undefined;
  private _isReady = false;
  private _lastSentText: string | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document?: vscode.TextDocument) {
    this._panel = panel;
    this._document = document;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._setupEventListeners();
  }

  public static async render(extensionUri: vscode.Uri, uri?: vscode.Uri) {
    const targetUri =
      uri ??
      (vscode.window.activeTextEditor?.document.languageId === 'markdown'
        ? vscode.window.activeTextEditor.document.uri
        : undefined);

    let document: vscode.TextDocument | undefined;
    if (targetUri) {
      try {
        document = await vscode.workspace.openTextDocument(targetUri);
      } catch {
        document = undefined;
      }
    }

    if (MdflowPanel.currentPanel) {
      MdflowPanel.currentPanel._panel.reveal(MdflowPanel.currentPanel._panel.viewColumn);
      if (document) {
        MdflowPanel.currentPanel._setDocument(document);
      } else {
        // Jika tidak ada dokumen baru yang dikirim, refresh dokumen yang sedang ada
        MdflowPanel.currentPanel._updateWebviewContent(true);
      }
      return;
    }

    // Gunakan Beside jika ada active editor agar bisa split view, atau ViewColumn.One
    const targetColumn = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    const panel = vscode.window.createWebviewPanel(
      'mdflowView',
      'Mdflow View',
      targetColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui/dist')],
      }
    );
    MdflowPanel.currentPanel = new MdflowPanel(panel, extensionUri, document);
  }

  public dispose() {
    MdflowPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const stylesUri = getUri(webview, extensionUri, ['webview-ui', 'dist', 'assets', 'index.css']);
    const scriptUri = getUri(webview, extensionUri, ['webview-ui', 'dist', 'assets', 'index.js']);
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: http: data:; font-src ${webview.cspSource} https:;">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Mdflow</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;
        switch (command) {
          case 'hello':
            vscode.window.showInformationMessage(text);
            return;
          case 'ready':
            this._isReady = true;
            // Force pengiriman isi file saat webview siap
            this._updateWebviewContent(true);
            return;
          case 'save':
            this._applyEditFromWebview(text);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _setupEventListeners() {
    // Ketika isi text document berubah di VS Code (misal user mengetik di editor .md)
    vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (this._document && event.document.uri.toString() === this._document.uri.toString()) {
          this._document = event.document;
          this._updateWebviewContent();
        }
      },
      null,
      this._disposables
    );

    // Ketika user berpindah editor Markdown di VS Code
    vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        // Jangan ganti document jika editor undefined (misal user mengklik webview tab)
        if (editor?.document && editor.document.languageId === 'markdown') {
          if (!this._document || editor.document.uri.toString() !== this._document.uri.toString()) {
            this._setDocument(editor.document);
          }
        }
      },
      null,
      this._disposables
    );

    // Ketika tab webview kembali terlihat (visible setelah berpindah tab)
    this._panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible && this._document) {
          this._updateWebviewContent(true);
        }
      },
      null,
      this._disposables
    );
  }

  private _setDocument(document: vscode.TextDocument) {
    this._document = document;
    this._updateWebviewContent(true);
  }

  private _updateWebviewContent(force = false) {
    if (!this._isReady || !this._document) {
      return;
    }
    const text = this._document.getText();
    if (!force && text === this._lastSentText) {
      return;
    }
    this._lastSentText = text;
    this._panel.webview.postMessage({
      command: 'updateContent',
      text,
      fileName: path.basename(this._document.fileName),
    });
  }

  private async _applyEditFromWebview(text: string) {
    if (!this._document || typeof text !== 'string') {
      return;
    }
    if (text === this._document.getText()) {
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      this._document.positionAt(0),
      this._document.positionAt(this._document.getText().length)
    );
    edit.replace(this._document.uri, fullRange, text);
    this._lastSentText = text;
    const applied = await vscode.workspace.applyEdit(edit);
    if (applied) {
      try {
        await this._document.save();
      } catch (err) {
        console.error('Failed to save document:', err);
      }
    }
  }
}
