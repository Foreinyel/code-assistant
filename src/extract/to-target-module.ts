import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import * as ts from "typescript";
import * as hm from "@hemyn/utils-node";
import path from "path";
import assert from "assert";
import { ModuleNodeList } from "@fe-doctor/core";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
/**
 * 提取方法到公用模块
 */
export const toTargetModule = async () => {
  const { nodeList, nodeIdsInSelectedNodes, rootPath, projectName } =
    getSelectedCodeInfo();
  const { selectedStatements } = doctor.findReferredIdentifiersOfNodeList(
    nodeList,
    nodeIdsInSelectedNodes
  );
  // 一次只能移动一个statement，并且这个statement在module的全局中定义
  assert.equal(selectedStatements.length, 1, "Only one statement at a time.");
  const [selectedStatement] = selectedStatements;
  assert.equal(
    nodeList.find((item) => item.id === selectedStatement.parentId)?.kind,
    ts.SyntaxKind.SourceFile,
    "Selected statement should be in global scope of module."
  );
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
