import { Controller } from '@infect/rda-service';
import logd from 'logd';
import LRUCache from 'ee-lru-cache';
import crypto from 'crypto';
import HTTP2Client from '@distributed-systems/http2-client';



const log = logd.module('rda');



export default class ConfigurationV1Controller extends Controller {


    constructor({
        registryClient,
    }) {
        super('configuration-v1');

        this.registryClient = registryClient;
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
        const rdaResponse = await this.client.get(`${rdaHost}/rda.configuration`)
            .setHeader('X-Forwarded-Host', authority)
            .setHeader('X-Forwarded-Proto', scheme)
            .query(request.query())
            .expect(200)
            .send();


        const data = await rdaResponse.getData();

        data.ageGroupIds = [];
        data.bacteriumIds = data.microorganismIds;
        data.compoundIds = data.compoundSubstanceIds;
        delete data.microorganismIds;
        delete data.compoundSubstanceIds;

        return data;
    }
}