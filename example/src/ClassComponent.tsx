import React from "react";
import { Button } from "antd";
export default class ClassComponent extends React.Component<any, any> {
  state = {
    mmmm: 1,
  };
  constructor(props) {
    super(props);
    this.state.mmmm = 3;
  }
  setAAA = () => {
    this.setState({ mmmm: 3 });
  };
  render() {
    const { state: sssssss } = this;
    const { mmmm: ccdsd } = this.state;
    console.log(`🚀 ~ file: ClassComponent.tsx:15 ~ ClassComponent ~ render ~ aaa`, ccdsd, sssssss.mmmm);
    return (
      <div>
        <div>{this.state.mmmm}</div>
        <div>{this.props.name}</div>
        <Button onClick={this.setAAA}>点击</Button>
      </div>
    );
  }
}
