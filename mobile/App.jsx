// In mobile/index.js (if it exists)
import {AppRegistry} from 'react-native';
import App from './src/App'; // Update this path if needed
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);