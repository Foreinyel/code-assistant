import * as vscode from "vscode";

export const runCommand = (run: (args: any[]) => void) => {
  return async (args: any[]) => {
    try {
      run(args);
    } catch (err) {
      vscode.window.showErrorMessage((err as any).message);
    }
  };
};
