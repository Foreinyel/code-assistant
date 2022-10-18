import ts from "typescript";
import { ModuleNodeList, Node, NodeList } from "../model/NodeList";
import { isExported } from "../nodeListProcesser/isExported";
import * as nodeAccessor from "../nodeListProcesser/nodeAccess";
import { reloadModuleNodeList } from "../loadNodeList";
const getSourceFileNode = ({ nodeList }: { nodeList: NodeList }) => {
  const sourceFileNode = nodeList.find(
    (node) => node.kind === ts.SyntaxKind.SourceFile
  );
  return { sourceFileNode };
};
const getGlobalStatements = ({
  nodeList,
  sourceFileNodeId,
}: {
  nodeList: NodeList;
  sourceFileNodeId: number;
}) => {
  const globalStatements = nodeList.filter(
    (node) => node.parentId === sourceFileNodeId
  );
  return { globalStatements };
};
export const sortGlobalStatementsInModule = (module: ModuleNodeList) => {
  const nodeList = module.nodeList;
  const { sourceFileNode } = getSourceFileNode({ nodeList });
  const { globalStatements } = getGlobalStatements({
    nodeList,
    sourceFileNodeId: sourceFileNode!.id,
  });
  const importNativeModules: Node[] = [];
  const importLocalModules: Node[] = [];
  const enumDeclarations: Node[] = [];
  const exportEnumDeclarations: Node[] = [];
  const variableStatements: Node[] = [];
  const exportVariableStatements: Node[] = [];
  const typeAliasDeclarations: Node[] = [];
  const exportTypeAliasDeclarations: Node[] = [];
  const interfaceDeclarations: Node[] = [];
  const exportInterfaceDeclarations: Node[] = [];
  const functionDeclarations: Node[] = [];
  const exportFunctionDeclarations: Node[] = [];
  const otherStatements: Node[] = [];
  const exportDeclarations: Node[] = [];
  const exportAssignment: Node[] = [];
  for (let node of globalStatements) {
    const statement = node;
    switch (statement.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        const moduleSpecifier = nodeAccessor.getImportModuleName(statement);
        if (moduleSpecifier?.startsWith(".")) {
          importLocalModules.push(statement);
        } else {
          importNativeModules.push(statement);
        }
        break;
      case ts.SyntaxKind.EnumDeclaration:
        if (isExported(statement)) {
          exportEnumDeclarations.push(statement);
        } else {
          enumDeclarations.push(statement);
        }
        break;
      case ts.SyntaxKind.VariableStatement:
        if (isExported(statement)) {
          exportVariableStatements.push(statement);
        } else {
          variableStatements.push(statement);
        }
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        if (isExported(statement)) {
          exportTypeAliasDeclarations.push(statement);
        } else {
          typeAliasDeclarations.push(statement);
        }
        break;
      case ts.SyntaxKind.InterfaceDeclaration:
        if (isExported(statement)) {
          exportInterfaceDeclarations.push(statement);
        } else {
          interfaceDeclarations.push(statement);
        }
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        if (isExported(statement)) {
          exportFunctionDeclarations.push(statement);
        } else {
          functionDeclarations.push(statement);
        }
        break;
      case ts.SyntaxKind.ExportDeclaration:
        exportDeclarations.push(statement);
        break;
      case ts.SyntaxKind.ExportAssignment:
        exportAssignment.push(statement);
        break;
      default:
        otherStatements.push(statement);
    }
  }
  (sourceFileNode!.sourceNode as any).statements = [
    ...importNativeModules.map((item) => item.sourceNode),
    ...importLocalModules.map((item) => item.sourceNode),
    ...enumDeclarations.map((item) => item.sourceNode),
    ...typeAliasDeclarations.map((item) => item.sourceNode),
    ...interfaceDeclarations.map((item) => item.sourceNode),
    ...variableStatements.map((item) => item.sourceNode),
    ...functionDeclarations.map((item) => item.sourceNode),
    ...otherStatements.map((item) => item.sourceNode),
    ...exportEnumDeclarations.map((item) => item.sourceNode),
    ...exportTypeAliasDeclarations.map((item) => item.sourceNode),
    ...exportInterfaceDeclarations.map((item) => item.sourceNode),
    ...exportVariableStatements.map((item) => item.sourceNode),
    ...exportFunctionDeclarations.map((item) => item.sourceNode),
    ...exportDeclarations.map((item) => item.sourceNode),
    ...exportAssignment.map((item) => item.sourceNode),
  ];
  const newNodeList = reloadModuleNodeList(module.programFile);
  return new ModuleNodeList(module.programFile, newNodeList);
};

export const reorderGlobalStatements = (module: ModuleNodeList) => {
  const nodeList = module.nodeList;
  const { sourceFileNode } = getSourceFileNode({ nodeList });
  const { globalStatements } = getGlobalStatements({
    nodeList,
    sourceFileNodeId: sourceFileNode!.id,
  });
};
