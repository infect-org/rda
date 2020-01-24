import Service from '../index.js';
import section from 'section-tests';
import HTTP2Client from '@distributed-systems/http2-client';
import assert from 'assert';
import log from 'ee-log';
import ServiceManager from '@infect/rda-service-manager';



const host = 'http://l.dns.porn';



section('Data Controller', (section) => {
    let sm;

    section.setup(async() => {
        sm = new ServiceManager({
            args: '--dev.testing --log-level=error+ --log-module=*'.split(' ')
        });
        
        await sm.startServices('@infect/rda-service-registry');
        await sm.startServices('@infect/guideline-service');
        await sm.startServices('@infect/rda-cluster-service');
        await sm.startServices('@infect/rda-compute-service', '@infect/rda-compute-service', '@infect/rda-compute-service', '@infect/rda-compute-service');
        await sm.startServices('@infect/infect-rda-sample-storage');
    });



    section.test('get data', async() => {
        const client = new HTTP2Client();
        const service = new Service();
        await service.load();

        const dataResponse = await client.get(`${host}:${service.getPort()}/rda.data`).expect(200).send();

        await section.wait(200);
        await service.end();
        await client.end();
    });




    section.test('get filtered data', async() => {
        const client = new HTTP2Client();
        const service = new Service();
        await service.load();

        const dataResponse = await client.get(`${host}:${service.getPort()}/rda.data`).expect(200).query({
            dataSource: 'infect-rda-sample-storage',
            dataSet: 'infect-beta',
            filter: JSON.stringify({
                ageGroupIds: [3, 4]
            })
        }).send().catch(console.log);

        await section.wait(200);
        await service.end();
        await client.end();
    });




    section.test('get by date filtered data', async() => {
        const client = new HTTP2Client();
        const service = new Service();
        await service.load();

        const dataResponse = await client.get(`${host}:${service.getPort()}/rda.data`).expect(200).query({
            dataSource: 'infect-rda-sample-storage',
            dataSet: 'infect-beta',
            filter: JSON.stringify({
                dateFrom: Math.round(new Date(2018, 3, 1).getTime()/1000),
                dateTo: Math.round(new Date().getTime()/1000),
            })
        }).send().catch(console.log);

        await section.wait(200);
        await service.end();
        await client.end();
    });


    section.destroy(async() => {
        await sm.stopServices();
    });
});