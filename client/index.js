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
