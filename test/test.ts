import create, { Middleware } from '../src';

test('create', () => {
  const kit = create({
    state: {
      user: 'lxj',
      age: 18,
    },
    validators: {},
  });

  expect(kit).toMatchObject({
    setState: expect.any(Function),
    subscribe: expect.any(Function),
    getState: expect.any(Function),
    auth: expect.any(Function),
  });
});

test('update & getState', () => {
  const kit = create({
    state: {
      user: 'lxj',
      age: 18,
    },
    validators: {},
  });

  expect(kit.getState()).toEqual({
    user: 'lxj',
    age: 18,
  });

  kit.setState({
    user: 'jxl',
  });

  expect(kit.getState()).toEqual({
    user: 'jxl',
    age: 18,
  });

  kit.coverSetState({
    user: 'xxx',
    age: 20,
  });

  expect(kit.getState()).toEqual({
    user: 'xxx',
    age: 20,
  });
});

test('subscribe & unSubscribe', () => {
  const kit = create({
    state: {
      user: 'lxj',
      age: 18,
    },
    validators: {},
  });

  const ls1 = jest.fn(() => {});
  const ls2 = jest.fn(() => {});

  const usLs1 = kit.subscribe(ls1);

  kit.setState({
    age: 19,
  });

  usLs1();

  kit.subscribe(ls2);

  kit.setState({
    age: 18,
  });

  usLs1();

  expect(ls1).toHaveBeenCalledTimes(1);
  expect(ls2).toHaveBeenCalledTimes(1);
  expect(ls1).toHaveBeenLastCalledWith({
    age: 19,
  });
  expect(ls2).toHaveBeenLastCalledWith({
    age: 18,
  });
});

describe('auth & validators', () => {
  const getKit = () => {
    return create({
      state: {
        verify: false,
        usr: {
          name: 'lxj',
          audit: true,
          vip: false,
        },
      },
      validators: {
        verify({ verify }) {
          if (!verify) {
            return {
              label: 'not verify',
              desc: 'Basic information is not verified',
            };
          }
        },
        login({ usr }) {
          if (!usr) {
            return {
              label: 'not log',
              desc: 'Please log in first',
            };
          }
        },
        audit({ usr }) {
          if (!usr.audit) {
            return {
              label: 'not audit',
              desc: 'User is not audit',
            };
          }
        },
        vip({ usr }) {
          if (!usr.vip) {
            return {
              label: 'not vip',
              desc: 'User is not vip',
            };
          }
        },
        self({ usr }, extra) {
          if (usr && usr.name !== extra) {
            return {
              label: 'not self',
              desc: 'Can only be operated by self',
            };
          }
        },
        asyncValid() {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                label: 'async valid',
              });
            }, 2000);
          });
        },
      },
    });
  };

  test('base', done => {
    const kit = getKit();

    kit.auth(['login', 'vip', 'audit'], rejects => {
      expect(rejects).toEqual([
        {
          label: 'not vip',
          desc: 'User is not vip',
        },
      ]);

      done();
    });
  });

  test('or', done => {
    const kit = getKit();

    kit.auth(['login', ['vip', 'audit']], rejects => {
      expect(rejects).toEqual(null);

      done();
    });
  });

  test('extra', done => {
    const kit = getKit();

    kit.auth(['self'], { extra: 'lxj' }, rejects => {
      expect(rejects).toEqual(null);

      done();
    });
  });

  test('local validators', done => {
    const kit = getKit();

    kit.auth(
      ['isJxl', 'self'],
      {
        extra: 1,
        validators: {
          isJxl(deps, extra) {
            if (deps.usr.name !== 'jxl') {
              return {
                label: `Must be jxl${extra}`,
              };
            }
          },
        },
      },
      rejects => {
        expect(rejects).toEqual([{ label: 'Must be jxl1' }]);

        done();
      },
    );
  });

  test('async & promise', () => {
    const kit = getKit();

    const now = Date.now();

    return kit.auth(['login', 'asyncValid']).then(rejects => {
      expect(rejects).toEqual([
        {
          label: 'async valid',
        },
      ]);
      expect(Date.now() - now >= 2000).toBe(true);
    });
  });
});

test('middleware', () => {
  expect.assertions(3); // 两次patch是否执行、1次初始配置更改是否成功

  const mid1: Middleware = bonus => {
    if (bonus.init) {
      const conf = bonus.config;
      const deps = conf.state;

      return { ...conf, state: { ...deps, field3: 'hello' } };
    }

    bonus.monkey('setState', next => patch => {
      expect(true).toBe(true);
      next(patch);
    });
  };

  const mid2: Middleware = bonus => {
    if (bonus.init) {
      const conf = bonus.config;
      const deps = conf.state;

      return { ...conf, state: { ...deps, field4: 'world' } };
    }

    bonus.monkey('subscribe', next => listener => {
      expect(true).toBe(true);
      return next(listener);
    });
  };

  const kit = create({
    middleware: [mid1, mid2],
    state: {
      user: 'lxj',
      age: 18,
    },
    validators: {},
  });

  expect(kit.getState()).toEqual({
    user: 'lxj',
    age: 18,
    field3: 'hello',
    field4: 'world',
  });

  kit.setState({
    user: 'jxl',
  });

  kit.subscribe(() => {});
});
