import * as doctor from "@fe-doctor/core";
import { getIdentifierName } from "@fe-doctor/core";
import assert from "assert";
import * as ts from "typescript";
import * as vscode from "vscode";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
import { extractCodeToFunction, factory } from "./to-function";

/**
 * @description extract statements from block to current module
 */
export const statementsToCurrentModule = async () => {
  const result = await extractCodeToFunction(false);
  if (result) {
    const {
      sourceFile,
      selectedStatements,
      newFunctionName,
      argumentList,
      awaitFlag,
      identifierReferedByOuterScope,
      returnFlag,
      fullFilename,
      identifiersReassigned,
      parent,
    } = result;

    // 用新函数代替选择的函数体
    const parentBlockOfSelectedNodes = parent;
    const newStatements = [];
    let insert = false;
    const originSelectedStatements = selectedStatements.map(
      (item) => item.sourceNode
    );
    for (let statement of (parentBlockOfSelectedNodes!.sourceNode as any)
      .statements) {
      if (!originSelectedStatements.includes(statement)) {
        newStatements.push(statement);
      } else if (!insert) {
        insert = true;
        let caller: ts.AwaitExpression | ts.CallExpression =
          factory.createCallExpression(
            factory.createIdentifier(newFunctionName),
            undefined,
            argumentList
          );
        if (awaitFlag) {
          caller = factory.createAwaitExpression(caller);
        }

        const identifiersShouldReturnSet: Set<string> = new Set();
        const identifiersShouldReturn: ts.Identifier[] = [];

        for (let identifier of identifierReferedByOuterScope) {
          const identifierName = getIdentifierName(identifier);
          if (!identifiersShouldReturnSet.has(identifierName)) {
            identifiersShouldReturnSet.add(identifierName);
            identifiersShouldReturn.push(
              identifier.sourceNode as ts.Identifier
            );
          }
        }
        for (let identifierName of identifiersReassigned) {
          const identifier = ts.factory.createIdentifier(identifierName);
          identifiersShouldReturn.push(identifier);
        }
        if (identifiersShouldReturn?.length) {
          if (!identifiersReassigned.size) {
            newStatements.push(
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    identifiersShouldReturn?.length === 1
                      ? identifiersShouldReturn[0]
                      : factory.createObjectBindingPattern(
                          identifiersShouldReturn.map((item) =>
                            factory.createBindingElement(
                              undefined,
                              undefined,
                              item,
                              undefined
                            )
                          )
                        ),
                    undefined,
                    undefined,
                    caller
                  ),
                ],
                ts.NodeFlags.Const
              )
            );
          } else {
            for (let identifier of identifiersShouldReturn) {
              if (
                !identifiersReassigned.has(identifier.escapedText as string)
              ) {
                newStatements.push(
                  factory.createVariableStatement(
                    undefined,
                    factory.createVariableDeclarationList(
                      [factory.createVariableDeclaration(identifier)],
                      ts.NodeFlags.Let
                    )
                  )
                );
              }
            }
            newStatements.push(
              factory.createExpressionStatement(
                factory.createParenthesizedExpression(
                  factory.createBinaryExpression(
                    identifiersShouldReturn.length === 1
                      ? identifiersShouldReturn[0]
                      : factory.createObjectLiteralExpression(
                          identifiersShouldReturn.map((item) =>
                            factory.createShorthandPropertyAssignment(
                              item,
                              undefined
                            )
                          )
                        ),
                    factory.createToken(ts.SyntaxKind.EqualsToken),
                    caller
                  )
                )
              )
            );
          }
        } else if (returnFlag) {
          newStatements.push(factory.createReturnStatement(caller));
        } else {
          newStatements.push(factory.createExpressionStatement(caller));
        }
      }
    }
    (parentBlockOfSelectedNodes!.sourceNode as any).statements = newStatements;
    await doctor.writeAstToFile(sourceFile!, fullFilename);
  }
};

export const expressionToCurrentModule = async () => {
  const result = await extractCodeToFunction(true);
  if (result) {
    const {
      sourceFile,
      newFunctionName,
      argumentList,
      awaitFlag,
      fullFilename,
      parent,
      selectedStatements,
    } = result;
    let caller: ts.AwaitExpression | ts.CallExpression =
      factory.createCallExpression(
        factory.createIdentifier(newFunctionName),
        undefined,
        argumentList
      );
    if (awaitFlag) {
      caller = factory.createAwaitExpression(caller);
    }
    if ((parent.sourceNode as any).body) {
      (parent.sourceNode as any).body =
        ts.factory.createParenthesizedExpression(caller);
    } else if ((parent.sourceNode as any).expression) {
      (parent.sourceNode as any).expression =
        ts.factory.createParenthesizedExpression(caller);
    } else if (parent.kind === ts.SyntaxKind.BinaryExpression) {
      const [statement] = selectedStatements;
      if ((parent as any).sourceNode.left === statement.sourceNode) {
        (parent.sourceNode as any).left =
          ts.factory.createParenthesizedExpression(caller);
      } else if ((parent as any).sourceNode.right === statement.sourceNode) {
        (parent.sourceNode as any).right =
          ts.factory.createParenthesizedExpression(caller);
      }
    } else {
      throw new Error("Unhandled parent kind.");
    }

    await doctor.writeAstToFile(sourceFile!, fullFilename);
  }
};

export const constantToCurrentModule = async () => {
  const { nodeList, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    getSelectedCodeInfo();
  const {
    selectedStatements,
    identifierReferedByOuterScope,
    identifiersReferenceFromOuterScope,
    parent,
  } = doctor.findReferredInfoOfNodeIds(nodeIdsInSelectedNodes, nodeList);
  assert.ok(selectedStatements.length === 1);
  assert.ok(!identifierReferedByOuterScope.length);
  assert.ok(!identifiersReferenceFromOuterScope.length);
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
  const newVariableStatement = ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          newVariableName,
          undefined,
          undefined,
          selectedStatements[0].sourceNode as any
        ),
      ],
      ts.NodeFlags.Const
    )
  );
  const parentSourceNode = parent.sourceNode as any;
  if (
    parentSourceNode.arguments?.find(
      (arg: any) => arg === selectedStatements[0].sourceNode
    )
  ) {
    parentSourceNode.arguments.splice(
      parentSourceNode.arguments?.findIndex(
        (arg: any) => arg === selectedStatements[0].sourceNode
      ),
      1,
      ts.factory.createIdentifier(newVariableName)
    );
  } else if (
    parentSourceNode.initializer === selectedStatements[0].sourceNode
  ) {
    parentSourceNode.initializer = ts.factory.createIdentifier(newVariableName);
  } else if (parentSourceNode.expression) {
    parentSourceNode.expression = ts.factory.createIdentifier(newVariableName);
  } else if (parentSourceNode.right) {
    parentSourceNode.right = ts.factory.createIdentifier(newVariableName);
  }
  (sourceFile as any).statements = [
    ...(sourceFile as any).statements,
    newVariableStatement,
  ];
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
