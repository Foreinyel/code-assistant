import { WhoAmI, WhoAmIProps } from "./WhoAmI";
import React from "react";
interface ExampleProps {
}
export const Example = (props: ExampleProps) => {
    const [name, setName] = React.useState("jvs");
    const whoIam = <>
      <div>I am {name}.</div></>;
    return (<div>
      Hello, <span onClick={() => setName("JVS")}>world!</span>{whoIam}
    </div>);
};
