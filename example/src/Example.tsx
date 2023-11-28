import React from "react";
interface ExampleProps {
}
interface WhoIAmProps {
}
interface WhoAmIProps {
}
const WhoIAm: React.FC<WhoIAmProps> = (props) => {
    return <div className="f-28 red lh-28 underline">{props.children}</div>;
};
const WhoAmI: React.FC<WhoAmIProps> = props => {

  const fa = (a) => a ? <div >{a}</div> : null

    return <div />;
};
export const Example = (props: ExampleProps) => {
    const [name, setName] = React.useState("jvs");
    const whoIam = <>
      <WhoIAm>I am {name}.</WhoIAm></>;
    return (<div>
      Hello, <span onClick={() => setName("JVS")}>world!</span>{whoIam}
    </div>);
};
