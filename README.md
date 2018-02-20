
# **ReSolve + ReactXP ToDo List Example**


# Getting Started
## Create a New ReSolve Application

* Use the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) CLI tool to create a new reSolve project.

  * Install the [create-resolve-app](https://www.npmjs.com/package/create-resolve-app) package globally.

    ```sh
    npm i -g create-resolve-app
    ```

  * Create an empty reSolve project and run the application in the development mode.

    ```sh
    create-resolve-app resolve-reactxp-todo
    cd resolve-reactxp-todo
    npm run dev
    ```

The application opens in a browser at [http://localhost:3000](http://localhost:3000).

## Create a New React Native Application

* Use the [create-react-native-app](https://github.com/react-community/create-react-native-app) CLI tool to create a new react native project.

  * Install the [create-react-native-app](https://www.npmjs.com/package/create-react-native-app) package globally.

    ```sh
    npm i -g create-react-native-app
    ```

  * Create a default react native project.

    ```sh
    create-react-native-app ReSolveReactxpTodo
    cd ReSolveReactxpTodo/
    ```

* By default all native folders are hidden inside build scripts. Run the `eject` command to access them.

  ```sh
  npm run eject
  ```

* Copy the ejected `ios` and `android` folders into your `resolve-reactxp-todo` project folder.

# Set Up the ReactXP Infrastructure

## Install the Required Dependencies

* Add the following npm dependencies to your `package.json` file and run `npm i` to install them:

  ```
  "react-native": "^0.51.0",
  "react-native-windows": "^0.51.0-rc.1",
  "reactxp": "^0.51.0",
  "reactxp-imagesvg": "^0.2.8",
  "reactxp-navigation": "^1.0.15",
  "reactxp-video": "^0.2.3"
  ```

* Install a `devDependencies` package:

  ```sh
  npm i --save-dev babel-preset-react-native
  ```

* Configure Babel by adding a `.babelrc` file with the following contents:

  ```js
  {
    "presets": [
      "react-native"
    ]
  }
  ```

## Environment Variables

Since `ReSolve` uses enviroment variables and React Native does not support them, you should install additional Babel plugin for inline environment variables support:

* Install `babel-plugin-transform-inline-environment-variables`.

  ```sh
  npm i --save-dev babel-plugin-transform-inline-environment-variables
  ```

* Update the `.babelrc` file.

  ```js
  {
    "presets": [
      "react-native"
    ],
    "plugins": [
      "transform-inline-environment-variables"
    ]
  }
  ```


# Client Index File

ReactXP applications use a single `index.js` file for all platforms. Since `ReSolve` supports only web applications by default, you should create a new `index.js` file.

* Create a new `client/index.js` file for ReactXP:

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

* Update the path to the `index.js` file for three platforms:

  * For `web` application update `dev` and `build` sctipts in `package.json` file.

    ```
    "build": "INDEX=client/index.js resolve-scripts build",
    "dev": "INDEX=client/index.js resolve-scripts dev",
    ```

  * For `iOS` application update `ios/<project_name>/AppDelegate.m`.

    ```ObjectiveC
    jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"client/index" fallbackResource:nil];
    ```

* Change the `moduleName` value to `@"RXApp"` in the `AppDelegate.m`:

  ```ObjectiveC
  RCTRootView *rootView = [[RCTRootView alloc] 
                              initWithBundleURL:jsCodeLocation
                              moduleName:@"RXApp"
                              initialProperties:nil
                              launchOptions:launchOptions];
  ```

## Android

* Update client index path in `android/app/src/main/java/com/<project_name>/MainApplication.java`:

  ```java
  @Override
  protected String getJSMainModuleName() {
    return "client/index";
  }
  ```

* Update component name in `android/app/src/main/java/com/<project_name>/MainActivity.java`

  ```java
  @Override
  protected String getMainComponentName() {
      return "RXApp";
  }
  ```

## Runing the "Hello World" Example

* Replace `React` components with `ReactXP` components in `client/components/App.js` in order to run application on all platforms.

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

* Start your application:

  * For web version, run `npm run dev`.

  * For iOS and Android applications add extra scripts to your `package.json`:

    ```
    "ios": "react-native run-ios",
    "android": "react-native run-android"
    ```

    After that, run `npm run ios` or `npm run android`.

# Todo Application

## Aggreagate

Update `common/aggregates/index.js`:

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

Add view model in `common/view-models/index.js`:

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

* Create `actions/index.js` file:

  ```js
  import { createActions } from 'resolve-redux'

  import aggregates from '../../common/aggregates'

  export default aggregates.reduce(
    (result, aggregate) => ({ ...result, ...createActions(aggregate) }),
    {}
  )
  ```


* Update `reducers/index.js` file:

  ```js
  import { createViewModelsReducer } from 'resolve-redux';

  export default createViewModelsReducer();
  ```

* Add React components to the `component` folder:

  * Update `components/App.js` file:

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

  * Add `ToggleSwitch.js` file.

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

If you run your ReSolve application on mobile device (or in the emulator) you should specify a root dirrectory, host and port.

```
"ios": "ROOT_DIR=http://0.0.0.0:3000 react-native run-ios",
"android": "ROOT_DIR=http://0.0.0.0:3000 react-native run-android"
```
