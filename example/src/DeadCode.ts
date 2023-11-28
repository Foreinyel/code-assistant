function A(a) {
    if (true) {
        return 3;
        const v = 4;
    }
    return a;
}
export enum Abc {
    Key = "value"
}
export const AbcDesc = {
    [Abc.Key]: "label"
};
export const AbcList = Object.keys(AbcDesc).map(value => ({ value, label: AbcDesc[value] }));
