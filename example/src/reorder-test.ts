import ts from "typescript";
import { INode, Node, NodeList } from "../model/NodeList";
import { Non_Readonly } from "../Non_Readonly";
const param = {};
export default useSomeHook;
const [Provider, useContext] = constate(useSomeHook);
function escapeFromAsExpression(currentNode: Non_Readonly<ts.Node & INode>) {
  currentNode = currentNode.sons.find(
    (son) =>
      son.sourceNode === (currentNode.sourceNode as ts.AsExpression).expression
  )!;
  return currentNode;
}
export const escapeParentheses: (node: Node, nodeList?: NodeList) => Node = (
  node
) => {
  let currentNode = node;
  if (currentNode.kind === ts.SyntaxKind.ParenthesizedExpression) {
    let a;
    let b;
    ({ a, b, currentNode } = newFunction(currentNode));
    const c = a + b;
  }
  if (currentNode.kind === ts.SyntaxKind.AsExpression) {
    currentNode = escapeFromAsExpression(currentNode);
  }
  if (node.id !== currentNode.id) {
    return escapeParentheses(currentNode);
  }
  return currentNode;
};
function newFunction(currentNode: Node) {
  const a = 1;
  currentNode = currentNode.sons[0];
  const b = 2;
  return { a, b, currentNode };
}
