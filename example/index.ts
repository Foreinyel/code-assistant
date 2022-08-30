import * as vscode from "vscode";

const e = 3;
export const a = (b) => {
  const bb = b + 1;
  const bbb = bb * 2;
  const ccc = bb * 3;
  const ddd = ccc + e;
  const editor = vscode.window.activeTextEditor;

  return { bbb, ccc, ddd };
};
