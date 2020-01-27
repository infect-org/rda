import LRUCache from 'ee-lru-cache';
import HTTP2Client from '@distributed-systems/http2-client';


export default class TenantConfig {


    constructor({
        tenantHost,
    } = {}) {
        this.tenantHost = tenantHost;

        this.cache = new LRUCache({
            limit: 2000,
            ttl: 3600 * 1000,
        });

        this.client = new HTTP2Client();
    }




    async get(request) {
        const authority = request.hasHeader('X-Forwarded-Host') ? request.getHeader('X-Forwarded-Host') : request.getHeader(':authority');
        const scheme = request.hasHeader('X-Forwarded-Proto') ? request.getHeader('X-Forwarded-Proto') : request.getHeader(':scheme');
        const domain = authority.replace(/:[0-9]+/gi, '');
        
        if (!this.cache.has(domain)) {
            const promise = (async() => {
                const host = this.tenantHost || `${scheme}://${authority}`;
                const response = await this.client.get(`${host}/tenant/v1/config`).expect(200).send();
                const data = await response.getData();

                for (const configuration of data.configuration) {
                    if (configuration.identifier === 'rda') {
                        return configuration.config;
                    }
                }
            })();

            this.cache.set(domain, promise);
        }

        return await this.cache.get(domain);
    }
}