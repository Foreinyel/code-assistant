import * as ts from "typescript";
import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";

type FunctionArgument = ts.Identifier | ts.ThisExpression;

const generateFunctionParameters = (
  thisFlag: boolean,
  identifierNodes: doctor.Node[]
) => {
  const functionParameters: ts.ParameterDeclaration[] = [];
  if (thisFlag) {
    functionParameters.push(
      factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier(doctor.constants.THIS),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      )
    );
  }
  if (identifierNodes.length) {
    functionParameters.push(
      ...identifierNodes.map((identifierNode) =>
        factory.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          identifierNode.sourceNode as ts.Identifier,
          undefined,
          factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        )
      )
    );
  }
  return functionParameters;
};

const generateArgumentList = (
  thisFlag: boolean,
  identifierNodes: doctor.Node[]
) => {
  const argumentList: FunctionArgument[] = [];
  if (thisFlag) {
    argumentList.push(factory.createThis());
  }
  argumentList.push(
    ...identifierNodes.map(
      (identifierNode) => identifierNode.sourceNode as ts.Identifier
    )
  );
  return argumentList;
};

const generateFunctionBody = (
  nodeList: doctor.NodeList,
  nodeIdsInSelectedNodes: Set<number>,
  replaceThisWithParameter: boolean,
  identifierReferedByOuterScope: doctor.Node[],
  statements: doctor.Node[]
) => {
  if (replaceThisWithParameter) {
    for (let nodeId of nodeIdsInSelectedNodes.values()) {
      const node = nodeList.findById(nodeId);
      if (
        node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
        (node.sourceNode as ts.PropertyAccessExpression).expression.kind ===
          ts.SyntaxKind.ThisKeyword
      ) {
        (node.sourceNode as any).expression = ts.factory.createIdentifier(
          doctor.constants.THIS
        );
      }
    }
  }

  const bodyStatements = [
    ...statements.map((statement) => statement.sourceNode),
  ];
  if (identifierReferedByOuterScope.length) {
    const returnStatement = factory.createReturnStatement(
      identifierReferedByOuterScope.length > 1
        ? factory.createObjectLiteralExpression(
            identifierReferedByOuterScope.map((item) =>
              factory.createShorthandPropertyAssignment(
                item.sourceNode as ts.Identifier,
                undefined
              )
            ),
            false
          )
        : (identifierReferedByOuterScope[0].sourceNode as ts.Identifier)
    );
    bodyStatements.push(returnStatement);
  }
  return bodyStatements as ts.Statement[];
};

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

  const functionParameters: ts.ParameterDeclaration[] =
    generateFunctionParameters(thisFlag, identifiersReferenceFromOuterScope);
  const argumentList: FunctionArgument[] = generateArgumentList(
    thisFlag,
    identifiersReferenceFromOuterScope
  );

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
              generateFunctionBody(
                nodeList,
                nodeIdsInSelectedNodes,
                thisFlag,
                identifierReferedByOuterScope,
                selectedStatements
              )
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
