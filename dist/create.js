import { __assign } from "tslib";
import { authImpl, middlewareImpl, subscribeImpl } from './common';
export default function create(conf) {
    var _a = middlewareImpl(conf), config = _a[0], patchHandle = _a[1];
    var state = config.state, validators = config.validators, _b = config.validFirst, validFirst = _b === void 0 ? true : _b;
    var share = {
        state: __assign({}, state),
        validators: validators,
        validFirst: validFirst,
        listeners: [],
    };
    var setState = function (patch) {
        share.state = __assign(__assign({}, share.state), patch);
        /** 触发listener */
        share.listeners.forEach(function (listener) { return listener(patch); });
    };
    var coverSetState = function (patch) {
        share.state = __assign({}, patch);
        /** 触发listener */
        share.listeners.forEach(function (listener) { return listener(patch); });
    };
    var auth = authImpl(share);
    var subscribe = subscribeImpl(share);
    var apis = {
        subscribe: subscribe,
        auth: auth,
        setState: setState,
        coverSetState: coverSetState,
        getState: function () { return share.state; },
    };
    patchHandle && patchHandle(apis);
    return apis;
}
