import { constate, useRequest } from "ahooks";
import Api from "../api";
const param = {};
const staticReqParam = {
    param,
};
const useSomeHook: () => any = () => {
    const { loading, run } = useRequest(Api.someRequest, staticReqParam);
};
const [Provider, useContext] = constate(useSomeHook);
export { Provider, useContext };
export default useSomeHook;
function escapeFromParenthesesExpression(currentNode: Non_Readonly<ts.Node & INode>) {
    currentNode = currentNode.sons[0];
    return currentNode;
}
function escapeFromAsExpression(currentNode: Non_Readonly<ts.Node & INode>) {
    currentNode = currentNode.sons.find((son) => son.sourceNode === (currentNode.sourceNode as ts.AsExpression).expression)!;
    return currentNode;
}
export const escapeParentheses: (node: Node, nodeList?: NodeList) => Node = (node) => {
    let currentNode = node;
    currentNode = escapeFromParenthesesExpression(currentNode);
    currentNode = escapeFromAsExpression(currentNode);
    return escapeParentheses(currentNode);
};
