export default [
  {
      name: 'Todos',
      projection: {
          Init: () => ({}),
          ITEM_CREATED: (state, { payload: { id, text } }) => ({
              ...state,
              [id]: {
                  text,
                  checked: false
              }
          }),
          ITEM_CHECKED: (state, { payload: { id } }) => ({
              ...state,
              [id]: {
                  ...state[id],
                  checked: true
              }
          }),
          ITEM_UNCHECKED: (state, { payload: { id } }) => ({
            ...state,
            [id]: {
                ...state[id],
                checked: false
            }
        }),
          ITEM_REMOVED: (state, { payload: { id } }) => {
              const nextState = { ...state };
              delete nextState[id];
              return nextState;
          }
      },
      serializeState: state => JSON.stringify(state),
      deserializeState: state => JSON.parse(state)
  }
];
