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
