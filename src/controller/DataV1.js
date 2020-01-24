import { Controller } from '@infect/rda-service';
import logd from 'logd';
import HTTP2Client from '@distributed-systems/http2-client';



const log = logd.module('rda');



export default class DataV1Controller extends Controller {


    constructor({
        registryClient,
    }) {
        super('data-v1');

        // urls to remote services
        this.registryClient = registryClient;

        // cache most used request for up to an hour
        this.client = new HTTP2Client();

        this.enableAction('list');
    }






    /**
    * returns a computed data set
    */
    async list(request) {
        const rdaHost = await this.registryClient.resolve('rda');
        const authority = request.hasHeader('X-Forwarded-Host') ? request.getHeader('X-Forwarded-Host') : request.getHeader(':authority');
        const scheme = request.hasHeader('X-Forwarded-Proto') ? request.getHeader('X-Forwarded-Proto') : request.getHeader(':scheme');

        // get rda configuration
        const rdaResponse = await this.client.get(`${rdaHost}/rda.data`)
            .setHeader('X-Forwarded-Host', authority)
            .setHeader('X-Forwarded-Proto', scheme)
            .query(request.query())
            .expect(200)
            .send();

        const data = await rdaResponse.getData(); 

        data.values = data.values.map(value => ({
            resistant: value.resistant,
            intermediate: value.intermediate,
            susceptible: value.susceptible,
            sampleCount: value.modelCount,
            compoundId: value.compoundSubstanceId,
            bacteriumId: value.microorganismId,
            resistantPercent: value.resistantPercent,
            confidenceInterval: value.confidenceInterval,
        }));

        return data;
    }
}