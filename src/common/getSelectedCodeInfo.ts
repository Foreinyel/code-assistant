import * as doctor from "@fe-doctor/core";
import { strict as assert } from "assert";
import ts from "typescript";
import { getDocumentInfo } from "./getDocumentInfo";
const checkIfNodeEndToLastLine = (
  lineStart: any,
  lineEnd: any,
  node: any,
  characterEnd: any,
  characterStart: any
) => {
  return (
    lineStart !== lineEnd &&
    node?.line?.end === lineEnd &&
    node.character.end <= characterEnd &&
    (node?.line?.start === lineStart
      ? node?.character.start >= characterStart
      : node?.line?.start < lineStart
      ? false
      : true)
  );
};
const checkIfNodeInOneLine = (
  lineStart: any,
  lineEnd: any,
  node: any,
  characterStart: any,
  characterEnd: any
) => {
  return (
    lineStart === lineEnd &&
    node?.line?.start === lineStart &&
    node?.line?.end === lineEnd &&
    node?.character?.start >= characterStart &&
    node.character.end <= characterEnd
  );
};
const checkIfNodeInInnerLines = (node: any, lineStart: any, lineEnd: any) => {
  return node?.line?.start > lineStart && node?.line?.end < lineEnd;
};
const checkIfNodeStartFromFirstLine = (
  lineStart: any,
  lineEnd: any,
  node: any,
  characterStart: any,
  characterEnd: any
) => {
  return (
    lineStart !== lineEnd &&
    node?.line?.start === lineStart &&
    node?.character?.start >= characterStart &&
    (node?.line?.end === lineEnd
      ? node?.character?.end <= characterEnd
      : node?.line?.end > lineEnd
      ? false
      : true)
  );
};
const checkIfNodeSelected = (
  node: any,
  lineStart: any,
  lineEnd: any,
  characterStart: any,
  characterEnd: any
) => {
  return (
    checkIfNodeInInnerLines(node, lineStart, lineEnd) ||
    checkIfNodeStartFromFirstLine(lineStart, lineEnd, node, characterStart, characterEnd) ||
    checkIfNodeEndToLastLine(lineStart, lineEnd, node, characterEnd, characterStart) ||
    checkIfNodeInOneLine(lineStart, lineEnd, node, characterStart, characterEnd)
  );
};
const checkIfParentAndChildrenSameRange = (node: any) => {
  return (
    node.sons.length === 1 &&
    node.sons[0].kind === ts.SyntaxKind.Identifier &&
    [ts.SyntaxKind.BindingElement, ts.SyntaxKind.ShorthandPropertyAssignment].includes(node.kind)
  );
};
export const getSelectedCodeInfo = () => {
  const { editor, document, nodeList, sourceFile, fullFilename, rootPath, projectName, programFile } =
    getDocumentInfo();
  // todo: validate if it's right code block, extracted code must be in one big block
  const { selections } = editor;
  assert.ok(selections.length === 1 && !!document, "invalid selections");
  const [selection] = selections;
  const { line: lineStart, character: characterStart } = selection.start;
  const { line: lineEnd, character: characterEnd } = selection.end;
  // const selectedText = document.getText(
  //   new vscode.Range(
  //     new vscode.Position(selection.start.line, 0),
  //     new vscode.Position(selection.end.line + 1, 0)
  //   )
  // );
  const nodeIdsInSelectedNodes: Set<number> = new Set();
  const selectedNodes: doctor.Node[] = [];
  for (let node of nodeList) {
    if (
      typeof node?.line?.start === "number" &&
      typeof node?.line?.end === "number" &&
      typeof node?.character?.start === "number" &&
      typeof node?.character?.end === "number" &&
      checkIfNodeSelected(node, lineStart, lineEnd, characterStart, characterEnd)
    ) {
      nodeIdsInSelectedNodes.add(node.id);
      selectedNodes.push(node);
    }
  }
  const selectedNodesValid = selectedNodes.filter((node) => {
    if (checkIfParentAndChildrenSameRange(node)) {
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
