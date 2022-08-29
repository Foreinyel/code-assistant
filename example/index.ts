const e = 3;
export const a = (b) => {
  const bb = b + 1;
  const { bbb, ccc, ddd } = fff({ bb });
  return { bbb, ccc, ddd };
};
const fff = ({ bb }) => {
  const bbb = bb * 2;
  const ccc = bb * 3;
  const ddd = ccc + e;
  return { bbb, ccc, ddd };
};
