import * as doctor from "@fe-doctor/core";
import { ModuleNodeList } from "@fe-doctor/core";
import { getDocumentInfo } from "../common/getDocumentInfo";

export const sortGlobalStatementsInModule = async () => {
  const { nodeList, fullFilename, programFile } = getDocumentInfo({});
  const module = doctor.sortGlobalStatementsInModule(
    new ModuleNodeList(programFile, nodeList)
  );
  await doctor.writeAstToFile(module.programFile.ast!, fullFilename);
};
