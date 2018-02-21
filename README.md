
# **Using ReSolve with ReactXP application**
## Create a new ReSolve Application

Use the **[create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)** CLI tool to create a new reSolve project.

First we should install **create-resolve-app** package globally.

```bash
npm i -g create-resolve-app
```

Create an empty **reSolve** project and run the application in the development mode.

```bash
create-resolve-app resolve-reactxp-todo
```

Now we have a sample backend and a web application. To check if everything is all right type the following commands.

## Create a new React Native Application

Use the **[create-react-native-app](https://github.com/react-community/create-react-native-app)** CLI tool to create a new react native project.

Install **create-react-native-app** globally.

```bash
npm i -g create-react-native-app
```

Create a default react native project.

```bash
create-react-native-app resolve-reactxp-todo-rn
```

Now we have a sample react native application. To embed it as a platform to our **ReSolve** project we must merge the same files for both projects and copy other files (except node_modules).
Files to merge:

* .flowconfig
* .gitignore
* package.json

Files to copy:

* .babel.rc
* App.js
* app.json
* App.test
* .watchmanconfig

Now we ready to setup ReactXP

# Set up ReactXP infrastructure

## Add ReactXP packages dependencies

Add (or change) these npm dependencies to your `package.json`.

```json
"react-native": "^0.51.0",
"react-native-windows": "^0.51.0-rc.1",
"reactxp": "^0.51.0",
"reactxp-imagesvg": "^0.2.8",
"reactxp-navigation": "^1.0.15",
"reactxp-video": "^0.2.3"
```

## Environment variables
Since `Resolve` uses enviroment variables and react native does not support them, you should install additional babel plugin for support of inline environment variables.

Add dev dependency to your `package.json`.

```json
"babel-plugin-transform-inline-environment-variables": "^0.3.0"
```

Add **transform-inline-environment-variables** to your `.babelrc` plugins array.

```json
{
  "presets": ["babel-preset-expo"],
  "env": {
    "development": {
      "plugins": [
        "transform-react-jsx-source",
        "transform-inline-environment-variables"
      ]
    }
  }
}

```

Now install all of the dependencies.

```bash
npm install
```

# Client index file

Create `client/index.js`.

```js
import React from 'react'
import RX from 'reactxp'
import { Provider } from 'react-redux'

import clientConfig from '../resolve.client.config'

const { rootComponent: RootComponent, createStore } = clientConfig
const store = createStore(window.__INITIAL_STATE__)

RX.App.initialize(true, true)
RX.UserInterface.setMainView(
  <Provider store={store}>
    <RootComponent />
  </Provider>
)
```

Modify react native `App.js` index file.

```js
import App from './client/index';

export default App;
``` 

Modify expo application `app.json` file.

```js
{
  "expo": {
    "sdkVersion": "25.0.0",
    "appKey": "RXApp"
  }
}
```


## Web

For `web` application update `dev` and `build` sctipts in `package.json` file.

```json
"build": "INDEX=client/index.js resolve-scripts build",
"dev": "INDEX=client/index.js resolve-scripts dev",
```

## ReactXP scripts

Add these scripts to `package.json`.

```json
"rxp-start": "ROOT_PATH=http://172.22.1.49:3000 react-native-scripts start",
"rxp-android": "ROOT_PATH=http://172.22.1.49:3000 react-native-scripts android",
"rxp-ios": "ROOT_PATH=http://172.22.1.49:3000 react-native-scripts ios",
"rxp-eject": "react-native-scripts eject",
"rxp-test": "node node_modules/jest/bin/jest.js",
```

Specify the main script to run sample in expo.

```json
"main": "./node_modules/expo/AppEntry.js",
```

## ReactXP Hello World

Replace `React` components with `ReactXP` components in `client/components/App.js` in order to run application on all platforms.

```js
import React from 'react'
import {
  Component,
  Styles,
  View,
  Text,
} from 'reactxp'

const styles = {
  container: Styles.createViewStyle({
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  }),
  header: Styles.createTextStyle({
    fontSize: 32,
    marginBottom: 12
  })
}

class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Hello world!</Text>
      </View>
    )
  }
}

export default App
```

Start backend and web server with `npm run dev`.
Start react native packager (in separate terminal) with `rxp-start`.


Now you can open Hello World in browser at http://localhost:3000.
Read QR-code from console by **Expo** app.


# Todo Application

## Aggreagate

Update `common/aggregates/index.js`.

```js
export default [
  {
      name: 'Todo',
      commands: {
          createItem: (_, { payload: { id, text } }) => ({
              type: 'ITEM_CREATED',
              payload: { id, text }
          }),
          toggleItem: (_, { payload: { id } }) => ({
              type: 'ITEM_TOGGLED',
              payload: { id }
          }),
          removeItem: (_, { payload: { id } }) => ({
              type: 'ITEM_REMOVED',
              payload: { id }
          })
      }
  }
];
```

## View model

Add view model in `common/view-models/index.js`.

```js
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
          ITEM_TOGGLED: (state, { payload: { id } }) => ({
              ...state,
              [id]: {
                  ...state[id],
                  checked: !state[id].checked
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
```

## Client

Create `actions/index.js` file.

```js
import { createActions } from 'resolve-redux'

import aggregates from '../../common/aggregates'

export default aggregates.reduce(
  (result, aggregate) => ({ ...result, ...createActions(aggregate) }),
  {}
)
```


Update `reducers/index.js` file.

```js
import { createViewModelsReducer } from 'resolve-redux';

export default createViewModelsReducer();
```

Add todo components to `component` folder.

Update `components/App.js` file.

```js
import React from 'react'
import {
  Component,
  Animated,
  Styles,
  View,
  Text,
  ScrollView,
  Button,
  TextInput
} from 'reactxp'
import { bindActionCreators } from 'redux'
import { connect } from 'resolve-redux'
import ToggleSwitch from './ToggleSwitch'

import actions from '../actions'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const styles = {
  scroll: Styles.createScrollViewStyle({
    alignSelf: 'stretch',
    backgroundColor: '#f5fcff'
  }),
  container: Styles.createViewStyle({
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  }),
  header: Styles.createTextStyle({
    fontSize: 32,
    marginBottom: 12
  }),
  listRow: Styles.createViewStyle({
    flexDirection: 'row',
    alignItems: 'center'
  }),
  todoIndex: Styles.createViewStyle({
    marginRight: 10
  }),
  todoText: Styles.createViewStyle({
    marginLeft: 20
  }),
  roundButton: Styles.createViewStyle({
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#7d88a9'
  }),
  removeButton: Styles.createViewStyle({
    marginLeft: 5,
    backgroundColor: '#ddd'
  }),
  buttonText: Styles.createViewStyle({
    fontSize: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    color: 'white'
  }),
  newTodoContainer: Styles.createViewStyle({
    flexDirection: 'row',
    alignItems: 'center'
  }),
  textInput: Styles.createTextInputStyle({
    borderWidth: 1,
    borderColor: 'gray',
    width: 100
  })
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { newTodo: '' }
  }

  render() {
    const {
      todos,
      createItem,
      toggleItem,
      removeItem,
      aggregateId
    } = this.props

    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.header}>TODO</Text>
          <View style={styles.list}>
            {Object.keys(todos).map((id, index) => (
              <View key={id} style={styles.listRow}>
                <Text style={styles.todoIndex}>{`${index + 1}.`}</Text>
                <ToggleSwitch
                  value={todos[id].checked}
                  onChange={toggleItem.bind(null, aggregateId, { id })}
                />
                <Text style={styles.todoText}>{todos[id].text}</Text>
                <Button
                  style={styles.removeButton}
                  onPress={removeItem.bind(null, aggregateId, { id })}
                >
                  <Text>{' X '}</Text>
                </Button>
              </View>
            ))}
          </View>

          <View style={styles.newTodoContainer}>
            <Button
              style={styles.roundButton}
              onPress={() => {
                this.setState({ newTodo: '' })
                createItem(aggregateId, {
                  text: this.state.newTodo,
                  id: Date.now()
                })
              }}
            >
              <Text style={styles.buttonText}>Add Todo</Text>
            </Button>
            <TextInput
              style={styles.textInput}
              value={this.state.newTodo}
              onChangeText={newValue => this.setState({ newTodo: newValue })}
            />
          </View>
        </View>
      </ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  viewModelName,
  aggregateId,
  todos: state[viewModelName][aggregateId]
})

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(App)
```

Add `ToggleSwitch.js` file.

```js
/**
 * ToggleSwitch.js
 * Copyright: Microsoft 2017
 *
 * A simple toggle control built in ReactXP that allows users to
 * pick between two values.
 */

import React from 'react';
import RX from 'reactxp';

const _knobLeftOff = 2; // In pixels
const _knobLeftOn = 22; // In pixels
const _animationDuration = 250; // In milliseconds

const _styles = {
    container: RX.Styles.createButtonStyle({
        flexDirection: 'row',
        alignItems: 'center'
    }),
    toggleSwitch: RX.Styles.createViewStyle({
        flexDirection: 'row',
        borderRadius: 15,
        marginVertical: 8,
        height: 20,
        width: 40,
        backgroundColor: '#ddd'
    }),
    toggleSwitchBackground: RX.Styles.createViewStyle({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 15
    }),
    toggleKnob: RX.Styles.createViewStyle({
        top: 2,
        height: 16,
        width: 16,
        borderRadius: 13,
        backgroundColor: 'white'
    })
};

export default class ToggleSwitch extends RX.Component {
    /* eslint-disable */
    _knobLeftAnimationValue;
    _knobLeftAnimationStyle;

    _toggleColorAnimationValue;
    _toggleColorAnimationStyle;
    /* eslint-enable */

    constructor(props) {
        super(props);

        // This value controls the left offset of the knob, which we will
        // animate when the user toggles the control.
        this._knobLeftAnimationValue = RX.Animated.createValue(
            this.props.value ? _knobLeftOn : _knobLeftOff
        );
        this._knobLeftAnimationStyle = RX.Styles.createAnimatedViewStyle({
            left: this._knobLeftAnimationValue
        });

        // This value controls the background color of the control. Here we make
        // use of the interpolate method to smoothly transition between two colors.
        this._toggleColorAnimationValue = RX.Animated.createValue(this.props.value ? 1 : 0);
        this._toggleColorAnimationStyle = RX.Styles.createAnimatedTextInputStyle({
            backgroundColor: RX.Animated.interpolate(
                this._toggleColorAnimationValue,
                [0, 1],
                ['#ddd', '#66f']
            )
        });
        this._handleClick = this._handleClick.bind(this);
    }

    componentWillUpdate(newProps) {
        // If the value of the toggle changes, animate the toggle sliding
        // from one side to the other. In parallel, animate the opacity change.
        if (this.props.value !== newProps.value) {
            RX.Animated
                .parallel([
                    RX.Animated.timing(this._knobLeftAnimationValue, {
                        toValue: newProps.value ? _knobLeftOn : _knobLeftOff,
                        duration: _animationDuration,
                        easing: RX.Animated.Easing.InOut()
                    }),
                    RX.Animated.timing(this._toggleColorAnimationValue, {
                        toValue: newProps.value ? 1 : 0,
                        duration: _animationDuration,
                        easing: RX.Animated.Easing.InOut()
                    })
                ])
                .start();
        }
    }

    render() {
        const knobStyles = [_styles.toggleKnob, this._knobLeftAnimationStyle];
        const backgroundStyle = [_styles.toggleSwitchBackground, this._toggleColorAnimationStyle];

        return (
            <RX.Button style={_styles.container} onPress={this._handleClick}>
                <RX.View style={_styles.toggleSwitch}>
                    <RX.Animated.View style={backgroundStyle} />
                    <RX.Animated.View style={knobStyles} />
                </RX.View>
            </RX.Button>
        );
    }

    _handleClick(e) {
        e.stopPropagation();

        if (this.props.onChange) {
            this.props.onChange(!this.props.value);
        }
    }
}
```

## Root Directory

If you run your Resolve application on mobile device or even on similator you should specify a root dirrectory along with a host and a port.

```
"ios": "ROOT_DIR=http://0.0.0.0:3000 react-native run-ios",
"android": "ROOT_DIR=http://0.0.0.0:3000 react-native run-android"
```
