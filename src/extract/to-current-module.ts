import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { strict as assert } from "assert";
import * as path from "path";
import * as ts from "typescript";

const factory = ts.factory;

export const toCurrentModule = async () => {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace;
  assert.ok(workspace.workspaceFolders?.length === 1, "invalid workspace");
  assert.ok(!!editor, "invalid editor.");
  const { document, selections } = editor;
  assert.ok(selections.length === 1 && !!document, "invalid selections");
  const folder = workspace.workspaceFolders[0];
  const rootPath = folder.uri.path;
  const projectName = folder.name;
  const fullFilename = document.fileName;
  const relativePath = path.relative(rootPath, fullFilename);
  const filename = path.basename(fullFilename);

  const programFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    relativePath,
    filename
  );
  const nodeList = doctor.loadNodeListByFile(programFile);

  doctor.initNodeList(nodeList, [programFile]);

  const relations = doctor.loadRelations(nodeList);

  const [selection] = selections;

  const sourceFile = programFile.ast;
  const lineStart = selection.start.line;
  const lineEnd = selection.end.line;
  const selectedText = document.getText(
    new vscode.Range(
      new vscode.Position(selection.start.line, 0),
      new vscode.Position(selection.end.line + 1, 0)
    )
  );
  // todo: validate if it's right code block, extracted code must be in one big block

  const selectedNodeList = new doctor.NodeList();
  const selectedStatements: doctor.Node[] = [];
  const allIdentifiersInSelectedNodes: doctor.Node[] = [];
  const nodeIdsInSelectedNodes: Set<number> = new Set();
  const allIdentifers: doctor.Node[] = [];
  for (let node of nodeList) {
    if (
      typeof node?.line?.start === "number" &&
      typeof node?.line?.end === "number" &&
      node?.line?.start >= lineStart &&
      node?.line?.end <= lineEnd
    ) {
      selectedNodeList.add(node);
      nodeIdsInSelectedNodes.add(node.id);
      if (node.kind === ts.SyntaxKind.Identifier) {
        allIdentifiersInSelectedNodes.push(node);
      }
    }
    if (node?.kind === ts.SyntaxKind.Identifier) {
      allIdentifers.push(node);
    }
  }

  for (let node of selectedNodeList) {
    if (node?.parentId && !nodeIdsInSelectedNodes.has(node?.parentId)) {
      selectedStatements.push(node);
    }
  }

  const identifiersReferenceFromOuterScope: doctor.Node[] = [];
  for (let identifier of allIdentifiersInSelectedNodes) {
    const relation = relations.findById(identifier.id);
    if (!relation) {
      throw new Error(`Can't find source of ${doctor.getNodeText(identifier)}`);
    }
    if (!nodeIdsInSelectedNodes.has(relation.sourceNodeId)) {
      identifiersReferenceFromOuterScope.push(identifier);
    }
  }

  const identifierReferedByOuterScope: doctor.Node[] = [];
  for (let identifier of allIdentifers) {
    const relation = relations.findById(identifier.id);

    if (
      relation?.id &&
      !nodeIdsInSelectedNodes.has(identifier.id) &&
      nodeIdsInSelectedNodes.has(relation.sourceNodeId)
    ) {
      identifierReferedByOuterScope.push(identifier);
    }
  }

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
      newStatements.push(
        factory.createVariableDeclarationList(
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
              factory.createCallExpression(
                factory.createIdentifier(newFunctionName),
                undefined,
                [
                  factory.createObjectLiteralExpression(
                    identifiersReferenceFromOuterScope.map((item) =>
                      factory.createShorthandPropertyAssignment(
                        item.sourceNode as ts.Identifier,
                        undefined
                      )
                    ),
                    false
                  ),
                ]
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      );
    }
  }

  (parentBlockOfSelectedNodes!.sourceNode as any).statements = newStatements;

  doctor.writeAstToFile(sourceFile!, fullFilename);
};
