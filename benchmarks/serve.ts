import * as http from 'http';
import { appListener, httpListener, stackListener } from './listeners';

// tslint:disable-next-line:no-console
http.createServer(httpListener).listen(5001, () => console.log('HTTP listener started on port 5001'));
// tslint:disable-next-line:no-console
http.createServer(stackListener).listen(5002, () => console.log('Stack listener started on port 5002'));
// tslint:disable-next-line:no-console
http.createServer(appListener).listen(5003, () => console.log('App listener started on port 5003'));
