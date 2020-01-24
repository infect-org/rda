import crypto from 'crypto';
import LRUCache from 'ee-lru-cache';


export default class Cache {


    constructor() {
        this.cache = new LRUCache({
            limit: 2000,
            ttl: 3600 * 1000,
        });
    }




    has(request) {
        const key = this.getKey(request);
        return this.cache.has(key);
    }




    get(request) {
        const key = this.getKey(request);
        return this.cache.get(key);
    }




    set(request, value) {
        const key = this.getKey(request);
        return this.cache.set(key, value);
    }



    getKey(request) {
        const query = request.query();
        const items = this.traverseData(query);
        items.sort((a, b) => a[0] > b[0] ? 1 : -1);
        const str = JSON.stringify(items);
        return crypto.createHash('md5').update(str).digest('hex');
    }



    traverseData(data, storage = [], path = 'root') {
        if (typeof data === 'string') {
            try {
                const json = JSON.parse(data);
                this.traverseData(json, storage, path);
            } catch (e) {
                storage.push([path, data]);
            }
        } else if (Array.isArray(data)) {
            data.sort();
            let index = 0;
            for (const item of data) {
                this.traverseData(item, storage, `${path}[${index++}]`);
            }
        } else if (data === null) {
            storage.push([path, 'null']);
        } else if (data === undefined) {
            storage.push([path, 'undefined']);
        } else if (typeof data === 'object') {
            for (const [ key, value ] of Object.entries(data)) {
                this.traverseData(value, storage, `${path}[${key}]`);
            }
        } else {
            storage.push([path, data.toString()]);
        }

        return storage;
    }
}