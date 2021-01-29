import { __assign } from "tslib";
import { isFunction, isNumber, isObject } from '@lxjx/utils';
var PREFIX = 'SEED_CACHE_';
export var defaultConf = {
    type: 'session',
    expireRefresh: true,
};
/**
 * 在state每次变更时，将其缓存，并在下次初始化时还原
 * @param key - cache key
 * @param conf
 * */
export default function cache(key, conf) {
    var config = __assign(__assign({}, defaultConf), conf);
    var expire = config.expire;
    var k = ("" + PREFIX + config.type + "_" + key).toUpperCase();
    var expireKey = k + "_EXPIRE";
    var storage = getStorageObj(config);
    if (!storage)
        return;
    if (config.expire)
        checkExpire(k, expireKey, storage, config);
    var cacheMiddleware = function (bonus) {
        if (bonus.init) {
            var _conf = bonus.config;
            var cacheData = get(k, storage);
            if (!cacheData)
                return _conf;
            return __assign(__assign({}, _conf), { state: __assign(__assign({}, _conf.state), cacheData) });
        }
        bonus.apis.subscribe(function () {
            set(k, bonus.apis.getState(), storage, config);
            if (isNumber(expire) && expire > 0) {
                setExpire(expireKey, storage, config);
            }
        });
    };
    return cacheMiddleware;
}
function get(key, storage) {
    var cData = storage.getItem(key);
    if (!cData)
        return;
    var parseData = JSON.parse(cData);
    if (!isObject(parseData))
        return;
    return parseData;
}
function set(key, val, storage, config) {
    if (!val)
        return;
    var cacheObj = {};
    if (isFunction(config.testKey)) {
        Object.entries(val).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (config.testKey(k)) {
                cacheObj[k] = v;
            }
        });
    }
    else {
        cacheObj = val;
    }
    storage.setItem(key, JSON.stringify(cacheObj));
}
/** 设置缓存时间，默认只在未设置时设置，开启expireRefresh后在每一次执行时更新缓存 */
function setExpire(expireKey, storage, config) {
    var exT = storage.getItem(expireKey);
    if (exT && !config.expireRefresh)
        return;
    if (!config.expire)
        return;
    // 在第一次缓存时间
    storage.setItem(expireKey, String(Date.now() + config.expire));
}
/** 检测缓存有效性，过期时删除缓存，启用expireRefresh且未过期时刷新缓存, 否则不执行操作 */
function checkExpire(k, expireKey, storage, config) {
    var _a;
    var exT = storage.getItem(expireKey);
    if (!exT)
        return;
    // 已过期
    if (Date.now() > Number(exT)) {
        (_a = config.onExpire) === null || _a === void 0 ? void 0 : _a.call(config);
        storage.removeItem(k);
        storage.removeItem(expireKey);
    }
    else if (config.expireRefresh) {
        // 未过期, 刷新缓存时间
        config.expire && setExpire(expireKey, storage, config);
    }
}
/**
 * 获取缓存方法，根据环境可能为null
 * */
function getStorageObj(_a) {
    var type = _a.type;
    if (typeof window === 'undefined')
        return null;
    var map = {
        session: window.sessionStorage,
        local: window.localStorage,
    };
    return map[type] || null;
}
