import React from "react";
import { Button } from "antd";
export default class ClassComponent extends React.Component<any, any> {
    state = {
        opop: 1,
    };
    constructor(props) {
        super(props);
    }
    setAAA = () => {
        this.setState({ a: 3 });
    };
    render() {
        const { state: ssss } = this;
        const { opop: vvvv } = this.state;
        console.log(`🚀 ~ file: ClassComponent.tsx:15 ~ ClassComponent ~ render ~ aaa`, vvvv, ssss.opop);
        return (<div>
        <div>{this.state.opop}</div>
        <div>{this.props.name}</div>
        <Button onClick={this.setAAA}>点击</Button>
      </div>);
    }
}
