import * as React from "react";
interface ButtonProps {}
interface LinkProps {}
interface PrimaryButtonProps {}
const Button: React.FC<ButtonProps> = (props) => {
  return <div />;
};
const Link: React.FC<LinkProps> = (props) => {
  return <div />;
};
const PrimaryButton: React.FC<PrimaryButtonProps> = (props) => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <div>{count}</div>
      <div onClick={() => setCount(count + 1)}>dianji</div>
      <div>{props.onClick}</div>
    </div>
  );
};
