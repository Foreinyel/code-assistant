import * as vscode from "vscode";
import { getDocumentInfo } from "../common/getDocumentInfo";
import * as doctor from "@fe-doctor/core";
import ts from "typescript";

/**
 * @description 在当前模块创建组件
 */
export const newFunctionComponentInModule = async () => {
  const { nodeList, sourceFile, programFile, fullFilename } = getDocumentInfo(
    {}
  );

  if (!fullFilename.endsWith(".tsx")) {
    vscode.window.showErrorMessage(`Module must end with 'tsx'`);
    return;
  }

  const newComponentName = (await vscode.window.showInputBox({
    // title: "test",
    prompt: "please input new component name",
    validateInput: (value) => {
      if (!value) {
        return "component name required.";
      }
      return undefined;
    },
    ignoreFocusOut: true,
  })) as string;
  if (!newComponentName) {
    return;
  }

  const { interfaceOfProps, component, componentName } =
    doctor.generateFunctionComponent(newComponentName);

  const isSymbolDuplicated = nodeList.find(
    (item) =>
      item.kind === ts.SyntaxKind.Identifier &&
      (item.sourceNode as ts.Identifier).escapedText === componentName
  );

  if (isSymbolDuplicated) {
    vscode.window.showErrorMessage(
      `${componentName} duplicated in current module.`
    );
    return;
  }

  (sourceFile as any).statements = [
    ...(sourceFile as any).statements,
    interfaceOfProps,
    component,
  ];

  const newNodeList = doctor.reloadModuleNodeList(programFile);

  const module = doctor.sortGlobalStatementsInModule(
    new doctor.ModuleNodeList(programFile, newNodeList)
  );

  await doctor.writeAstToFile(
    module.programFile.ast!,
    programFile.getAbsolutePath()
  );
};
