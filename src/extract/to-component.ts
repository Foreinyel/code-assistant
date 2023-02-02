import * as ts from "typescript";
import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import assert from "assert";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const checkIfAccessingThisProps = (node: any) => {
  return (node.sourceNode as ts.PropertyAccessExpression).name.escapedText === "props";
};
const addMembersOfThisAndConvertThisProps = (membersOfThis: any, node: any) => {
  membersOfThis.add(
    `props.${(node.father!.sourceNode as ts.PropertyAccessExpression).name.escapedText as string}`
  );
  if (
    ((node.father?.sourceNode as any)?.expression === node.sourceNode &&
      (node.father?.father?.sourceNode as any)?.expression) === node.father?.sourceNode
  ) {
    (node.father!.father!.sourceNode as any).expression = (node.father!.sourceNode as any)?.name;
  }
};
const checkIfAccessingThisState = (node: any) => {
  return (node.sourceNode as ts.PropertyAccessExpression).name.escapedText === "state";
};
const addMembersOfThisAndConvertThisState = (membersOfThis: any, node: any) => {
  membersOfThis.add(
    `state.${(node.father!.sourceNode as ts.PropertyAccessExpression).name.escapedText as string}`
  );
  (node.father!.sourceNode as any).expression = ts.factory.createIdentifier("props");
};
const addMembersOfThisAndConvertThis = (membersOfThis: any, node: any) => {
  membersOfThis.add((node.sourceNode as ts.PropertyAccessExpression).name.escapedText as string);
  (node.sourceNode as any).expression = ts.factory.createIdentifier("props");
};
const checkIfAccessingProps = (node: any) => {
  return (
    node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
    ((node.sourceNode as ts.PropertyAccessExpression).expression as any)?.escapedText === "props"
  );
};
const addPropertiesOfPropsAndConvertProps = (propertiesOfProps: any, node: any) => {
  propertiesOfProps.add((node.sourceNode as ts.PropertyAccessExpression).name.escapedText as string);
  // todo replace props.property with property
  if ((node.father?.sourceNode as any)?.expression === node.sourceNode) {
    (node.father!.sourceNode as any).expression = (node.sourceNode as any)?.name;
  }
};
const checkIfAccessingThis = (node: any) => {
  return (
    node?.kind === ts.SyntaxKind.PropertyAccessExpression &&
    (node.sourceNode as ts.PropertyAccessExpression).expression.kind === ts.SyntaxKind.ThisKeyword
  );
};
const initializeMembersOfThisAndPropertiesOfProps = (nodeIdsInSelectedNodes: any, nodeList: any) => {
  const membersOfThis: Set<string> = new Set();
  const propertiesOfProps: Set<string> = new Set();
  for (let nodeId of nodeIdsInSelectedNodes.values()) {
    const node = nodeList.findById(nodeId);
    if (checkIfAccessingThis(node)) {
      if (checkIfAccessingThisProps(node)) {
        addMembersOfThisAndConvertThisProps(membersOfThis, node);
      } else if (checkIfAccessingThisState(node)) {
        addMembersOfThisAndConvertThisState(membersOfThis, node);
      } else {
        addMembersOfThisAndConvertThis(membersOfThis, node);
      }
    } else if (checkIfAccessingProps(node)) {
      addPropertiesOfPropsAndConvertProps(propertiesOfProps, node);
    }
  }
  return { membersOfThis, propertiesOfProps };
};
const factory = ts.factory;
/**
 * @description 提取elements到独立组件
 */
