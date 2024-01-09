import React from 'react';
import ReactDOM from 'react-dom';
import i18n from 'i18next';
import httpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { configure } from 'mobx';

import '@patternfly/patternfly/patternfly-charts-theme-dark.css';
import '@patternfly/patternfly/patternfly-theme-dark.css';
import '@patternfly/react-core/dist/styles/base.css';

import App from './app';
import { getLanguage } from './utils/language';
import './index.css';

configure({ isolateGlobalState: true });

//init standalone i18n translations
i18n
  // fetch json files
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(httpBackend)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    lng: getLanguage(),
    fallbackLng: 'en',
    load: 'languageOnly',
    debug: process.env.NODE_ENV === 'development',
    contextSeparator: '~',
    ns: ['plugin__netobserv-plugin'],
    defaultNS: 'public',
    nsSeparator: '~',
    keySeparator: false,
    react: {
      useSuspense: true,
      transSupportBasicHtmlNodes: true // allow <br/> and simple html elements in translations
    },
    saveMissing: true,
    missingKeyHandler: function (lng, ns, key) {
      console.error(`Missing i18n key "${key}" in namespace "${ns}" and language "${lng}."`);
    }
  })
  .then(() => {
    //render App component in div
    ReactDOM.render(<App />, document.getElementById('app'));
  });
