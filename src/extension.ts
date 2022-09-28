// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as extract from "./extract";
import * as clean from "./clean";
import * as generate from "./generate";
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
    "jvs-code-assistant.extract.toCurrentModule",
    runCommand(extract.toCurrentModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.toTargetModule",
    runCommand(extract.toTargetModule)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.extract.toComponent",
    runCommand(extract.toComponent)
  );

  vscode.commands.registerCommand(
    "jvs-code-assistant.clean.sortGlobalStatementsInModule",
    runCommand(clean.sortGlobalStatementsInModule)
  );

  vscode.commands.registerCommand(
    "jvs-code-assistant.generate.newFunctionComponentInFolder",
    runCommand(generate.newFunctionComponentInFolder)
  );
  vscode.commands.registerCommand(
    "jvs-code-assistant.generate.newFunctionComponentInModule",
    runCommand(generate.newFunctionComponentInModule)
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
