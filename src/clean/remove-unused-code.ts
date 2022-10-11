import * as doctor from "@fe-doctor/core";
import { getDocumentInfo } from "../common/getDocumentInfo";
export const removeUnusedCodeInModule = async () => {
  const { nodeList, fullFilename, programFile } = getDocumentInfo();
  let module = new doctor.ModuleNodeList(programFile, nodeList);

  module = doctor.removeUnusedGlobalDeclarations(module);

  doctor.removeUnusedImports(module);
  await doctor.writeAstToFile(programFile.ast!, fullFilename);
};
