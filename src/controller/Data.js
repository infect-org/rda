import { Controller } from '@infect/rda-service';
import logd from 'logd';
import LRUCache from 'ee-lru-cache';
import crypto from 'crypto';
import HTTP2Client from '@distributed-systems/http2-client';



const log = logd.module('rda');



export default class DataController extends Controller {


    constructor({
        registryClient,
    }) {
        super('data');

        // urls to remote services
        this.registryClient = registryClient;

        // cache most used request for up to an hour
        this.cache = new LRUCache({
            limit: 2000,
            ttl: 3600 * 1000,
        });

        this.enableAction('list');


        this.client = new HTTP2Client();
    }






    /**
    * returns a computed data set
    */
    async list(request) {
        const dataSet = request.query.dataSet || 'infect-production';
        const dataSource = 'infect-rda-sample-storage';
        const functionName = 'infect-default';
        let filter;

        // parse filters
        try {
            filter = this.validateFilters(request.query().filter);
        } catch (err) {
            return request.response().status(400).send(`Failed to parse filters: ${err.message}!`);
        }


        const cacheKey = this.getCacheKey({
            filter,
            functionName,
            dataSource,
            dataSet,
        });


        // try to return the cached data
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        } else {

             // load cluster info
            const cluster = await this.getCluster({
                dataSet,
                dataSource,
            });
            
            // the cluster is live!
            // lets take the first shard as the reducer
            const shardHost = cluster.shards[0].url;

            // call the reducer
            const res = await this.client.post(`${shardHost}/rda-compute.reduction`).expect(201).send({
                functionName: functionName,
                shards: cluster.shards,
                parameters: filter,
            });
            const responseData = await res.getData();

            this.cache.set(cacheKey, responseData);

            return responseData;
        }
    }






    /**
     * generates a cache key that can be used to store data in the lru cache
     */
    getCacheKey({
        filter,
        functionName,
        dataSet,
        dataSource,
    }) {
        const hash = crypto.createHash('md5');

        hash.update(dataSource);
        hash.update('|');
        hash.update(dataSet);
        hash.update('|');
        hash.update(functionName);
        hash.update('|');
        hash.update(filter.ageGroupIds.sort().join(','));
        hash.update('|');
        hash.update(filter.regionIds.sort().join(','));
        hash.update('|');
        hash.update(filter.hospitalStatusIds.sort().join(','));

        return hash.digest('hex');
    }





    async getCluster({
        dataSet,
        dataSource,
    }) {
        if (!this.cluster) {
            if (!this.clusterHost) this.clusterHost = await this.registryClient.resolve('rda-cluster');

            // get an active infect cluster
            const clusterResponse = await this.client.get(`${this.clusterHost}/rda-cluster.cluster-info`).query({
                dataSet,
                dataSource,
            }).expect(200).send();

            this.cluster = await clusterResponse.getData();
        }

        return this.cluster;
    }








    validateFilters(queryFilter) {
        const filter = {
            ageGroupIds: [],
            regionIds: [],
            hospitalStatusIds: [],
        };

        if (typeof queryFilter === 'string' && queryFilter.length) {
            const rawFilter = JSON.parse(queryFilter);
            

            if (rawFilter && rawFilter.ageGroupIds) {
                if (Array.isArray(rawFilter.ageGroupIds)) {
                    rawFilter.ageGroupIds.forEach((id) => {
                        if (!Number.isNaN(id)) {
                            filter.ageGroupIds.push(id);
                        } else throw new Error(`Invalid filter value in ageGroupIds: expected an integer!`);
                    });
                } else throw new Error(`Invalid filter value ageGroupIds: expected an array!`);
            }


            if (rawFilter && rawFilter.regionIds) {
                if (Array.isArray(rawFilter.regionIds)) {
                    rawFilter.regionIds.forEach((id) => {
                        if (!Number.isNaN(id)) {
                            filter.regionIds.push(id);
                        } else throw new Error(`Invalid filter value in regionIds: expected an integer!`);
                    });
                } else throw new Error(`Invalid filter value regionIds: expected an array!`);
            }


            if (rawFilter && rawFilter.hospitalStatusIds) {
                if (Array.isArray(rawFilter.hospitalStatusIds)) {
                    rawFilter.hospitalStatusIds.forEach((id) => {
                        if (!Number.isNaN(id)) {
                            filter.hospitalStatusIds.push(id);
                        } else throw new Error(`Invalid filter value in hospitalStatusIds: expected an integer!`);
                    });
                } else throw new Error(`Invalid filter value hospitalStatusIds: expected an array!`);
            }

            if (rawFilter && rawFilter.dateFrom && rawFilter.dateTo) {
                filter.dateFrom = rawFilter.dateFrom;
                filter.dateTo = rawFilter.dateTo;
            }
        }

        return filter;
    }
}