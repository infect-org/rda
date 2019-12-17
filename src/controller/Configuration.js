import { Controller } from '@infect/rda-service';
import logd from 'logd';
import LRUCache from 'ee-lru-cache';
import crypto from 'crypto';
import HTTP2Client from '@distributed-systems/http2-client';



const log = logd.module('rda');



export default class ConfigurationController extends Controller {


    constructor({
        registryClient,
        config,
    }) {
        super('configuration');

        this.registryClient = registryClient;
        this.config = config;
        this.client = new HTTP2Client();
        this.guidelineHost = this.config.get('guideline.host');

        this.enableAction('list');
    }






    /**
    * returns a computed data set
    */
    async list(request) {
        const query = {
            ...request.query(),
            functionName: 'infect-configuration'
        };
        
        const rdaHost = await this.registryClient.resolve('rda');

        // get rda configuration
        const rdaResponse = await this.client.get(`${rdaHost}/rda.data`)
            .query(query)
            .expect(200)
            .send();

        // get guideline data
        const guidelineHost = this.config.get('guideline.host');
        const guidelineCompoundPath = this.config.get('guideline.compound-path');
        const guidelineBacteriumPath = this.config.get('guideline.bacterium-path');

        const glCompoundResponse = await this.client.get(`${guidelineHost}${guidelineCompoundPath}`)
            .accept('application/json')
            .expect(200)
            .send();

        const glBacteriumResponse = await this.client.get(`${guidelineHost}${guidelineBacteriumPath}`)
            .accept('application/json')
            .expect(200)
            .send();

        const data = await rdaResponse.getData();
        const compoundData = await glCompoundResponse.getData();
        const bacteriumData = await glBacteriumResponse.getData();
        

        for (const { id_compound } of compoundData) {
            if (!data.compoundIds.includes(id_compound)) {
                data.compoundIds.push(id_compound);
            }
        }

        for (const { id_bacterium } of bacteriumData) {
            if (!data.bacteriumIds.includes(id_bacterium)) {
                data.bacteriumIds.push(id_bacterium);
            }
        }

        return data;
    }
}