
# ReSolve with ReactXP Tutorial

In this tutorial we create an application that uses the [ReactXP](https://github.com/Microsoft/reactxp) UI framework with the [reSolve](https://github.com/reimagined/resolve) framework for backend business logic. UI state management and communication are implemented within an [Expo](https://expo.io/) app. This tutorial is based on the [hello-world-js](https://github.com/Microsoft/reactxp/tree/master/samples/hello-world-js) example and describes the creation of a simple **ToDo List** app.

> Note: Make sure you have the latest [Node.js](https://nodejs.org) before proceeding.

### Yarn Package Manager

In this tutorial we use [Yarn](https://yarnpkg.com/en/) package manager. If you don't have `yarn`, install it with the following command:

```sh
npm install -g yarn
```

### Create a New reSolve Application

The [reSolve](https://github.com/reimagined/resolve) framework has a [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) tool for creating **reSolve**-enabled applications.
Install the corresponding package globally:

```sh
yarn global add create-resolve-app
```

If the installation is successful, you should have a `create-resolve-app` command available in your shell.
This command creates a [reSolve](https://github.com/reimagined/resolve) application template. Let's create one:


```sh
create-resolve-app todo
```

When the operation finishes, we have an empty [reSolve](https://github.com/reimagined/resolve) web application.
Check that it works by executing the following commands.

```sh
cd todo
yarn run dev
```

This should start a development server and run the web application in your default browser.
Stop the development server before proceeding.

### Add a ReactXP Support

The [ReactXP](https://github.com/Microsoft/reactxp) framework is based on the [React Native](http://facebook.github.io/react-native/). Add the required packages to your `package.json` to the *dependencies* section:

```js
{
  "expo": "^24.0.0",
  "react-native": "^0.51.0",
  "reactxp": "^0.51.0",
  "react-router-native": "^4.2.0"
}
```

> Note: We need the native react router because the current [reSolve](https://github.com/reimagined/resolve) version uses routes internally.

Since [reSolve](https://github.com/reimagined/resolve) uses enviroment variables and react native does not support them, you should install additional babel plugin for inline environment variables support. In addition we need **babel-present-expo** and [react-native-scripts](http://facebook.github.io/react-native/) packages. The `my-local-ip` is the utility package to determine development machine's IP address. We'll need it later.

Add these packages to your `package.json` to the *devDependencies* section:

```js
{
  "babel-plugin-transform-inline-environment-variables": "^0.3.0",
  "babel-preset-expo": "^4.0.0",
  "react-native-scripts": "1.11.1",
  "my-local-ip": "^1.0.0",
  "jest-expo": "^25.1.0"
}
```

Create or modify the [.babelrc](https://babeljs.io/docs/usage/babelrc/) file in the root directory of your project:

```js
{
  "presets": ["babel-preset-expo"],
  "plugins": [
    "transform-react-jsx-source",
    "transform-inline-environment-variables"
  ]
}
```

Since [Expo](https://expo.io/) uses [Jest](https://facebook.github.io/jest/), we need to configure it. Add the `jest` key to your `package.json`'s root object as follows.

```json
{
  "jest":
  {
    "preset": "jest-expo"
  }
}
```

Now we are ready to install all the dependencies.

```sh
yarn install
```

### Event sourced CQRS

Now let's implement an application's business logic. The [reSolve](https://github.com/reimagined/resolve) framework is used to simplify the [CQRS](https://martinfowler.com/bliki/CQRS.html) and [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) patterns implementation. To put it simply, an **aggregate** handles **commands**, implements business logic and generates **events** to track changes. On the front-end side, a **viewModel** (**projection** in particular) combines events and determines the system's state.

The business logic of our **To Do List** application is simple. User can do the folowing things:

- Create an item
- Delete an item
- Check an item
- Uncheck an item

Thus, we need only one `Todo` aggregate with 4 command handlers. Modify the `common/aggregates/index.js` file:

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

The `Todo` aggregate generates an event on every command. We need to create a **viewModel** to handle these events and prepare the data for the UI. Modify the `common/view-models/index.js` file:

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

The business logic implementation is finished now. [reSolve](https://github.com/reimagined/resolve) takes care of client-server intercommunication and data persistence. Now we are ready to implement a [ReactXP](https://github.com/Microsoft/reactxp)-based user interface.


### Index files

The default [reSolve](https://github.com/reimagined/resolve) application's entry point is located in the `client/components/App.js` file. We should change this in order to use [ReactXP](https://github.com/Microsoft/reactxp). Since [reSolve](https://github.com/reimagined/resolve) uses router internally, we need two index files: one for the web application and one for the [React Native](http://facebook.github.io/react-native/) application.

Create a **Web** index file `client/index.js`:

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

Create a **React Native** index file `client/native.js`:

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

The [Expo](https://expo.io/) toolchain packager's entry point can be configured in the [app.json](https://docs.expo.io/versions/latest/guides/configuration.html#appkey) file in the project's root directory:

```js
{
  "expo": {
    "sdkVersion": "24.0.0",
    "appKey": "RXApp"
  }
}
```

## Redux

The [reSolve](https://github.com/reimagined/resolve) framework has a well support of the [Redux](https://redux.js.org) library, so we can use it in our project for data management. [Redux](https://redux.js.org) uses *actions* to modify the view state and [reSolve](https://github.com/reimagined/resolve) framework provides the utility function to generate these actions from the existing *aggregates*.

Create the `client/actions/index.js` file:

```js
import { createActions } from 'resolve-redux'

import aggregates from '../../common/aggregates'

export default aggregates.reduce(
    (result, aggregate) => ({ ...result, ...createActions(aggregate) }),
    {}
)
```

[Redux](https://redux.js.org) uses *reducers* to infer a state from series of actions and we can use a [reSolve](https://github.com/reimagined/resolve)'s utility function to create *reducers* from registered *viewModels*. Modify the `reducers/index.js` file:

```js
import { createViewModelsReducer } from 'resolve-redux';

export default createViewModelsReducer();
```

The [Redux](https://redux.js.org) configuration is finished. Next, we should configure [ReactXP](https://github.com/Microsoft/reactxp) UI components.

## ReactXP UI Components

Replace the content of `client/components/App.js` file with:

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

Replace the content of `client/components/ToggleSwitch.js` file with:
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

### Running applications

In order to properly start the applications we need to modify `npm` scripts in `package.json` file.

```json
{
  "build": "INDEX=client/index.js resolve-scripts build",
  "dev": "INDEX=client/index.js resolve-scripts dev",
  "rxp-start": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts start",
  "rxp-android": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts android",
  "rxp-ios": "ROOT_PATH=http://$(my-local-ip):3000 react-native-scripts ios",
  "rxp-eject": "react-native-scripts eject",
  "rxp-test": "node node_modules/jest/bin/jest.js"
}
```

To run application within [Expo](https://expo.io/) we also must override the main script in `package.json`.

```json
{
  "main": "./node_modules/expo/AppEntry.js"
}
```

We are ready to launch. Firstly start development backend server and web application with:
```sh
yarn run dev
```

Now we can start [React Native](http://facebook.github.io/react-native/) packager with:
```sh
yarn run rxp-start
```

If the packager started normally you will see a QR-code in you terminal. Read this QR-code with [Expo](https://expo.io/) app installed on you mobile device to see working application.

Also you can start application in iOS or Android simulator with:
```sh
yarn run rxp-ios
yarn run rxp-android
```

If you want to convert the application to pure [React Native](http://facebook.github.io/react-native/) project use:
```sh
yarn run rxp-eject
```
This command will create native projects for each platform and removes all redundant dependencies. From this moment you can add custom or 3rd-party [ReactXP](https://github.com/Microsoft/reactxp) and [React Native](http://facebook.github.io/react-native/) controls .

