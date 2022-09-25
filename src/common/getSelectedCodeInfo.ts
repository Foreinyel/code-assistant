import * as vscode from "vscode";
import { strict as assert } from "assert";
import { getDocumentInfo } from "./getDocumentInfo";
export const getSelectedCodeInfo = () => {
  const {
    editor,
    document,
    nodeList,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
  } = getDocumentInfo({});
  // todo: validate if it's right code block, extracted code must be in one big block
  const { selections } = editor;
  assert.ok(selections.length === 1 && !!document, "invalid selections");
  const [selection] = selections;
  const lineStart = selection.start.line;
  const lineEnd = selection.end.line;
  const selectedText = document.getText(
    new vscode.Range(
      new vscode.Position(selection.start.line, 0),
      new vscode.Position(selection.end.line + 1, 0)
    )
  );
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
