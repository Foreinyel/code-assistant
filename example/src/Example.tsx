import React from "react";
interface ExampleProps {
}
export const Example = (props: ExampleProps) => {
    const [name, setName] = React.useState("jvs");
    const whoIam = <>
      <WhoIAm>I am {name}.</WhoIAm></>;
    return (<div>
      Hello, <span onClick={() => setName("JVS")}>world!</span>{whoIam}
    </div>);
};
interface WhoIAmProps {
}
const WhoIAm: React.FC<WhoIAmProps> = (props) => {
    return <div className="f-28 red lh-28 underline">{props.children}</div>;
};
