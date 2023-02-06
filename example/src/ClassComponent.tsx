import React from "react";
export default class ClassComponent extends React.Component<any, any> {
  state = {
    ppppp: 1,
  };
  constructor(props) {
    super(props);
    this.state.ppppp = 3;
  }
  setAAA = () => {
    this.setState({ ppppp: 3 });
  };
  render() {
    const { ppppp: ccdsd } = this.state;
    console.log(ccdsd);
    return <div>{this.state.ppppp}</div>;
  }
}
