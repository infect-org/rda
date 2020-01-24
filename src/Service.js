import RDAService from '@infect/rda-service';
import path from 'path';
import logd from 'logd';
import TenantConfig from './TenantConfig.js';

const log = logd.module('rda');



// controllers
import DataV1Controller from './controller/DataV1.js';
import ConfigurationV1Controller from './controller/ConfigurationV1.js';
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

        let tenantHost;
        try {
            tenantHost = this.config.get('testing.tenantHost');
        } catch(e) {}

        this.tenantConfig = new TenantConfig({
            tenantHost,
        });

        // get a map of data sources
        this.dataSources = new Set(this.config.get('dataSources'));


        // register controllers
        this.registerController(new DataController({
            registryClient: this.registryClient,
            tenantConfig: this.tenantConfig,
        }));

        this.registerController(new ConfigurationController({
            registryClient: this.registryClient,
            config: this.config,
            tenantConfig: this.tenantConfig,
        }));

        // register v1 controllers
        this.registerController(new DataV1Controller({
            registryClient: this.registryClient,
        }));

        this.registerController(new ConfigurationV1Controller({
            registryClient: this.registryClient,
        }));


        await super.load(this.config.get('server.port'));


        // tell the service registry that we're up and running
        await this.registerService();
    }
}