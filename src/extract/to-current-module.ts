import * as vscode from "vscode";
import { loadNodeListByFile } from "@fe-doctor/core";

export const toCurrentModule = () => {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    return;
  }
  const { selections } = editor;
  if (selections.length !== 1) {
    // 这里要弹出error提示：请选择一个连续的代码块！
    return;
  }
};
