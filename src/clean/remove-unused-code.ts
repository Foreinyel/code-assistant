import * as doctor from "@fe-doctor/core";
import { getDocumentInfo } from "../common/getDocumentInfo";
export const removeUnusedCodeInModule = async () => {
  const { nodeList, fullFilename, programFile } = getDocumentInfo();
  const module = new doctor.ModuleNodeList(programFile, nodeList);
  doctor.removeUnusedImports(module);
  await doctor.writeAstToFile(programFile.ast!, fullFilename);
};
