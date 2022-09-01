import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { strict as assert } from "assert";
import * as path from "path";

export const getSelectedCodeInfo = () => {
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

  const programFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    relativePath,
    filename
  );
  const nodeList = doctor.loadNodeListByFile(programFile);

  doctor.initNodeList(nodeList, [programFile]);

  const [selection] = selections;

  const sourceFile = programFile.ast;
  const lineStart = selection.start.line;
  const lineEnd = selection.end.line;
  const selectedText = document.getText(
    new vscode.Range(
      new vscode.Position(selection.start.line, 0),
      new vscode.Position(selection.end.line + 1, 0)
    )
  );
  // todo: validate if it's right code block, extracted code must be in one big block

  const nodeIdsInSelectedNodes: Set<number> = new Set();
  for (let node of nodeList) {
    if (
      typeof node?.line?.start === "number" &&
      typeof node?.line?.end === "number" &&
      node?.line?.start >= lineStart &&
      node?.line?.end <= lineEnd
    ) {
      nodeIdsInSelectedNodes.add(node.id);
    }
  }

  return {
    nodeList,
    nodeIdsInSelectedNodes,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
  };
};
