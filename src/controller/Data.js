import { Controller } from '@infect/rda-service';
import logd from 'logd';
import Cache from '../Cache.js';
import HTTP2Client from '@distributed-systems/http2-client';



const log = logd.module('rda');



export default class DataController extends Controller {


    constructor({
        registryClient,
        tenantConfig,
    }) {
        super('data');

        // urls to remote services
        this.registryClient = registryClient;
        this.tenantConfig = tenantConfig;

        // cache most used request for up to an hour
        this.cache = new Cache();
        this.client = new HTTP2Client();

        this.enableAction('list');
    }






    /**
    * returns a computed data set
    */
    async list(request) {
        const tenantConfig = await this.tenantConfig.get(request);
        const query = request.query();
        const dataSetIdentifier = tenantConfig.dataSet;
        const dataSource = 'infect-rda-sample-storage';
        const functionName = query && query.functionName ? query.functionName : 'Infect';
        let parameters = query.filter;

        if (this.cache.has(request)) {
            return this.cache.get(request);
        } else {

             // load cluster info
            const cluster = await this.getCluster({
                dataSetIdentifier,
                dataSource,
            });
            
            // the cluster is live!
            // lets take the first shard as the reducer
            const shardHost = cluster.shards[0].url;


            if (!parameters) parameters = {};


            // call the reducer
            const res = await this.client.post(`${shardHost}/rda-compute.reduction`).expect(201).send({
                dataSetIdentifier,
                functionName,
                parameters,
                shards: cluster.shards,
                options: tenantConfig,
            });

            const responseData = await res.getData();

            this.cache.set(request, responseData);

            return responseData;
        }
    }




    async getCluster({
        dataSetIdentifier,
        dataSource,
    }) {
        if (!this.cluster) {
            if (!this.clusterHost) this.clusterHost = await this.registryClient.resolve('rda-cluster');

            // get an active infect cluster
            const clusterResponse = await this.client.get(`${this.clusterHost}/rda-cluster.cluster-info`).query({
                dataSet: dataSetIdentifier,
                dataSource,
            }).expect(200).send();

            this.cluster = await clusterResponse.getData();
        }

        return this.cluster;
    }
}