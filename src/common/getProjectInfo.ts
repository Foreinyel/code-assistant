import { strict as assert } from "assert";
import * as vscode from "vscode";
export const getProjectInfo = () => {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace;
  assert.ok(workspace.workspaceFolders?.length === 1, "invalid workspace");
  const folder = workspace.workspaceFolders[0];
  const rootPath = folder.uri.path;
  const projectName = folder.name;
  return { editor, rootPath, projectName };
};
