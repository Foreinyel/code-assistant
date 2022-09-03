import * as vscode from "vscode";

export const runCommand = (run: (args: any[]) => Promise<void>) => {
  return async (args: any[]) => {
    try {
      await run(args);
    } catch (err) {
      vscode.window.showErrorMessage((err as any).message);
    }
  };
};
