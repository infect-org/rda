# RDA Service

RDA public API


### GET resistance data

Just get the following resource: `http://rda.infect.info/rda.data`

***Filtering:***

You may pass a query paramater named `filter` to the GET call. The value is a stringified JSON object which may contain the following values:

*Age Group*:

```json
{
    ageGroupIds: [1, 3]
}
```

The IDs can be loaded from the `http://rda.infect.info/generics.ageGroup` endpoint.



*Regions*:

```json
{
    regionIds: [1, 3]
}
```

The IDs can be loaded from the `http://rda.infect.info/generics.region` endpoint.



*Sample Date*:

```json
{
    dateFrom: int,
    dateTo: int,
}
```

The int values need to be replaced with a unix timestamp value (seconds, not micorseconds)


### Restarting the service

1. Connect to the host using SSH
2. Type `sudo systemctl restart rda.service`
3. Check the logs and wait until the application is loaded: `sudo journalctl -u rda -fn 3000`
4. Once the app is loaded, go to the directory `/home/ubuntu/apps/rda/beta-ship/`
4. Build the cluster by typing the command `npm run cluster-int`. This command can only be executed once per cluster. If it fails you need to restart rda before you can try again.
