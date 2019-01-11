# kubernetes
all the configuration files needed in the kubernetes cluster

## Ports:
* :80 - HTTP requests
* :443 - HTTPs requests
* :5432 - PostgreSQL port
* :6379 - Redis port
* :8500 - Gateway REST API
* :8900 - ROUTER to discord-bucket-zmq-proxy
* :8901 - DEALER from discord-bucket-zmq-proxy
* :8902 - PUSH to gateway-cache-zmq-proxy
* :8903 - PULL from gateway-cache-zmq-proxy
* :8904 - PUSH to sharder-messages-zmq-proxy
* :8905 - PULL from sharder-messages-zmq-proxy
* :8906 - PUSH to commands-zmq-proxy
* :8907 - PULL from commands-zmq-proxy