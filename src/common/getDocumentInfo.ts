import * as doctor from "@fe-doctor/core";
import * as path from "path";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { getProjectInfo } from "./getProjectInfo";
export const getDocumentInfo = () => {
  const { editor, rootPath, projectName } = getProjectInfo();
  assert.ok(!!editor, "invalid editor.");
  const { document } = editor;
  const fullFilename = document.fileName;
  const relativePath = path.relative(rootPath, fullFilename);
  const filename = path.basename(fullFilename);
  const programFile = new doctor.ProgramFile(
    projectName,
    rootPath,
    relativePath,
    filename
  );
  const nodeList = doctor.loadNodeListByFile(programFile, undefined, true);
  const sourceFile = programFile.ast;
  return {
    editor,
    document,
    nodeList,
    sourceFile,
    fullFilename,
    rootPath,
    projectName,
    programFile,
  };
};
