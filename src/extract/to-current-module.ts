import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import * as ts from "typescript";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";

const factory = ts.factory;

export const toCurrentModule = async () => {
  const { nodeList, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    getSelectedCodeInfo();

  const {
    selectedStatements,
    identifierReferedByOuterScope,
    identifiersReferenceFromOuterScope,
    thisFlag,
    awaitFlag,
  } = doctor.findReferredIdentifiersOfNodeList(
    nodeList,
    nodeIdsInSelectedNodes
  );

  const newFunctionName = (await vscode.window.showInputBox({
    title: "test",
    prompt: "please input new function name",
    validateInput: (value) => {
      if (!value) {
        return "new function name required.";
      }
      return undefined;
    },
  })) as string;
  // 创建一个函数
  const newFunction = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(newFunctionName),
          undefined,
          undefined,
          factory.createArrowFunction(
            awaitFlag
              ? [factory.createModifier(ts.SyntaxKind.AsyncKeyword)]
              : undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                factory.createObjectBindingPattern(
                  thisFlag
                    ? [
                        factory.createBindingElement(
                          undefined,
                          undefined,
                          factory.createIdentifier(doctor.constants.THIS),
                          undefined
                        ),
                        ...identifiersReferenceFromOuterScope.map((item) => {
                          return factory.createBindingElement(
                            undefined,
                            undefined,
                            item.sourceNode as ts.Identifier,
                            undefined
                          );
                        }),
                      ]
                    : identifiersReferenceFromOuterScope.map((item) => {
                        return factory.createBindingElement(
                          undefined,
                          undefined,
                          item.sourceNode as ts.Identifier,
                          undefined
                        );
                      })
                ),
                undefined,
                undefined,
                undefined
              ),
            ],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              identifierReferedByOuterScope?.length
                ? [
                    ...selectedStatements.map(
                      (item) => item.sourceNode as ts.Statement
                    ),
                    factory.createReturnStatement(
                      factory.createObjectLiteralExpression(
                        identifierReferedByOuterScope.map((item) =>
                          factory.createShorthandPropertyAssignment(
                            item.sourceNode as ts.Identifier,
                            undefined
                          )
                        ),
                        false
                      )
                    ),
                  ]
                : [
                    ...selectedStatements.map(
                      (item) => item.sourceNode as ts.Statement
                    ),
                  ]
            )
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
  // 将新函数写入文件末尾
  (sourceFile as any).statements = sourceFile?.statements.concat([newFunction]);

  // 用新函数代替选择的函数体
  const parentBlockOfSelectedNodes = nodeList.findById(
    selectedStatements[0].parentId
  );

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
          [
            factory.createObjectLiteralExpression(
              thisFlag
                ? [
                    factory.createPropertyAssignment(
                      factory.createIdentifier(doctor.constants.THIS),
                      factory.createThis()
                    ),
                    ...identifiersReferenceFromOuterScope.map((item) =>
                      factory.createShorthandPropertyAssignment(
                        item.sourceNode as ts.Identifier,
                        undefined
                      )
                    ),
                  ]
                : identifiersReferenceFromOuterScope.map((item) =>
                    factory.createShorthandPropertyAssignment(
                      item.sourceNode as ts.Identifier,
                      undefined
                    )
                  ),
              false
            ),
          ]
        );
      if (awaitFlag) {
        caller = factory.createAwaitExpression(caller);
      }
      newStatements.push(
        identifierReferedByOuterScope?.length
          ? factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  factory.createObjectBindingPattern(
                    identifierReferedByOuterScope.map((item) =>
                      factory.createBindingElement(
                        undefined,
                        undefined,
                        item.sourceNode as ts.Identifier,
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
          : factory.createExpressionStatement(caller)
      );
    }
  }

  (parentBlockOfSelectedNodes!.sourceNode as any).statements = newStatements;

  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
