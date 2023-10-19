import { getDocumentInfo } from "../common/getDocumentInfo";
import * as vscode from "vscode";
import * as doctor from "@fe-doctor/core";
import ts from "typescript";

export const newEnumInModule = async () => {
  const { nodeList, sourceFile, programFile } = getDocumentInfo();

  const newEnumName = (await vscode.window.showInputBox({
    // title: "test",
    prompt: "please input new enum name",
    validateInput: (value) => {
      if (!value) {
        return "enum name required.";
      }
      return undefined;
    },
    ignoreFocusOut: true,
  })) as string;
  if (!newEnumName) {
    return;
  }

  const enumNodes = doctor.generateEnum(newEnumName);

  const isSymbolDuplicated = nodeList.find(
    (item) =>
      item.kind === ts.SyntaxKind.Identifier && (item.sourceNode as ts.Identifier).escapedText === newEnumName
  );

  if (isSymbolDuplicated) {
    vscode.window.showErrorMessage(`${newEnumName} duplicated in current module.`);
    return;
  }

  (sourceFile as any).statements = [...(sourceFile as any).statements, ...enumNodes];
  const newNodeList = doctor.reloadModuleNodeList(programFile);

  const module = doctor.reorderGlobalStatements(new doctor.ModuleNodeList(programFile, newNodeList));

  await doctor.writeAstToFile(module.programFile.ast!, programFile.getAbsolutePath());
};
