
# **Using ReSolve with ReactXP application**
## Install yarn package manager

```bash
npm install -g yarn
```

## Create a new ReSolve Application

Use the **[create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)** CLI tool to create a new reSolve project.

First we should install **create-resolve-app** package globally.

```bash
yarn global add create-resolve-app
```

Create the todo sample **reSolve** project.

```bash
create-resolve-app resolve-reactxp-todo --sample
```

Now we have a sample backend and a web application. To check if everything is all right run the following commands.

```bash
cd resolve-reactxp-todo
yarn run dev
```

Those command should start develpment server and default web-browser. Stop development server before proceed with tutorial.

## Add ReactXP and Expo support

Add ReactXP dependencies to `package.json`. You can try to install latest versions on your own.

```json
"expo": "^25.0.0",
"react-native": "^0.51.0",
"react-native-windows": "^0.51.0-rc.1",
"reactxp": "^0.51.0",
"reactxp-imagesvg": "^0.2.8",
"reactxp-navigation": "^1.0.15",
"reactxp-video": "^0.2.3"
```

Since **ReSolve** uses router we need native router also (add to `package.json`)

```json
"react-router-native": "^4.2.0"
```

## Environment variables
Since `Resolve` uses enviroment variables and react native does not support them, you should install additional babel plugin for support of inline environment variables.

Add dev dependency to your `package.json`.

```json
"babel-plugin-transform-inline-environment-variables": "^0.3.0",
"babel-preset-expo": "^4.0.0",
"react-native-scripts": "1.11.1",
"my-local-ip": "^1.0.0",
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

Add `jest` config to the root of `package.json` (or expo eject command can cause an error)

```json
"jest": 
{
    "preset": "jest-expo"
}
```

Now install all of the dependencies.

```bash
yarn install
```

## Client index file

Create web index file `client/index.js`:

```js
import React from 'react'
import RX from 'reactxp'
import { Provider } from 'react-redux'

import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import clientConfig from '../resolve.client.config'
import {routes as ResolveRoutes} from 'resolve-scripts'

const { routes, createStore } = clientConfig
const store = createStore(window.__INITIAL_STATE__)

const Routes = ResolveRoutes(routes, { Route, Redirect, Switch })

RX.App.initialize(true, true)
RX.UserInterface.setMainView(
  <Provider store={store}>
    <BrowserRouter basename={window.__PROCESS_ENV__.ROOT_PATH}>
      <Routes routes={routes} />
    </BrowserRouter>
  </Provider>
)
```

Create native index file `client/native.js`:

```js
import React from 'react'
import RX from 'reactxp'
import { Provider } from 'react-redux'

import { NativeRouter, Route, Redirect, Switch } from 'react-router-native'
import clientConfig from '../resolve.client.config'
import {routes as ResolveRoutes} from 'resolve-scripts'

const { routes, createStore } = clientConfig
const store = createStore()

const Routes = ResolveRoutes(routes, { Route, Redirect, Switch })

RX.App.initialize(true, true)
RX.UserInterface.setMainView(
  <Provider store={store}>
    <NativeRouter>
      <Routes routes={routes} />
    </NativeRouter>
  </Provider>
)
```

Create expo index file `App.js`:.

```js
export App from './client/native';
``` 

Create expo application metadata file `app.json`.

```js
{
  "expo": {
    "sdkVersion": "25.0.0",
    "appKey": "RXApp"
  }
}
```

## Aggregates

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
```

## Client

Add `client/actions/index.js` file:

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

## UI Components
Replace `React` components with `ReactXP` components in `client/components/App.js` in order to run application on all platforms.
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
import { Helmet } from 'react-helmet'
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
            checkItem,
            uncheckItem,
            removeItem,
            aggregateId
        } = this.props

        return (
            <ScrollView style={styles.scroll}>
                <View style={styles.container}>
                    <Helmet>
                        <style type="text/css">{`
            html, body, .app-container {
                width: 100%;
                height: 100%;
                padding: 0;
                border: none;
                margin: 0;
                font-family: proxima-nova, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif
              }
            *:focus {
              outline: 0;
            }
        `}</style>
                    </Helmet>
                    <Text style={styles.header}>TODO</Text>
                    <View style={styles.list}>
                        {Object.keys(todos).map((id, index) => (
                            <View key={id} style={styles.listRow}>
                                <Text style={styles.todoIndex}>{`${index + 1}.`}</Text>
                                <ToggleSwitch
                                    value={todos[id].checked}
                                    onChecked={checkItem.bind(null, aggregateId, { id })}
                                    onUnchecked={uncheckItem.bind(null, aggregateId, { id })}
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

Add `client/components/ToggleSwitch.js`:
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
    _knobLeftAnimationValue;
    _knobLeftAnimationStyle;

    _toggleColorAnimationValue;
    _toggleColorAnimationStyle;

    constructor(props){
        super(props);

        // This value controls the left offset of the knob, which we will
        // animate when the user toggles the control.
        this._knobLeftAnimationValue = RX.Animated.createValue(this.props.value ? _knobLeftOn : _knobLeftOff);
        this._knobLeftAnimationStyle = RX.Styles.createAnimatedViewStyle({
            left: this._knobLeftAnimationValue
        });

        // This value controls the background color of the control. Here we make
        // use of the interpolate method to smoothly transition between two colors.
        this._toggleColorAnimationValue = RX.Animated.createValue(this.props.value ? 1 : 0);
        this._toggleColorAnimationStyle = RX.Styles.createAnimatedTextInputStyle({
            backgroundColor: RX.Animated.interpolate(this._toggleColorAnimationValue,
                [0, 1], ['#ddd', '#66f'])
        });
        this._handleClick = this._handleClick.bind(this);
    }

    componentDidUpdate(oldProps) {

        // If the value of the toggle changes, animate the toggle sliding
        // from one side to the other. In parallel, animate the opacity change.
        if (oldProps.value !== this.props.value) {
            RX.Animated.parallel([
                RX.Animated.timing(this._knobLeftAnimationValue, {
                    toValue: this.props.value ? _knobLeftOn : _knobLeftOff,
                    duration: _animationDuration,
                    easing: RX.Animated.Easing.InOut()
                }),
                RX.Animated.timing(this._toggleColorAnimationValue, {
                    toValue: this.props.value ? 1 : 0,
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
            <RX.Button style={ _styles.container } onPress={ this._handleClick }>
                <RX.View style={ _styles.toggleSwitch }>
                    <RX.Animated.View style={ backgroundStyle }/>
                    <RX.Animated.View style={ knobStyles }/>
                </RX.View>
            </RX.Button>
        );
    }

    _handleClick(e) {
        e.stopPropagation();

        if (this.props.value) {
            this.props.onUnchecked()
        }
        else {
            this.props.onChecked()
        }
    }
}
```

## Start scripts

### Web

For `web` application update `dev` and `build` sctipts in `package.json` file.

```json
"build": "INDEX=client/index.js resolve-scripts build",
"dev": "INDEX=client/index.js resolve-scripts dev",
```

### Native

Add these scripts to `package.json`.

```json
"rxp-start": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts start",
"rxp-android": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts android",
"rxp-ios": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts ios",
"rxp-eject": "react-native-scripts eject",
"rxp-test": "node node_modules/jest/bin/jest.js",
```

Specify the main script to run sample in expo.

```json
"main": "./node_modules/expo/AppEntry.js"
```


