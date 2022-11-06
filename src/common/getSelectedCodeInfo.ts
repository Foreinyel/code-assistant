import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { strict as assert } from "assert";
import { getDocumentInfo } from "./getDocumentInfo";
import ts from "typescript";
export const getSelectedCodeInfo = () => {
  const {
    editor,
    document,
    nodeList,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
    programFile,
  } = getDocumentInfo();
  // todo: validate if it's right code block, extracted code must be in one big block
  const { selections } = editor;
  assert.ok(selections.length === 1 && !!document, "invalid selections");
  const [selection] = selections;
  const { line: lineStart, character: characterStart } = selection.start;
  const { line: lineEnd, character: characterEnd } = selection.end;
  const selectedText = document.getText(
    new vscode.Range(
      new vscode.Position(selection.start.line, 0),
      new vscode.Position(selection.end.line + 1, 0)
    )
  );
  const nodeIdsInSelectedNodes: Set<number> = new Set();
  const selectedNodes: doctor.Node[] = [];
  for (let node of nodeList) {
    if (
      typeof node?.line?.start === "number" &&
      typeof node?.line?.end === "number" &&
      typeof node?.character?.start === "number" &&
      typeof node?.character?.end === "number" &&
      ((node?.line?.start > lineStart && node?.line?.end < lineEnd) ||
        (lineStart !== lineEnd &&
          node?.line?.start === lineStart &&
          node?.character?.start >= characterStart) ||
        (lineStart !== lineEnd &&
          node?.line?.end === lineEnd &&
          node.character.end <= characterEnd) ||
        (lineStart === lineEnd &&
          node?.line?.start === lineStart &&
          node?.line?.end === lineEnd &&
          node?.character?.start >= characterStart &&
          node.character.end <= characterEnd))
    ) {
      nodeIdsInSelectedNodes.add(node.id);
      selectedNodes.push(node);
    }
  }

  const selectedNodesValid = selectedNodes.filter((node) => {
    if (
      node.sons.length === 1 &&
      node.sons[0].kind === ts.SyntaxKind.Identifier &&
      node.kind === ts.SyntaxKind.BindingElement
    ) {
      return false;
    }
    return true;
  });

  return {
    nodeList,
    nodeIdsInSelectedNodes,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
    selectedNodes,
    programFile,
    selectedNodesValid,
  };
};
