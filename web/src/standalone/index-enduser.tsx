import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import { initI18N } from './init-i18n';

initI18N().then(() => {
  //render App component in div
  ReactDOM.render(<App endUser={true} />, document.getElementById('app'));
});
