import { __assign, __awaiter, __generator, __spreadArrays } from "tslib";
import { isArray, isFunction } from '@lxjx/utils';
/**
 * 传入验证key、验证器列表、依赖数据、额外数据。对该key进行验证后返回验证Promise形式的结果(void 或 ValidMeta)
 * */
export var validItem = function (key, validators, deps, extra) { return __awaiter(void 0, void 0, void 0, function () {
    var validator, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validator = validators[key];
                // 不存在此验证器
                if (!validator)
                    return [2 /*return*/];
                result = validator(deps, extra);
                if (!result)
                    return [2 /*return*/];
                if (!('then' in result && 'catch' in result)) return [3 /*break*/, 2];
                return [4 /*yield*/, result];
            case 1: 
            // eslint-disable-next-line no-return-await
            return [2 /*return*/, _a.sent()];
            case 2: return [2 /*return*/, result];
        }
    });
}); };
/**
 * 实现auth() api
 * */
export function authImpl(share) {
    var _this = this;
    return function (authKeys, configOrCb, cb) { return __awaiter(_this, void 0, void 0, function () {
        var validators, deps, validFirst, confIsFn, _a, extra, localValidators, callback, rejects, pass, test, _i, authKeys_1, authItem, rjs;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    validators = share.validators, deps = share.state, validFirst = share.validFirst;
                    confIsFn = isFunction(configOrCb);
                    _a = confIsFn ? {} : configOrCb || {}, extra = _a.extra, localValidators = _a.validators;
                    callback = confIsFn ? configOrCb : cb;
                    rejects = [];
                    pass = true;
                    test = function (key, isOr) { return __awaiter(_this, void 0, void 0, function () {
                        var tempRejects, flag, _i, key_1, authItem, meta, meta;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!isArray(key)) return [3 /*break*/, 5];
                                    tempRejects = [];
                                    flag = false;
                                    _i = 0, key_1 = key;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < key_1.length)) return [3 /*break*/, 4];
                                    authItem = key_1[_i];
                                    return [4 /*yield*/, test(authItem, true)];
                                case 2:
                                    meta = _a.sent();
                                    if (meta) {
                                        tempRejects.push(meta);
                                    }
                                    // 成功任意一项即视为成功
                                    if (!meta) {
                                        flag = true;
                                        return [3 /*break*/, 4];
                                    }
                                    _a.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4:
                                    if (!flag) {
                                        pass = false;
                                        validFirst ? rejects.push(tempRejects[0]) : rejects.push.apply(rejects, tempRejects);
                                    }
                                    return [3 /*break*/, 7];
                                case 5: return [4 /*yield*/, validItem(key, __assign(__assign({}, localValidators), validators), deps, extra)];
                                case 6:
                                    meta = _a.sent();
                                    if (!meta)
                                        return [2 /*return*/];
                                    if (!isOr) {
                                        pass = false;
                                        rejects.push(meta);
                                    }
                                    return [2 /*return*/, meta];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); };
                    if (!validFirst) return [3 /*break*/, 5];
                    _i = 0, authKeys_1 = authKeys;
                    _b.label = 1;
                case 1:
                    if (!(_i < authKeys_1.length)) return [3 /*break*/, 4];
                    authItem = authKeys_1[_i];
                    if (!pass) return [3 /*break*/, 3];
                    return [4 /*yield*/, test(authItem)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, Promise.all(authKeys.map(function (ak) { return test(ak); }))];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    rjs = rejects.length ? rejects : null;
                    callback === null || callback === void 0 ? void 0 : callback(rjs);
                    return [2 /*return*/, rjs];
            }
        });
    }); };
}
/**
 * 生成和实现subscribe() api
 * - 通知功能在setDeps内部
 * */
export function subscribeImpl(share) {
    return function (listener) {
        share.listeners.push(listener);
        return function () {
            var ind = share.listeners.indexOf(listener);
            if (ind === -1)
                return;
            share.listeners.splice(ind, 1);
        };
    };
}
/**
 * 实现中间件功能
 * */
export function middlewareImpl(conf) {
    var middleware = conf.middleware;
    if (!(middleware === null || middleware === void 0 ? void 0 : middleware.length))
        return [conf];
    var allMid = __spreadArrays(middleware);
    var ctx = {};
    var initBonus = {
        ctx: ctx,
        config: conf,
        init: true,
    };
    allMid.forEach(function (mid) {
        if (mid) {
            var nextConf = mid(initBonus);
            if (nextConf === undefined)
                throw Error('kit: do you forget to return to the config during the middleware initialization phase?');
            initBonus.config = nextConf;
        }
    });
    var patchHandler = function (apis) {
        var patchBonus = {
            init: false,
            apis: apis,
            ctx: ctx,
            monkey: function (name, cb) {
                var next = apis[name];
                if (!next)
                    return;
                apis[name] = cb(next);
            },
        };
        allMid.reverse(); /* patch函数是由内到外执行的，需要反转顺序 */
        allMid.forEach(function (mid) { return mid && mid(patchBonus); });
    };
    return [initBonus.config, patchHandler];
}
