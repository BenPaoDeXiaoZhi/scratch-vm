const { test } = require('tap');

globalThis.Request = class {
    constructor(url) {
        this.url = url;
    }
};
globalThis.fetch = (url, options = {}) => (
    Promise.resolve(`[Response ${url instanceof Request ? url.url : url} options=${JSON.stringify(options)}]`)
);

// Remove navigator object from Node 21 and later
delete globalThis.navigator;

// Need to trick the extension API to think it's running in a worker
// It will not actually use this object ever.
globalThis.self = {};
// This will install extension worker APIs onto `global`
require('../../src/extension-support/extension-worker');

test('basic API', t => {
    t.type(globalThis.Scratch.extensions.register, 'function');
    t.equal(globalThis.Scratch.ArgumentType.BOOLEAN, 'Boolean');
    t.equal(globalThis.Scratch.BlockType.REPORTER, 'reporter');
    t.end();
});

test('not unsandboxed', t => {
    t.not(globalThis.Scratch.extensions.unsandboxed, true);
    t.end();
});

test('Cast', t => {
    // Cast is thoroughly tested elsewhere
    t.equal(globalThis.Scratch.Cast.toString(5), '5');
    t.equal(globalThis.Scratch.Cast.toNumber(' 5'), 5);
    t.equal(globalThis.Scratch.Cast.toBoolean('true'), true);
    t.end();
});

test('fetch', async t => {
    t.equal(await globalThis.Scratch.canFetch('https://untrusted.example/'), true);
    t.equal(await globalThis.Scratch.fetch('https://untrusted.example/'), '[Response https://untrusted.example/ options={}]');
    t.equal(await globalThis.Scratch.fetch('https://untrusted.example/', {
        method: 'POST'
    }), `[Response https://untrusted.example/ options={"method":"POST"}]`);
    t.end();
});

test('openWindow', async t => {
    t.equal(await globalThis.Scratch.canOpenWindow('https://example.com/'), false);
    await t.rejects(globalThis.Scratch.openWindow('https://example.com/'), /^Scratch\.openWindow not supported in sandboxed extensions$/);
    t.end();
});

test('redirect', async t => {
    t.equal(await globalThis.Scratch.canRedirect('https://example.com/'), false);
    await t.rejects(globalThis.Scratch.redirect('https://example.com/'), /^Scratch\.redirect not supported in sandboxed extensions$/);
    t.end();
});

test('translate', t => {
    t.equal(globalThis.Scratch.translate({
        id: 'test1',
        default: 'Message 1: {var}',
        description: 'Description'
    }, {
        var: 'test'
    }), 'Message 1: test');
    t.equal(globalThis.Scratch.translate('test1'), 'test1');
    t.equal(globalThis.Scratch.translate('test1 {VAR}', {
        VAR: '3'
    }), 'test1 3');
    t.equal(globalThis.Scratch.translate.language, 'en');

    const messages = {
        en: {
            test1: 'EN Message 1: {var}'
        },
        es: {
            test1: 'ES Message 1: {var}'
        }
    };

    // Should default to English when no navigator object
    globalThis.Scratch.translate.setup(messages);
    t.equal(globalThis.Scratch.translate({
        id: 'test1',
        default: 'Message 1',
        description: 'Description'
    }, {
        var: 'ok'
    }), 'EN Message 1: ok');
    t.equal(globalThis.Scratch.translate.language, 'en');

    // But if there is a navigator object, it should use its language.
    globalThis.navigator = {
        language: 'es'
    };
    // Note that real extensions will only generally call setup() once, but we need to do this
    // again so that it realizes the language changed.
    globalThis.Scratch.translate.setup(messages);
    t.equal(globalThis.Scratch.translate({
        id: 'test1',
        default: 'Message 1',
        description: 'Description'
    }, {
        var: 'ok'
    }), 'ES Message 1: ok');
    t.equal(globalThis.Scratch.translate.language, 'es');

    t.end();
});

test('canRecordAudio', async t => {
    t.equal(await globalThis.Scratch.canRecordAudio(), false);
    t.end();
});

test('canRecordVideo', async t => {
    t.equal(await globalThis.Scratch.canRecordVideo(), false);
    t.end();
});

test('canReadClipboard', async t => {
    t.equal(await globalThis.Scratch.canReadClipboard(), false);
    t.end();
});

test('canNotify', async t => {
    t.equal(await globalThis.Scratch.canNotify(), false);
    t.end();
});

test('canGeolocate', async t => {
    t.equal(await globalThis.Scratch.canGeolocate(), false);
    t.end();
});

test('canEmbed', async t => {
    t.equal(await globalThis.Scratch.canEmbed('https://example.com/'), false);
    t.end();
});
