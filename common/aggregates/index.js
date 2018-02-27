export default [
    {
        name: 'Todo',
        commands: {
            createItem: (_, { payload: { id, text } }) => ({
                type: 'ITEM_CREATED',
                payload: { id, text }
            }),
            checkItem: (_, { payload: { id } }) => ({
                type: 'ITEM_CHECKED',
                payload: { id }
            }),
            uncheckItem: (_, { payload: { id } }) => ({
                type: 'ITEM_UNCHECKED',
                payload: { id }
            }),
            removeItem: (_, { payload: { id } }) => ({
                type: 'ITEM_REMOVED',
                payload: { id }
            })
        }
    }
];
