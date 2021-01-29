import { Middleware } from './types';

let count = 1;

const devtool: Middleware = bonus => {
  if (typeof window === 'undefined' || !(window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    return bonus.init ? bonus.config : undefined;
  }

  if (bonus.init) {
    const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

    const dt = extension.connect({
      name: `${document.title || 'seed'}-${count > 1 ? count : ''}`,
    });

    dt.init(bonus.config.state);

    bonus.ctx.devtool = dt;

    count++;

    return bonus.config;
  }

  if (bonus.ctx.devtool) {
    const ls = () => {
      bonus.ctx.devtool.send('change state', bonus.apis.getState());
    };

    let uls = bonus.apis.subscribe(ls);

    bonus.ctx.devtool.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.state) {
        uls();
        bonus.apis.coverSetState(JSON.parse(message.state));
        uls = bonus.apis.subscribe(ls);
      }
    });
  }
};

export default devtool;
