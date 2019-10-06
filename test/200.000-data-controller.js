import Service from '../index.js';
import section from 'section-tests';
import superagent from 'superagent';
import assert from 'assert';
import log from 'ee-log';



const host = 'http://l.dns.porn';



section('Data Controller', (section) => { 

    section.test('get data', async() => {
        const service = new Service();
        await service.load();

        const dataResponse = await superagent.get(`${host}:${service.getPort()}/rda.data`).ok(res => res.status === 200).query({
            dataSource: 'infect-rda-sample-storage',
            dataSet: 'infect-beta',
        }).send();

        await section.wait(200);
        await service.end();
    });




    section.test('get filtered data', async() => {
        const service = new Service();
        await service.load();

        const dataResponse = await superagent.get(`${host}:${service.getPort()}/rda.data`).ok(res => res.status === 200).query({
            dataSource: 'infect-rda-sample-storage',
            dataSet: 'infect-beta',
            filter: JSON.stringify({
                ageGroupIds: [3, 4]
            })
        }).send().catch(console.log);

        await section.wait(200);
        await service.end();
    });




    section.test('get by date filtered data', async() => {
        const service = new Service();
        await service.load();

        const dataResponse = await superagent.get(`${host}:${service.getPort()}/rda.data`).ok(res => res.status === 200).query({
            dataSource: 'infect-rda-sample-storage',
            dataSet: 'infect-beta',
            filter: JSON.stringify({
                dateFrom: Math.round(new Date(2018, 3, 1).getTime()/1000),
                dateTo: Math.round(new Date().getTime()/1000),
            })
        }).send().catch(console.log);

        await section.wait(200);
        await service.end();
    });
});