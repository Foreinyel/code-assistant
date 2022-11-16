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
  const { selectedStatements, identifiersReferenceFromOuterScope } =
    doctor.findReferredInfoOfNodeIds(nodeIdsInSelectedNodes, nodeList);
  const newFunctionName = (await vscode.window.showInputBox({
    prompt: "please input component name",
    validateInput: (value) => {
      if (!value) {
        return "component name required.";
      }
      return undefined;
    },
  })) as string;
  if (!newFunctionName) {
    return;
  }
  const membersOfThis: Set<string> = new Set();
  const propertiesOfProps: Set<string> = new Set();
  for (let nodeId of nodeIdsInSelectedNodes.values()) {
    const node = nodeList.findById(nodeId);
    if (
      node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
      (node.sourceNode as ts.PropertyAccessExpression).expression.kind ===
        ts.SyntaxKind.ThisKeyword
    ) {
      if (
        (node.sourceNode as ts.PropertyAccessExpression).name.escapedText ===
        "props"
      ) {
        membersOfThis.add(
          `props.${
            (node.father!.sourceNode as ts.PropertyAccessExpression).name
              .escapedText as string
          }`
        );
        if (
          ((node.father?.sourceNode as any)?.expression === node.sourceNode &&
            (node.father?.father?.sourceNode as any)?.expression) ===
          node.father?.sourceNode
        ) {
          (node.father!.father!.sourceNode as any).expression = (
            node.father!.sourceNode as any
          )?.name;
        }
      } else if (
        (node.sourceNode as ts.PropertyAccessExpression).name.escapedText ===
        "state"
      ) {
        membersOfThis.add(
          `state.${
            (node.father!.sourceNode as ts.PropertyAccessExpression).name
              .escapedText as string
          }`
        );
        (node.father!.sourceNode as any).expression =
          ts.factory.createIdentifier("props");
      } else {
        membersOfThis.add(
          (node.sourceNode as ts.PropertyAccessExpression).name
            .escapedText as string
        );
        (node.sourceNode as any).expression =
          ts.factory.createIdentifier("props");
      }
    } else if (
      node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
      ((node.sourceNode as ts.PropertyAccessExpression).expression as any)
        ?.escapedText === "props"
    ) {
      propertiesOfProps.add(
        (node.sourceNode as ts.PropertyAccessExpression).name
          .escapedText as string
      );
      // todo replace props.property with property
      if ((node.father?.sourceNode as any)?.expression === node.sourceNode) {
        (node.father!.sourceNode as any).expression = (
          node.sourceNode as any
        )?.name;
      }
    }
  }
  const { interfaceOfProps, component, componentName } =
    doctor.generateFunctionComponent(
      newFunctionName,
      false,
      [
        ...identifiersReferenceFromOuterScope
          .filter(
            (item) =>
              ((item.sourceNode as ts.Identifier).escapedText as string) !==
              "props"
          )
          .map(
            (item) => (item.sourceNode as ts.Identifier).escapedText as string
          ),
        ...Array.from(membersOfThis).map((item) => {
          if (item.indexOf(".") >= 0) {
            const properties = item.split(".");
            return properties[properties.length - 1];
          }
          return item;
        }),
        ...Array.from(propertiesOfProps).map((item) => {
          if (item.indexOf(".") >= 0) {
            const properties = item.split(".");
            return properties[properties.length - 1];
          }
          return item;
        }),
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
      ...identifiersReferenceFromOuterScope
        .filter(
          (item) =>
            ((item.sourceNode as ts.Identifier).escapedText as string) !==
            "props"
        )
        .map((item) =>
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
        let attributeName = item;
        if (item.indexOf(".") >= 0) {
          attributeName = item.split(".")[item.split(".").length - 1];
        }
        return factory.createJsxAttribute(
          factory.createIdentifier(attributeName),
          factory.createJsxExpression(
            undefined,
            factory.createPropertyAccessExpression(
              factory.createThis(),
              factory.createIdentifier(item)
            )
          )
        );
      }),
      ...Array.from(propertiesOfProps).map((item) => {
        let attributeName = item;
        if (item.indexOf(".") >= 0) {
          attributeName = item.split(".")[item.split(".").length - 1];
        }
        return factory.createJsxAttribute(
          factory.createIdentifier(attributeName),
          factory.createJsxExpression(
            undefined,
            factory.createPropertyAccessExpression(
              factory.createIdentifier("props"),
              factory.createIdentifier(item)
            )
          )
        );
      }),
    ])
  );
  const parentNodeOfSelectedNodes = selectedStatements[0].father;
  if (
    parentNodeOfSelectedNodes?.kind &&
    [
      ts.SyntaxKind.ParenthesizedExpression,
      ts.SyntaxKind.JsxExpression,
    ].includes(parentNodeOfSelectedNodes?.kind)
  ) {
    (parentNodeOfSelectedNodes.sourceNode as any).expression = componentElement;
  } else if (
    [ts.SyntaxKind.JsxElement, ts.SyntaxKind.JsxFragment].includes(
      parentNodeOfSelectedNodes?.kind!
    )
  ) {
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
