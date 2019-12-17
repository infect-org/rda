import RDAService from '@infect/rda-service';
import path from 'path';
import logd from 'logd';

const log = logd.module('rda');



// controllers
import DataController from './controller/Data.js';
import ConfigurationController from './controller/Configuration.js';




const appRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '../');




export default class RDA extends RDAService {


    constructor() {
        super({
            name: 'rda',
            appRoot,
        });
    }




    /**
    * prepare the service
    */
    async load() {
        await this.initialize();

        // get a map of data sources
        this.dataSources = new Set(this.config.get('dataSources'));


        // register controllers
        this.registerController(new DataController({
            registryClient: this.registryClient,
        }));

        this.registerController(new ConfigurationController({
            registryClient: this.registryClient,
            config: this.config,
        }));


        await super.load(this.config.get('server.port'));


        // tell the service registry that we're up and running
        await this.registerService();
    }
}