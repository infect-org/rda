'use strict';


import RDAService from 'rda-service';
import path from 'path';
import logd from 'logd';

const log = logd.module('rda');



// controllers
import DataController from './controller/Data';







export default class RDA extends RDAService {


    constructor() {
        super('rda');
    }




    /**
    * prepare the service
    */
    async load() {

        // get a map of data sources
        this.dataSources = new Set(this.config.dataSources);


        // register controllers
        this.registerController(new DataController({
            registryClient: this.registryClient,
        }));


        await super.load(this.config.port);


        // tell the service registry that we're up and running
        await this.registerService();
    }
}