import * as vscode from "vscode";
import { getDocumentInfo } from "../common/getDocumentInfo";
import ts from "typescript";
import * as doctor from "@fe-doctor/core";
export const markDeadCode = async (document: vscode.TextDocument) => {
  try {
    const { nodeList, editor } = getDocumentInfo();
    const decorationType = vscode.window.createTextEditorDecorationType({
      opacity: "0.467",
    });

    editor.setDecorations(decorationType, []);

    const deadNodeList: doctor.Node[] = [];

    const functions = nodeList.filter((item) =>
      [ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.ArrowFunction].includes(item.kind)
    );

    for (let func of functions) {
      const deadNodes = doctor.findDeadCodeInFunction(func);
      deadNodeList.push(...deadNodes);
    }

    const ranges = deadNodeList.map((item) => {
      return {
        renderOptions: {},
        range: new vscode.Range(
          new vscode.Position(item.line?.start!, item.character?.start!),
          new vscode.Position(item.line?.end!, item.character?.end!)
        ),
      };
    });

    editor.setDecorations(decorationType, ranges as any);
  } catch (err) {
  }
};
