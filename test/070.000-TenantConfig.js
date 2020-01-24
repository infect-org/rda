import TenantConfig from '../src/TenantConfig.js';
import section from 'section-tests';
import assert from 'assert';
import log from 'ee-log';
import ServiceManager from '@infect/rda-service-manager';



const host = 'http://l.dns.porn:8000';


class Request {
    constructor(headers) {
        this.headers = headers;
    }


    getHeader(name) {
        return this.headers[name];
    }
}


section('Tenant Config', (section) => {
    let sm;

    section.setup(async() => {
        sm = new ServiceManager({
            args: '--dev.testing --log-level=error+ --log-module=*'.split(' ')
        });
        
        await sm.startServices('@infect/rda-service-registry');
        await sm.startServices('@infect/guideline-service');
    });


    section.test('Start & stop service', async() => {
        const tc = new TenantConfig();
        const request = new Request({
            ':authority': 'api.infect.info',
            ':scheme': 'https',
        });

        const config = await tc.get(request);

        assert.equal(config.dataSet, 'infect-human');
    });


    section.destroy(async() => {
        await sm.stopServices();
    });
});