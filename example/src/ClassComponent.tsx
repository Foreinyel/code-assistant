import React from "react";
import { Button } from "antd";
export default class ClassComponent extends React.Component<any, any> {
  state = {
    aaa: 1,
  };
  constructor(props) {
    super(props);
  }
  setAAA = () => {
    this.setState({ a: 3 });
  };
  render() {
    const { aaa } = this.state;
    console.log(`🚀 ~ file: ClassComponent.tsx:15 ~ ClassComponent ~ render ~ aaa`, aaa);
    return (
      <div>
        <div>{this.state.aaa}</div>
        <div>{this.props.name}</div>
        <Button onClick={this.setAAA}>点击</Button>
      </div>
    );
  }
}
