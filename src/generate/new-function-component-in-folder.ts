import * as hm from "@hemyn/utils-node";
import * as vscode from "vscode";
import path from "path";
import * as doctor from "@fe-doctor/core";
import ts from "typescript";
import { getProjectInfo } from "../common/getProjectInfo";
/**
 * @description 在文件夹中创建组件
 */
export const newFunctionComponentInFolder = async () => {
  const { rootPath, projectName } = getProjectInfo({});
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
  const configuration = vscode.workspace.getConfiguration("jvs-code-assistant");
  let folderList = await hm.listFolders(
    path.resolve(rootPath, configuration.src),
    [path.resolve(rootPath, "node_modules")]
  );
  folderList = folderList.filter((item) => item.indexOf("node_modules") < 0);
  const targetFolder = await vscode.window.showQuickPick(
    folderList.map((item) => path.relative(rootPath, item)),
    {
      placeHolder: "please select a folder",
      ignoreFocusOut: true,
    }
  );
  if (!targetFolder) {
    return;
  }
  const { interfaceOfProps, component, componentName } =
    doctor.generateFunctionComponent(newComponentName, true);
  const ast = ts.factory.createSourceFile(
    [
      interfaceOfProps,
      component,
      ts.factory.createExportAssignment(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier(componentName)
      ),
    ],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  );
  const programFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    path.relative(
      rootPath,
      path.resolve(rootPath, targetFolder, `${componentName}.tsx`)
    ),
    `${componentName}.tsx`
  );
  programFile.ast = ast;
  let nodeList = doctor.reloadModuleNodeList(programFile);
  nodeList = doctor.batchImportFrom(
    [
      {
        defaultAlias: "React",
        moduleSpecifier: "react",
      },
    ],
    nodeList,
    programFile
  );
  await doctor.writeAstToFile(programFile.ast!, programFile.getAbsolutePath());
};
