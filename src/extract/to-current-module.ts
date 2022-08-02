import * as vscode from "vscode";
import { loadNodeListByFile, ProgramFile } from "@fe-doctor/core";
import { strict as assert } from "assert";
import * as path from "path";

export const toCurrentModule = () => {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace;
  assert.ok(workspace.workspaceFolders?.length === 1, "invalid workspace");
  assert.ok(!!editor, "invalid editor.");
  const { document, selections } = editor;
  assert.ok(selections.length === 1 && !!document, "invalid selections");
  const folder = workspace.workspaceFolders[0];
  const rootPath = folder.uri.path;
  const projectName = folder.name;
  const fullFilename = document.fileName;
  const relativePath = path.relative(rootPath, fullFilename);
  const filename = path.basename(fullFilename);

  const programFile = new ProgramFile(
    projectName,
    rootPath,
    relativePath,
    filename
  );

  const nodeList = loadNodeListByFile(programFile);
  console.log(
    `🚀 ~ file: to-current-module.ts ~ line 28 ~ toCurrentModule ~ nodeList`,
    nodeList
  );
};
