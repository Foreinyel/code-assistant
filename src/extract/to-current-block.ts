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
const getParentOfSelectedNodesAndOutestNodes = (selectedNodes: any, nodeIdsInSelectedNodes: any) => {
  let parentOfSelectedNodes: doctor.Node | null = null;
  let outestNodes: doctor.Node[] = [];
  for (let node of selectedNodes) {
    if (!nodeIdsInSelectedNodes.has(node.father!.id)) {
      parentOfSelectedNodes = node.father;
      outestNodes.push(node);
    }
  }
  return { parentOfSelectedNodes, outestNodes };
};
export const expressionToCurrentBlock = async () => {
  const { newVariableName, selectedNodes, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    await getNewVariableNameAndSelectedCodeInfo();
  if (!newVariableName) {
    return;
  }
  const myStatement = doctor.findMyStatement(selectedNodes[0]);
  const { parentOfSelectedNodes, outestNode } = getParentOfSelectedNodes(
    selectedNodes,
    nodeIdsInSelectedNodes
  );
  assert.ok(parentOfSelectedNodes);
  const propertyName = doctor.getPropertyNameBetweenFatherAndSon(parentOfSelectedNodes, outestNode!);
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
  const propertyNameOfBlock = doctor.getPropertyNameBetweenFatherAndSon(currentBlock.father!, currentBlock);
  assert.ok(propertyNameOfBlock);
  parentOfSelectedNodes.sourceNodeAny[propertyName] = ts.factory.createIdentifier(newVariableName);
  currentBlock.father!.sourceNodeAny[propertyNameOfBlock] = ts.factory.createBlock(newChildren as any, true);
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
export const elementsToCurrentBlock = async () => {
  const { newVariableName, selectedNodes, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    await getNewVariableNameAndSelectedCodeInfo();
  if (!newVariableName) {
    return;
  }
  const myStatement = doctor.findMyStatement(selectedNodes[0]);
  const { parentOfSelectedNodes, outestNodes } = getParentOfSelectedNodesAndOutestNodes(
    selectedNodes,
    nodeIdsInSelectedNodes
  );
  assert.ok(parentOfSelectedNodes);
  const propertyName = doctor.getPropertyNameBetweenFatherAndSon(parentOfSelectedNodes, outestNodes[0]);
  assert.ok(propertyName);
  const currentBlock = myStatement?.father;
  assert.ok(currentBlock);
  const newChildren: ts.Node[] = [];
  let childrenIndexList = [];
  if (propertyName === "children") {
    // childrenIndex = parentOfSelectedNodes.sourceNodeAny.children.findIndex(item => item === )
    childrenIndexList = outestNodes.map((outestNode) => {
      return parentOfSelectedNodes.sourceNodeAny.children.findIndex(
        (item: any) => item === outestNode.sourceNodeAny
      );
    });
  }
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
                outestNodes.length > 1
                  ? ts.factory.createJsxFragment(
                      ts.factory.createJsxOpeningFragment(),
                      outestNodes.map((item) => item.sourceNodeAny),
                      ts.factory.createJsxJsxClosingFragment()
                    )
                  : outestNodes[0].sourceNodeAny
              ),
            ],
            ts.NodeFlags.Const
          )
        )
      );
    }
    newChildren.push(son.sourceNode);
  }
  const propertyNameOfBlock = doctor.getPropertyNameBetweenFatherAndSon(currentBlock.father!, currentBlock);
  assert.ok(propertyNameOfBlock);

  const newElements: ts.Node[] = []
  let inserted = false
  const outestSourceNodes = outestNodes.map(item => item.sourceNodeAny)
  for (let child of parentOfSelectedNodes.sourceNodeAny.children) {
    if (!outestSourceNodes.includes(child) ) {
      newElements.push(child)
    } else if (!inserted) {
      newElements.push(ts.factory.createJsxExpression(undefined, ts.factory.createIdentifier(newVariableName)))
      inserted = true
    }
  }

  parentOfSelectedNodes.sourceNodeAny[propertyName] = newElements;
  currentBlock.father!.sourceNodeAny[propertyNameOfBlock] = ts.factory.createBlock(newChildren as any, true);
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
const getNewVariableNameAndSelectedCodeInfo = async () => {
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
  return { newVariableName, selectedNodes, nodeIdsInSelectedNodes, sourceFile, fullFilename };
};
