import * as ts from "typescript";
import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const factory = ts.factory;
/**
 * @description 提取element到独立组件
 */
export const toComponent = async () => {
  const { nodeList, nodeIdsInSelectedNodes, sourceFile, fullFilename } =
    getSelectedCodeInfo();
  const { selectedStatements, identifiersReferenceFromOuterScope, thisFlag } =
    doctor.findReferredIdentifiersOfNodeList(nodeList, nodeIdsInSelectedNodes);
  const newFunctionName = (await vscode.window.showInputBox({
    prompt: "please input component name",
    validateInput: (value) => {
      if (!value) {
        return "component name required.";
      }
      return undefined;
    },
  })) as string;
  const membersOfThis: Set<string> = new Set();
  for (let nodeId of nodeIdsInSelectedNodes.values()) {
    const node = nodeList.findById(nodeId);
    if (
      node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
      (node.sourceNode as ts.PropertyAccessExpression).expression.kind ===
        ts.SyntaxKind.ThisKeyword
    ) {
      membersOfThis.add(
        (node.sourceNode as ts.PropertyAccessExpression).name
          .escapedText as string
      );
      (node.sourceNode as any).expression =
        ts.factory.createIdentifier("props");
    }
  }
  const { interfaceOfProps, component, componentName } =
    doctor.generateFunctionComponent(
      newFunctionName,
      false,
      [
        ...identifiersReferenceFromOuterScope.map(
          (item) => (item.sourceNode as ts.Identifier).escapedText as string
        ),
        ...Array.from(membersOfThis),
      ],
      selectedStatements.filter((item) => {
        if (
          item.kind === ts.SyntaxKind.JsxText &&
          /^(\r|\n|\s)*$/g.test((item.sourceNode as ts.JsxText).text)
        ) {
          return false;
        }
        return true;
      })
    );
  (sourceFile as any).statements = [
    ...sourceFile!.statements,
    interfaceOfProps,
    component,
  ];
  const componentElement = factory.createJsxSelfClosingElement(
    factory.createIdentifier(componentName),
    undefined,
    factory.createJsxAttributes([
      ...identifiersReferenceFromOuterScope.map((item) =>
        factory.createJsxAttribute(
          factory.createIdentifier(
            (item.sourceNode as ts.Identifier).escapedText as string
          ),
          factory.createJsxExpression(
            undefined,
            factory.createIdentifier(
              (item.sourceNode as ts.Identifier).escapedText as string
            )
          )
        )
      ),
      ...Array.from(membersOfThis).map((item) => {
        return factory.createJsxAttribute(
          factory.createIdentifier(item),
          factory.createJsxExpression(
            undefined,
            factory.createPropertyAccessExpression(
              factory.createThis(),
              factory.createIdentifier(item)
            )
          )
        );
      }),
    ])
  );
  const parentNodeOfSelectedNodes = nodeList.findById(
    selectedStatements[0].parentId
  );
  if (
    parentNodeOfSelectedNodes?.kind &&
    [
      ts.SyntaxKind.ParenthesizedExpression,
      ts.SyntaxKind.JsxExpression,
    ].includes(parentNodeOfSelectedNodes?.kind)
  ) {
    (parentNodeOfSelectedNodes.sourceNode as any).expression = componentElement;
  } else if (parentNodeOfSelectedNodes?.kind === ts.SyntaxKind.JsxElement) {
    const newChilren = [];
    let insert = false;
    const originSelectedStatements = selectedStatements.map(
      (item) => item.sourceNode
    );
    for (let child of (parentNodeOfSelectedNodes!.sourceNode as any).children) {
      if (!originSelectedStatements.includes(child)) {
        newChilren.push(child);
      } else if (!insert) {
        insert = true;
        newChilren.push(componentElement);
      }
    }
    (parentNodeOfSelectedNodes!.sourceNode as any).children = newChilren;
  }
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
