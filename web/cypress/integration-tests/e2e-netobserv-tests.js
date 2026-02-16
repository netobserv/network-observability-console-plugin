// run 'node cypress-chrome.js'
const cypress = require('cypress')

cypress.run({
    spec: './tests/netobserv/**.cy.ts',
    browser: 'chrome',
    video: false
})

// can be run as: node tests/netobserv/e2e-netobserv-tests.js
