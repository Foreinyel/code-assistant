// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as extract from "./extract";
import * as clean from "./clean";
import * as generate from "./generate";
import * as mark from "./mark";
import { runCommand } from "./common";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log(
  //   'Congratulations, your extension "code-assistant" is now active!'
  // );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.statements.toCurrentModule",
    runCommand(extract.statementsToCurrentModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.statement.toTargetModule",
    runCommand(extract.toTargetModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.statement.toNewModule",
    runCommand(extract.toNewModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.elements.toComponent",
    runCommand(extract.toComponent)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.element-with-specified-attributes.toComponent",
    runCommand(extract.elementWithSpecifiedAttributesToComponent)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.expression.toCurrentModule",
    runCommand(extract.expressionToCurrentModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.constant.toCurrentModule",
    runCommand(extract.constantToCurrentModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.expression.toCurrentBlock",
    runCommand(extract.expressionToCurrentBlock)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.elements.toCurrentBlock",
    runCommand(extract.elementsToCurrentBlock)
  );

  vscode.commands.registerCommand(
    "jvs-code-assistant.clean.reorderGlobalStatements",
    runCommand(clean.reorderGlobalStatements)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.clean.removeUnusedCodeInModule",
    runCommand(clean.removeUnusedCodeInModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.clean.renameIdentifierInModule",
    runCommand(clean.renameIdentifierInModule)
  );

  vscode.commands.registerCommand(
    "jvs-code-assistant.generate.newFunctionComponentInFolder",
    runCommand(generate.newFunctionComponentInFolder)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.generate.newFunctionComponentInModule",
    runCommand(generate.newFunctionComponentInModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.generate.newEnumInModule",
    runCommand(generate.newEnumInModule)
  );

  try {
    vscode.workspace.onDidChangeTextDocument((ev) => processActiveFile(ev.document));
    vscode.window.onDidChangeActiveTextEditor((ev) => processActiveFile(ev?.document));
    processActiveFile(vscode.window.activeTextEditor?.document);
  } catch {}
}

// this method is called when your extension is deactivated
export function deactivate() {}

const processActiveFile = async (document: vscode.TextDocument | undefined) => {
  try {
    if (document) {
      // await mark.markDeadCode(document);
    }
  } catch (err) {
    vscode.window.showErrorMessage((err as any).message);
  }
};
