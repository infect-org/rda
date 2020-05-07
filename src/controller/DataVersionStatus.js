import { Controller } from '@infect/rda-service';
import logd from 'logd';
import HTTP2Client from '@distributed-systems/http2-client';
import crypto from 'crypto';



const log = logd.module('data-version-status');



export default class DataVersionStatusController extends Controller {


    constructor({
        registryClient,
    }) {
        super('dataVersionStatus');

        // urls to remote services
        this.registryClient = registryClient;

        // cache most used request for up to an hour
        this.client = new HTTP2Client();

        this.enableAction('list');
    }






    /**
    * changes the activation status of a data version
    */
    async list(request) {

        // try to convert old query parameters to new ones
        const {
            token,
            identifier,
            action,
        } = request.query();

        const secret = '-aw9e8rhasd';
        const localtoken = crypto.createHash('sha256').update(`${identifier}${secret}`).digest('hex');
        const sampleStorageHost = await this.registryClient.resolve('infect-rda-sample-storage');

        if (localtoken !== token) {
            return request.response()
                .status(401)
                .send(`Invalid token!`);
        }

        // get rda configuration
        const rdaResponse = await this.client.patch(`${sampleStorageHost}/infect-rda-sample-storage.dataVersionStatus/${identifier}`)
            .expect(200)
            .send({
                action,
            });

        const data = await rdaResponse.getData(); 


        if (data.activated === true) {
            return `The data version will be published on the next cluster restart (around midnigth)`;
        } else {
            return `The data version will be unpublished on the next cluster restart (around midnigth)`;
        }
    }
}