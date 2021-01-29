var count = 1;
var devtool = function (bonus) {
    if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
        return bonus.init ? bonus.config : undefined;
    }
    if (bonus.init) {
        var extension = window.__REDUX_DEVTOOLS_EXTENSION__;
        var dt = extension.connect({
            name: (document.title || 'seed') + "-" + (count > 1 ? count : ''),
        });
        dt.init(bonus.config.state);
        bonus.ctx.devtool = dt;
        count++;
        return bonus.config;
    }
    if (bonus.ctx.devtool) {
        var ls_1 = function () {
            bonus.ctx.devtool.send('change state', bonus.apis.getState());
        };
        var uls_1 = bonus.apis.subscribe(ls_1);
        bonus.ctx.devtool.subscribe(function (message) {
            if (message.type === 'DISPATCH' && message.state) {
                uls_1();
                bonus.apis.coverSetState(JSON.parse(message.state));
                uls_1 = bonus.apis.subscribe(ls_1);
            }
        });
    }
};
export default devtool;
