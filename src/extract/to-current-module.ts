import * as doctor from "@fe-doctor/core";
import { getIdentifierName } from "@fe-doctor/core";
import * as ts from "typescript";
import { extractCodeToFunction, factory } from "./to-function";

/**
 * @description extract statements from block to current module
 */
export const toCurrentModule = async () => {
  const {
    sourceFile,
    nodeList,
    selectedStatements,
    newFunctionName,
    argumentList,
    awaitFlag,
    identifierReferedByOuterScope,
    returnFlag,
    fullFilename,
    identifiersReassigned,
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

      const identifiersShouldReturnSet: Set<string> = new Set();
      const identifiersShouldReturn: ts.Identifier[] = [];

      for (let identifier of identifierReferedByOuterScope) {
        const identifierName = getIdentifierName(identifier);
        if (!identifiersShouldReturnSet.has(identifierName)) {
          identifiersShouldReturnSet.add(identifierName);
          identifiersShouldReturn.push(identifier.sourceNode as ts.Identifier);
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
            if (!identifiersReassigned.has(identifier.escapedText as string)) {
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
};
