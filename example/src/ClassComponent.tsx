import React from "react";
import { Button } from "antd";
export default class ClassComponent extends React.Component<any, any> {
  state = {
    a: 1,
  };
  constructor(props) {
    super(props);
  }
  setAA = () => {
    this.setState({ a: 3 });
  };
  render() {
    return (
      <div>
        <div>{this.state.a}</div>
        <div>{this.props.name}</div>
        <Button onClick={this.setAA}>点击</Button>
      </div>
    );
  }
}
