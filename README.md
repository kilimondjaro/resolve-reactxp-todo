
# **Resolve + Reactxp Todo Example**


# Getting Started
## Creating a New ReSolve Application

Use the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) CLI tool to create a new reSolve project.

Install create-resolve-app globally.

```
npm i -g create-resolve-app
```

Create an empty reSolve project and run the application in the development mode.

```
create-resolve-app resolve-reactxp-todo
cd resolve-reactxp-todo
npm run dev
```

The application opens in the browser at [http://localhost:3000/](http://localhost:3000/).

## Creating a New React Native Application

Use the [create-react-native-app](https://github.com/react-community/create-react-native-app) CLI tool to create a new react native project.

Install create-react-native-app globally.

```
npm i -g create-react-native-app
```

Create a default react native project.

```
create-react-native-app ResolveReactxpTodo
cd ResolveReactxpTodo/
```

By default all native folders are hidden inside build scripts, that is why you should run `eject` command.

```
npm run eject
```

Copy extracted `ios` and `android` folders to your `resolve-reactxp-todo` project folder.

# Set up ReactXP infrastructure

## Install necessary dependencies

Add these npm dependencies to your `package.json` file:

```
"react-native": "^0.51.0",
"react-native-windows": "^0.51.0-rc.1",
"reactxp": "^0.51.0",
"reactxp-imagesvg": "^0.2.8",
"reactxp-navigation": "^1.0.15",
"reactxp-video": "^0.2.3"
```


Also install few devDependencies:

```
npm i --save-dev babel-preset-react-native
```

Add `.babelrc` file

```
{
  "presets": [
    "react-native"
  ]
}
```

## Environment variables
Since `Resolve` uses enviroment variables and react native does not support them, you should install additional babel plugin for support of inline environment variables.

Install.

```
npm i --save-dev babel-plugin-transform-inline-environment-variables
```

Update `.babelrc` file.

```
{
  "presets": [
    "react-native"
  ],
  "plugins": [
    "transform-inline-environment-variables"
  ]
}
```


# Client index file
In ReactXP applications you will have one client index file for all platforms. Since `Resolve` by default supports only web applications, you should create a new cleint index file.

Create ReactXP a new `client/index.js` file.

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

You then should update a path to this index file for all three platforms.

## Web

For `web` application update a starting sctipt in `package.json` file.

```
"dev": "INDEX=client/index.js resolve-scripts dev",
```

## iOS
For `iOS` application update `ios/<project_name>/AppDelegate.m`.

Update index file path
```ObjectiveC
jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"client/index" fallbackResource:nil];
```

Also all ReactXP applications should have the same `moduleName:@"RXApp"`, which you can change in the same `AppDelegate.m`

```ObjectiveC
RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"RXApp"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
```

## Android

Update client index path in `android/app/src/main/java/com/<project_name>/MainApplication.java`

```java
@Override
protected String getJSMainModuleName() {
  return "client/index";
}
```

Update component name in `android/app/src/main/java/com/<project_name>/MainActivity.java`

```java
@Override
protected String getMainComponentName() {
    return "RXApp";
}
```

## Runing Hello World

Replace `html` with ReactXP in order to run application on all platforms.

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

For web run `npm run dev`.

To run iOS and Android applications add extra scripts to your `package.json`.

```
"ios": "react-native run-ios",
"android": "react-native run-android"
```

