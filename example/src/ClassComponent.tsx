import React from "react";
import { Button } from "antd";
export default class ClassComponent extends React.Component<any, any> {
  state = {
    wwwww: 1,
  };
  constructor(props) {
    super(props);
    this.state.wwwww = 3;
  }
  setAAA = () => {
    this.setState({ wwwww: 3 });
  };
  render() {
    const { state: sssssss } = this;
    const { wwwww: ccdsd } = this.state;
    console.log(`🚀 ~ file: ClassComponent.tsx:15 ~ ClassComponent ~ render ~ aaa`, ccdsd, sssssss.wwwww);
    return (
      <div>
        <div>{this.state.wwwww}</div>
        <div>{this.props.name}</div>
        <Button onClick={this.setAAA}>点击</Button>
      </div>
    );
  }
}
