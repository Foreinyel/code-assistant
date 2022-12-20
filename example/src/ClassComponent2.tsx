class Comp {
  state = {
    a: {
      b: {
        c: {
          d: {
            e: 1,
          },
        },
      },
    },
  };

  render() {
    const { state } = this;
    const { a } = state;
    const {
      a: { b },
    } = state;
    const {
      a: {
        b: { c },
      },
    } = this.state;
    const {
      b: {
        c: {
          d: { e },
        },
      },
    } = this.state.a;
    return { e, a, b, c };
  }
}
