# Network Observability plugin for Openshift Console

Based on [Openshift Console dynamic plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk), this plugin implement the console elements for Network Observability.

## Plugin development

To build the plugin, use the npm command :

```
$ npm install
```

and then :

```
$ npm build
```

This should produce the following files :

```
$ tree dist/
dist/
├── 141-chunk-15c10ff5a462c25f9598.min.js
├── 141-chunk-15c10ff5a462c25f9598.min.js.map
├── 16-chunk-6df2b305cb93c2362289.min.js
├── 16-chunk-6df2b305cb93c2362289.min.js.LICENSE.txt
├── 16-chunk-6df2b305cb93c2362289.min.js.map
├── 378-chunk-67748f0d17a4695b66a3.min.js
├── 378-chunk-67748f0d17a4695b66a3.min.js.LICENSE.txt
├── 378-chunk-67748f0d17a4695b66a3.min.js.map
├── locales
│   └── en
│       └── plugin__network-observability-plugin.json
├── plugin-entry.js
├── plugin-entry.js.map
└── plugin-manifest.json
```

## Development environment

Plugin can be served locally using the following command :

```
$ ./http-server.sh
```

Then, when starting the console bridge, you can refer to the local plugin :

```
$ ./bin/bridge -plugins network-observability-plugin=http://localhost:9001/
```
