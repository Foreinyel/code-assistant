import * as vscode from "vscode";

const ab = async () => {};

const e = 3;
export const a = async (b) => {
  const bb = b + 1;
  const bbb = bb * 2;
  const ccc = bb * 3;
  const ddd = ccc + e;
  const editor = vscode.window.activeTextEditor;
  await ab();

  return { bbb, ccc, ddd };
};

export const isEmpty = (val) => val === undefined || val === null || val === "";

function b(values, field, result) {
  if (field in values) {
    const value = values[field];
    if (value) {
      if (!isEmpty(value.min) || !isEmpty(value.max)) {
        result[field] = {
          lower: value.min,
          upper: value.max,
        };
      } else if (!!value?.range?.lower || !!value?.range?.upper) {
        result[field] = {
          ...value?.range,
        };
      } else {
        result[field] = undefined;
      }
    } else {
      result[field] = undefined;
    }
  }
}

function func_with_return() {
  const f1 = 1;
  const f2 = f1 + 2;
  const f3 = () => {
    return f1 * f2;
  };

  return f3();
}
