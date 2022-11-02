import * as doctor from "@fe-doctor/core";
import assert from "assert";
import ts from "typescript";
import { getSelectedCodeInfo } from "../common/getSelectedCodeInfo";
const checkSelectionBeforeRename = (
  selectedNodes: doctor.Node[],
  nodeList: doctor.NodeList
) => {
  assert.equal(selectedNodes?.length, 1, "Please select a Identifier");
  const [identifier] = selectedNodes;
  assert.equal(
    identifier.kind,
    ts.SyntaxKind.Identifier,
    "Please select a Identifier"
  );
  const relations = doctor.loadRelationsInModule(nodeList);
  const relationOfIdentifier = relations.findById(identifier.id);
  assert.ok(!!relationOfIdentifier, "Please select a Identifier");
};
export const renameIdentifierInModule = async () => {
  const { selectedNodes, nodeList } = getSelectedCodeInfo();
  checkSelectionBeforeRename(selectedNodes, nodeList);
};
