import React from "react";
interface ExampleProps {}
export const Example = (props: ExampleProps) => {
  const [name, setName] = React.useState("jvs");
  return (
    <div>
      Hello, <span onClick={() => setName("JVS")}>world!</span>
      <WhoIAm>I am {name}.</WhoIAm>
    </div>
  );
};
interface WhoIAmProps {}
const WhoIAm: React.FC<WhoIAmProps> = (props) => {
  return <div className="f-28 red lh-28 underline">{props.children}</div>;
};
