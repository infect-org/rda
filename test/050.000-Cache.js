import Service from '../index.js';
import section from 'section-tests';
import assert from 'assert';
import log from 'ee-log';
import Cache from '../src/Cache.js';



class Request {
    constructor(queryData) {
        this.queryData = queryData;
    }

    query() {
        return this.queryData;
    }
}



section('Cache', (section) => {

    section.test('Set & Get', async() => {
        const cache = new Cache();
        const request = new Request({});

        assert.equal(cache.has(request), false);

        cache.set(request, 1);
        assert.equal(cache.has(request), true);
        assert.equal(cache.get(request), 1);
    });

    section.test('correct key handling', async() => {
        const cache = new Cache();
        const request = new Request({
            a: 1,
            b: null,
            c: undefined,
            d: JSON.stringify({a: 1, b: true, c: 'string', d: {a: 10, b: 20, c: [1, 2, 3]}}),
        });

        cache.set(request, 1);

        const newRequest = new Request({
            a: 1,
            d: JSON.stringify({a: 1, b: true, c: 'string', d: {a: 10, b: 20, c: [3,2,1]}}),
            b: null,
            c: undefined,
        });

        assert.equal(cache.has(newRequest), true);
        assert.equal(cache.get(newRequest), 1);
    });
});