export const toComponent = async () => {
  const { nodeList, nodeIdsInSelectedNodes, sourceFile, fullFilename } = getSelectedCodeInfo();
  const { selectedStatements, identifiersReferenceFromOuterScope } = doctor.findReferredInfoOfNodeIds(
    nodeIdsInSelectedNodes,
    nodeList
  );
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
  const { membersOfThis, propertiesOfProps } = initializeMembersOfThisAndPropertiesOfProps(
    nodeIdsInSelectedNodes,
    nodeList
  );
  const { interfaceOfProps, component, componentName } = doctor.generateFunctionComponent(
    newFunctionName,
    false,
    [
      ...identifiersReferenceFromOuterScope
        .filter((item) => ((item.sourceNode as ts.Identifier).escapedText as string) !== "props")
        .map((item) => (item.sourceNode as ts.Identifier).escapedText as string),
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
  (sourceFile as any).statements = [...sourceFile!.statements, interfaceOfProps, component];
  const componentElement = factory.createJsxSelfClosingElement(
    factory.createIdentifier(componentName),
    undefined,
    factory.createJsxAttributes([
      ...identifiersReferenceFromOuterScope
        .filter((item) => ((item.sourceNode as ts.Identifier).escapedText as string) !== "props")
        .map((item) =>
          factory.createJsxAttribute(
            factory.createIdentifier((item.sourceNode as ts.Identifier).escapedText as string),
            factory.createJsxExpression(
              undefined,
              factory.createIdentifier((item.sourceNode as ts.Identifier).escapedText as string)
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
            factory.createPropertyAccessExpression(factory.createThis(), factory.createIdentifier(item))
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
    [ts.SyntaxKind.ParenthesizedExpression, ts.SyntaxKind.JsxExpression].includes(
      parentNodeOfSelectedNodes?.kind
    )
  ) {
    (parentNodeOfSelectedNodes.sourceNode as any).expression = componentElement;
  } else if (
    [ts.SyntaxKind.JsxElement, ts.SyntaxKind.JsxFragment].includes(parentNodeOfSelectedNodes?.kind!)
  ) {
    const newChilren = [];
    let insert = false;
    const originSelectedStatements = selectedStatements.map((item) => item.sourceNode);
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
const checkIfSelfClosingElementTagName = (node: doctor.Node) => {
  return (
    node.father?.kind === ts.SyntaxKind.JsxSelfClosingElement &&
    doctor.getPropertyNameBetweenFatherAndSon(node.father!, node) === "tagName"
  );
};
const checkIfOpeningElementTagName = (node: doctor.Node) => {
  return (
    node.father?.father?.kind === ts.SyntaxKind.JsxElement &&
    node.father.kind === ts.SyntaxKind.JsxOpeningElement &&
    doctor.getPropertyNameBetweenFatherAndSon(node.father!, node) === "tagName"
  );
};
export const elementWithSpecifiedAttributesToComponent = async () => {
  const { nodeIdsInSelectedNodes, sourceFile, fullFilename, selectedNodes } = getSelectedCodeInfo();

  assert.equal(nodeIdsInSelectedNodes.size, 1, "please select an element.");
  const [element] = selectedNodes;
  assert.equal(element.kind, ts.SyntaxKind.Identifier, "please select an element.");
  const isSelfClosingElement = checkIfSelfClosingElementTagName(element);
  assert.ok(isSelfClosingElement || checkIfOpeningElementTagName(element), "please select an element");
  const newComponentName = (await vscode.window.showInputBox({
    prompt: "please input component name",
    validateInput: (value) => {
      if (!value) {
        return "component name required.";
      }
      return undefined;
    },
  })) as string;
  if (!newComponentName) {
    return;
  }
  let newComponent;
  let interfaceOfProps;
  let componentName;
  if (isSelfClosingElement) {
    ({
      component: newComponent,
      interfaceOfProps,
      componentName,
    } = doctor.generateFunctionComponent(newComponentName, false, [], [element.father?.sourceNodeAny], {
      isSourceNode: true,
    }));
    const parent = element.father?.father!;
    const propertyName = doctor.getPropertyNameBetweenFatherAndSon(parent, element.father!);
    const newElement = ts.factory.createJsxSelfClosingElement(
      ts.factory.createIdentifier(componentName),
      undefined,
      ts.factory.createJsxAttributes([])
    );
    if (Array.isArray(parent.sourceNodeAny[propertyName])) {
      const idxOfElement = parent.sourceNodeAny[propertyName].findIndex(
        (node: any) => node === element.father?.sourceNodeAny
      );
      parent.sourceNodeAny[propertyName][idxOfElement] = newElement;
    } else {
      parent.sourceNodeAny[propertyName] = newElement;
    }
  } else {
    ({
      component: newComponent,
      interfaceOfProps,
      componentName,
    } = doctor.generateFunctionComponent(
      newComponentName,
      false,
      [],
      [
        ts.factory.createJsxElement(
          ts.factory.createJsxOpeningElement(
            ts.factory.createIdentifier(element.getText()),
            undefined,
            element.father?.sourceNodeAny.attributes
          ),
          [
            factory.createJsxExpression(
              undefined,
              factory.createPropertyAccessExpression(
                factory.createIdentifier("props"),
                factory.createIdentifier("children")
              )
            ),
          ],
          ts.factory.createJsxClosingElement(ts.factory.createIdentifier(element.getText()))
        ) as any,
      ],
      { isSourceNode: true }
    ));
    const parent = element.father?.father!;
    parent.sourceNodeAny.openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier(componentName),
      undefined,
      ts.factory.createJsxAttributes([])
    );
    parent.sourceNodeAny.closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier(componentName)
    );
  }
  (sourceFile as any).statements = [...sourceFile!.statements, interfaceOfProps, newComponent];
  await doctor.writeAstToFile(sourceFile!, fullFilename);
};
