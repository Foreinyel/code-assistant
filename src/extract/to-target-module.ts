import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import * as ts from "typescript";
import * as hm from "@hemyn/utils-node";
import path from "path";
import assert from "assert";
import { ModuleNodeList } from "@fe-doctor/core";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const pickTargetModule = async (rootPath: any) => {
  const configuration = vscode.workspace.getConfiguration("jvs-code-assistant");
  let filesInSrc = await hm.listFiles(
    path.resolve(rootPath, configuration.src),
    [
      path.resolve(rootPath, "node_modules"),
      ...(configuration.excludes as string[]).map((item) =>
        path.resolve(rootPath, configuration.src, item)
      ),
    ]
  );
  filesInSrc = filesInSrc.filter(
    (item) => item.endsWith("ts") || item.endsWith("tsx")
  );
  const targetModule = await vscode.window.showQuickPick(
    filesInSrc.map((item) => path.relative(rootPath, item)),
    {
      placeHolder: "please select a file",
      ignoreFocusOut: true,
    }
  );
  return targetModule;
};
const prepareBeforeExtract = () => {
  const {
    nodeList,
    nodeIdsInSelectedNodes,
    rootPath,
    projectName,
    fullFilename,
  } = getSelectedCodeInfo();
  const { selectedStatements } = doctor.findReferredInfoOfNodeIds(
    nodeIdsInSelectedNodes,
    nodeList
  );
  // 一次只能移动一个statement，并且这个statement在module的全局中定义
  assert.equal(selectedStatements.length, 1, "Only one statement at a time.");
  const [selectedStatement] = selectedStatements;
  assert.equal(
    nodeList.find((item) => item.id === selectedStatement.parentId)?.kind,
    ts.SyntaxKind.SourceFile,
    "Selected statement should be in global scope of module."
  );
  return { rootPath, projectName, selectedStatement, nodeList, fullFilename };
};
const checkIfSingleDeclarationInVariableStatement = (
  selectedStatement: doctor.Node
) => {
  return (
    selectedStatement.kind === ts.SyntaxKind.VariableStatement &&
    (selectedStatement.sourceNode as ts.VariableStatement)?.declarationList
      ?.declarations?.length === 1
  );
};
export const toNewModule = async () => {
  const { fullFilename, selectedStatement, nodeList, projectName, rootPath } =
    prepareBeforeExtract();
  let newModuleName: string | null = null;
  if (checkIfSingleDeclarationInVariableStatement(selectedStatement)) {
    const variableDeclarationList = selectedStatement.sons.filter(
      (node) => node.kind === ts.SyntaxKind.VariableDeclarationList
    );
    const variableDeclaration = variableDeclarationList[0].sons[0];
    const names = doctor.getVariableNamesOfVariableDeclaration(
      variableDeclaration,
      nodeList
    );
    if (names.length === 1) {
      newModuleName = names[0];
    }
  } else if (
    [
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ClassDeclaration,
      ts.SyntaxKind.EnumDeclaration,
      ts.SyntaxKind.InterfaceDeclaration,
      ts.SyntaxKind.TypeAliasDeclaration,
    ].includes(selectedStatement.kind)
  ) {
    newModuleName = (selectedStatement.sourceNode as any)?.name
      ?.escapedText as string;
  }
  if (!newModuleName) {
    newModuleName = (await vscode.window.showInputBox({
      prompt: "please input new module name",
      validateInput: (value) => {
        if (!value) {
          return "new module name required.";
        }
        return undefined;
      },
    })) as string;
    if (!newModuleName) {
      return;
    }
  }
  const newModuleFullFilename = path.resolve(
    fullFilename,
    "..",
    `${newModuleName}${path.extname(fullFilename)}`
  );
  const newModuleFilename = path.basename(newModuleFullFilename);
  const newModuleProgramFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    path.resolve(rootPath, newModuleFullFilename),
    newModuleFilename
  );
  newModuleProgramFile.ast = ts.factory.createSourceFile(
    [],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  );
  const newModuleNodeList = doctor.reloadModuleNodeList(newModuleProgramFile);
  doctor.moveGlobalStatementToTargetModule(
    selectedStatement.id,
    new ModuleNodeList(selectedStatement.programFile, nodeList),
    new ModuleNodeList(newModuleProgramFile, newModuleNodeList)
  );
  await doctor.writeAstToFile(
    selectedStatement.programFile.ast!,
    selectedStatement.programFile.getAbsolutePath()
  );
  await doctor.writeAstToFile(
    newModuleProgramFile.ast!,
    newModuleProgramFile.getAbsolutePath()
  );
};
/**
 * 提取方法到公用模块
 */
export const toTargetModule = async () => {
  const { rootPath, projectName, selectedStatement, nodeList } =
    prepareBeforeExtract();
  const targetModule = await pickTargetModule(rootPath);
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
  doctor.moveGlobalStatementToTargetModule(
    selectedStatement.id,
    new ModuleNodeList(selectedStatement.programFile, nodeList),
    new ModuleNodeList(targetProgramFile, targetNodeList)
  );
  await doctor.writeAstToFile(
    selectedStatement.programFile.ast!,
    selectedStatement.programFile.getAbsolutePath()
  );
  await doctor.writeAstToFile(
    targetProgramFile.ast!,
    targetProgramFile.getAbsolutePath()
  );
};
