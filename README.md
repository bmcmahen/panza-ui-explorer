# Panza UI Explorer

Explore Panza UI elements, much like the React Native UI-Explorer. This runs on iOS, Android, and the web.

### Install

```
$ git clone https://github.com/bmcmahen/panza-ui-explorer.git
$ cd panza-ui-explorer && npm install
```

### Running
```
$ react-native run-ios
$ react-native run-android
$ npm run web
```

By default `panza` isn't actually installed. For this, you have two options.

If you are developing on Panza locally, and want to test your changes, copy panza into your project using [wml](https://github.com/wix/wml).

```
$ wml add ~/panza ~/panza-example/node_modules/panza
$ wml start
```

Otherwise, simply use npm to install panza.

```
$ npm i panza
```
