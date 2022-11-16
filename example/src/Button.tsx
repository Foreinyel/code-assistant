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
      <Dddd count={count} setCount={setCount} onClick={props.onClick} />
    </div>
  );
};
interface DdddProps {
  count: any;
  setCount: any;
  onClick: any;
}
const Dddd: React.FC<DdddProps> = (props) => {
  const { count, setCount, onClick } = props;
  return (
    <>
      <div>{count}</div>
      <div onClick={() => setCount(count + 1)}>dianji</div>
      <div>{onClick}</div>
    </>
  );
};
