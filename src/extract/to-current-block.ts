import * as vscode from "vscode";
import assert from "assert";
import * as doctor from "@fe-doctor/core";
import ts from "typescript";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const getParentOfSelectedNodes = (selectedNodes: any, nodeIdsInSelectedNodes: any) => {
  let parentOfSelectedNodes: doctor.Node | null = null;
  let outestNode: doctor.Node | null = null;
  for (let node of selectedNodes) {
    if (!nodeIdsInSelectedNodes.has(node.father!.id)) {
      parentOfSelectedNodes = node.father;
      outestNode = node;
      break;
    }
  }
  return { parentOfSelectedNodes, outestNode };
};
const getPropertyNameBetweenFatherAndSon = (father: any, son: any) => {
  let propertyName: string | null = null;
  for (let k of Object.keys(father.sourceNodeAny)) {
    if (
      father.sourceNodeAny[k] === son?.sourceNodeAny ||
      father.sourceNodeAny[k]?.includes?.(son?.sourceNodeAny)
    ) {
      propertyName = k;
      break;
    }
  }
  return propertyName;
};
export const expressionToCurrentBlock = async () => {
  const { nodeIdsInSelectedNodes, sourceFile, fullFilename, selectedNodes } = getSelectedCodeInfo();
  assert.ok(selectedNodes.length > 0);
  const newVariableName = (await vscode.window.showInputBox({
    prompt: "please input variable name",
    validateInput: (value) => {
      if (!value) {
        return "variable name required.";
      }
      return undefined;
    },
  })) as string;
  if (!newVariableName) {
    return;
  }
  const myStatement = doctor.findMyStatement(selectedNodes[0]);
  const { parentOfSelectedNodes, outestNode } = getParentOfSelectedNodes(
    selectedNodes,
    nodeIdsInSelectedNodes
  );
  assert.ok(parentOfSelectedNodes);
  const propertyName = getPropertyNameBetweenFatherAndSon(parentOfSelectedNodes, outestNode);
  assert.ok(propertyName);
  const currentBlock = myStatement?.father;
  assert.ok(currentBlock);
  const newChildren: ts.Node[] = [];
  for (let son of currentBlock.sons) {
    if (son.sourceNode === myStatement.sourceNode) {
      newChildren.push(
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                newVariableName,
                undefined,
                undefined,
                outestNode!.sourceNodeAny
              ),
            ],
            ts.NodeFlags.Const
          )
        )
      );
    }
    newChildren.push(son.sourceNode);
  }
  const propertyNameOfBlock = getPropertyNameBetweenFatherAndSon(currentBlock.father, currentBlock);
  assert.ok(propertyNameOfBlock);
  parentOfSelectedNodes.sourceNodeAny[propertyName] = ts.factory.createIdentifier(newVariableName);
  currentBlock.father!.sourceNodeAny[propertyNameOfBlock] = ts.factory.createBlock(newChildren as any, true);
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
