import * as doctor from "@fe-doctor/core";
import * as path from "path";
import { strict as assert } from "assert";
import * as vscode from "vscode";
export const getDocumentInfo = ({}) => {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace;
  assert.ok(workspace.workspaceFolders?.length === 1, "invalid workspace");
  assert.ok(!!editor, "invalid editor.");
  const { document } = editor;
  const folder = workspace.workspaceFolders[0];
  const rootPath = folder.uri.path;
  const projectName = folder.name;
  const fullFilename = document.fileName;
  const relativePath = path.relative(rootPath, fullFilename);
  const filename = path.basename(fullFilename);
  const programFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    relativePath,
    filename
  );
  const nodeList = doctor.loadNodeListByFile(programFile);
  const sourceFile = programFile.ast;
  return {
    editor,
    document,
    nodeList,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
    programFile,
  };
};
