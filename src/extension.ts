import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Function to convert a string to PascalCase
function toPascalCase(str: string): string {
    return str.replace(/(?:^|\s|-|_)(\w)/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/\s|_|-/g, '');
}

// Global variable to track if the automatic renaming is enabled
let autoRenameEnabled = false;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "auto-pascal-files" is now active!');

    // Create the status bar toggle button
    const toggleButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    toggleButton.command = 'auto-pascal-files.toggleAutoRename';
    toggleButton.text = '$(check) Auto Rename Files';
    toggleButton.tooltip = 'Toggle automatic renaming of new files to PascalCase';
    toggleButton.show();

    // Register the toggle command
    const toggleCommand = vscode.commands.registerCommand('auto-pascal-files.toggleAutoRename', () => {
        autoRenameEnabled = !autoRenameEnabled;
        toggleButton.text = autoRenameEnabled ? '$(check) Auto Rename Files (On)' : '$(x) Auto Rename Files (Off)';
        vscode.window.showInformationMessage(`Auto Rename Files is now ${autoRenameEnabled ? 'enabled' : 'disabled'}.`);
    });

    context.subscriptions.push(toggleCommand);
    context.subscriptions.push(toggleButton);

    // Create a file system watcher
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');

    // Watch for file creation
    watcher.onDidCreate(async (uri) => {
        if (autoRenameEnabled) {
            const filePath = uri.fsPath;
            const folderPath = path.dirname(filePath);
            const originalFileName = path.basename(filePath);
            const newFileName = toPascalCase(originalFileName);
            const newFilePath = path.join(folderPath, newFileName);

            // Rename the file only if the name has changed
            if (newFilePath !== filePath) {
                try {
                    await fs.promises.rename(filePath, newFilePath);
                    console.log(`Renamed: ${filePath} -> ${newFilePath}`);

                    // Close the old editor tab
                    const editors = vscode.window.visibleTextEditors;
                    const oldEditor = editors.find(editor => editor.document.fileName === filePath);
                    if (oldEditor) {
                        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    }

                    // Open the new file in the editor
                    const newDocument = await vscode.workspace.openTextDocument(newFilePath);
                    await vscode.window.showTextDocument(newDocument);
                } catch (error:any) {
                    vscode.window.showErrorMessage(`Failed to rename file ${originalFileName}: ${error.message}`);
                }
            }
        }
    });

    context.subscriptions.push(watcher);
}

// This method is called when your extension is deactivated
export function deactivate() {}
