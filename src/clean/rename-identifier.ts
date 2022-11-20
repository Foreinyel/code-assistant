import * as doctor from "@fe-doctor/core";
import * as vscode from "vscode";
import assert from "assert";
import ts from "typescript";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const checkSelectedIdentifierBeforeRename = (
  selectedNodes: doctor.Node[],
  nodeList: doctor.NodeList
) => {
  assert.equal(selectedNodes?.length, 1, "Please select an Identifier");
  const [identifier] = selectedNodes;
  assert.equal(
    identifier.kind,
    ts.SyntaxKind.Identifier,
    "Please select an Identifier"
  );
  const relations = doctor.loadRelationsInModule(nodeList);
  // const relationOfIdentifier = relations.findById(identifier.id);
  // assert.ok(!!relationOfIdentifier, "Please select an Identifier");
  return { identifier, relations };
};
export const renameIdentifierInModule = async () => {
  const { selectedNodesValid, nodeList, programFile } = getSelectedCodeInfo();
  const { identifier, relations } = checkSelectedIdentifierBeforeRename(
    selectedNodesValid,
    nodeList
  );

  const newName = (await vscode.window.showInputBox({
    prompt: "please input new name",
    validateInput: (value) => {
      if (!value) {
        return "name required.";
      }
      return undefined;
    },
  })) as string;
  if (!newName) {
    return;
  }
  const moduleNodeList = doctor.renameIdentifierInModule(
    identifier,
    newName,
    new doctor.ModuleNodeList(programFile, nodeList),
    relations
  );
  await doctor.writeAstToFile(
    moduleNodeList.programFile.ast!,
    moduleNodeList.programFile.getAbsolutePath()
  );
};
