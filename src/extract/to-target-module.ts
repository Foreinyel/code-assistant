import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import * as ts from "typescript";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
import * as hm from "@hemyn/utils-node";
import path from "path";

const factory = ts.factory;

/**
 * 提取方法到公用模块
 */
export const toTargetModule = async () => {
  const { nodeList, nodeIdsInSelectedNodes, rootPath, projectName } =
    getSelectedCodeInfo();
  const {
    selectedStatements,
    identifierReferedByOuterScope,
    identifiersReferenceFromOuterScope,
    identifiersInGlobalScope,
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

  const filesInSrc = await hm.listFiles(path.resolve(rootPath, "src"));
  const targetModule = await vscode.window.showQuickPick(
    filesInSrc.map((item) => path.relative(rootPath, item)),
    {
      placeHolder: "please select a file",
      ignoreFocusOut: true,
    }
  );

  if (!targetModule) {
    return;
  }

  const targetFullFilename = path.resolve(rootPath, targetModule);
  const targetFilename = path.basename(targetFullFilename);

  const targetProgramFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    targetModule,
    targetFilename
  );

  const targetNodeList = doctor.loadNodeListByFile(targetProgramFile);

  // 创建一个函数
  const newFunction = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(newFunctionName),
          undefined,
          undefined,
          factory.createArrowFunction(
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                factory.createObjectBindingPattern(
                  identifiersReferenceFromOuterScope.map((item) => {
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
            factory.createBlock([
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
            ])
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );

  const targetSourceFile = targetProgramFile.ast;

  for (let nodeId of Array.from(identifiersInGlobalScope)) {
    const identifier = nodeList.findById(nodeId);
    if (!identifier) {
      continue;
    }
    const definitionOfIdentifier = doctor.findDefinitionOfIdentifier(
      identifier,
      nodeList
    );
    if (!definitionOfIdentifier) {
      continue;
    }
    console.log(
      `🚀 ~ file: to-target-module.ts ~ line 130 ~ toTargetModule ~ definitionOfIdentifier`,
      doctor.getNodeText(definitionOfIdentifier),
      definitionOfIdentifier.kind
    );

    if (definitionOfIdentifier.kind === ts.SyntaxKind.ImportDeclaration) {
      // todo import from
    }
  }

  // 将新函数写入文件末尾
  (targetSourceFile as any).statements = targetSourceFile?.statements.concat([
    newFunction,
  ]);
};
