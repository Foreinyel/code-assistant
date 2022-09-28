import * as ts from "typescript";
import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
export const extractCodeToFunction = async () => {
  const { nodeList, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    getSelectedCodeInfo();
  const {
    selectedStatements,
    identifierReferedByOuterScope,
    identifiersReferenceFromOuterScope,
    thisFlag,
    awaitFlag,
    returnFlag,
  } = doctor.findReferredIdentifiersOfNodeList(
    nodeList,
    nodeIdsInSelectedNodes
  );
  const newFunctionName = (await vscode.window.showInputBox({
    prompt: "please input new function name",
    validateInput: (value) => {
      if (!value) {
        return "new function name required.";
      }
      return undefined;
    },
  })) as string;

  let functionParameters: ts.ParameterDeclaration[] = [];
  let argumentList: ts.ObjectLiteralExpression[] = [];
  if (thisFlag || identifiersReferenceFromOuterScope?.length) {
    functionParameters = [
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
    ];
    argumentList = [
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
    ];
  }
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
            functionParameters,
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
  return {
    sourceFile,
    newFunction,
    nodeList,
    selectedStatements,
    newFunctionName,
    argumentList,
    awaitFlag,
    identifierReferedByOuterScope,
    returnFlag,
    fullFilename,
  };
};
export const factory = ts.factory;
