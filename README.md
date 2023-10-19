# code-assistant

`JVS` is a tool of Code Automation. It can help you to write clean code, do code refactoring. Overall, it helps you write better code.

[中文](./README_zh.md)

## Features

### Extract

#### extract statements to current module

![extract statements to current module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.statements.toCurrentModule.gif)

#### extract statement to target module

![extract statement to target module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.statement.toTargetModule.gif)

#### extract statement to new module

![extract statement to new module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.statement.toNewModule.gif)

#### extract elements to component

![extract elements to component](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.elements.toComponent.gif)

#### extract element with specific attributes

![extract elements with specific attributes](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.elementWithSpecifiedAttributes.toComponent.gif)

#### extract expression to current module

![extract expression to current module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.expression.toCurrentModule.gif)

#### extract expression to current block

![extract expression to current block](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.expression.toCurrentBlock.gif)

#### extract elements to current block

![extract elements to current block](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.elements.toCurrentBlock.gif)

#### extract constant to current module

![extract constant to current module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/extract.constant.toCurrentModule.gif)

### Clean

#### remove unused code

![remove unused code](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/removeUnusedCode.gif)

#### reorder global statements

![reorder global statements](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/reorderGlobalStatements.gif)

#### rename identifier in module

![renameIdentifierInModule](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/renameIdentifierInModule.gif)

### Generate

#### generate new function component in folder

![generate new function component in folder](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/generate.newFunctionComponent.inFolder.gif)

#### generate new function component in module

![generate new function component in module](https://raw.githubusercontent.com/Foreinyel/code-assistant/main/how-to-use/generate.newFunctionComponent.inModule.gif)

#### generate new enum in module

```
export enum Abc {
    Key = "value"
}
export const AbcDesc = {
    [Abc.Key]: "label"
};
export const AbcList = Object.keys(AbcDesc).map(value => ({ value, label: AbcDesc[value] }));

```
