import csurf from 'csurf/index.js';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';

class CSRF {

  public csrfProtection = csurf({ cookie: true });
  public logger: LoggerService = Logger;

  public mount(app: Application): Application {
    this.logger.log({ selectedNode: null, level: 'DEBUG', fileName: 'CSRF', msg: 'Setting up CSRF.' });
    if (process.env.NODE_ENV !== 'development') {
      app.use((req, res, next) => this.csrfProtection(req, res, next));
    }
    return app;
  };

}

export default new CSRF;
