import { getDocumentInfo } from "../common/getDocumentInfo";
import * as doctor from "@fe-doctor/core";
export const removeUnusedCodeInModule = async () => {
  const { nodeList, fullFilename, programFile } = getDocumentInfo();
  const module = new doctor.ModuleNodeList(programFile, nodeList);
  doctor.removeUnusedCodeInModule(module);
};
