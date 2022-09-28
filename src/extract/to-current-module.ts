import * as doctor from "@fe-doctor/core";
import * as ts from "typescript";
import { extractCodeToFunction, factory } from "./to-function";

/**
 * @description extract statements from block to current module
 */
export const toCurrentModule = async () => {
  const {
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
  } = await extractCodeToFunction();

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
          argumentList
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
          : returnFlag
          ? factory.createReturnStatement(caller)
          : factory.createExpressionStatement(caller)
      );
    }
  }
  (parentBlockOfSelectedNodes!.sourceNode as any).statements = newStatements;
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
