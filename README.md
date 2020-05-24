# kubernetes [![Build Status](https://travis-ci.com/oxylbot/kubernetes.svg?branch=master)](https://travis-ci.com/oxylbot/kubernetes)
all the configuration files needed in the kubernetes cluster

## Ports used:
* :5432 - PostgreSQL port
* :6379 - Redis port
* :8500 - Gateway REST API
* :8501 - Shard orchestrator API
* :8502 - Dashboard site & API
* :8900 - ROUTER to discord-bucket-zmq-proxy
* :8901 - DEALER from discord-bucket-zmq-proxy
* :8902 - PUSH to gateway-cache-zmq-proxy
* :8903 - PULL from gateway-cache-zmq-proxy
* :8904 - PUSH to sharder-messages-zmq-proxy
* :8905 - PULL from sharder-messages-zmq-proxy
* :8906 - PUSH to event-handler-zmq-proxy
* :8907 - PULL from event-handler-zmq-proxy

## Redis Databases Used
* 0 - discord-bucket
* 1 - shard-orchestrator
* 2 - oauth2 for dashboard
* 3 - ratelimits for dashboard

config and secret json files should be named config-{ENV} and secret-{ENV}, respectively

## Example `config.json`

```json
{
	"namespace": "oxyl-development",
	"dashboardURL": "oxylbot.com",
	"database": "oxyl",
	"clientID": "441692408363876352"
}
```

## example `secret.json`

```json
{
	"discord": {
		"token": "",
		"secret": ""
	},
	"postgres": {
		"user": "",
		"password": ""
	}
}
```