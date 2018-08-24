const { URL } = require("url");
const fetch = require("node-fetch");

module.exports = class Service {
  constructor(serviceName, options) {
    this.service = serviceName;
    this.registryHostname;
    this.registryPort;
    this.hostname;
    this.port;
    this.protocol = "http";

    this.register = this.register.bind(this);
    this.unregister = this.unregister.bind(this);

    if (!options) {
      if (process.env.SERVICE_REGISTRY_HOSTNAME) {
        this.registryHostname = process.env.SERVICE_REGISTRY_HOSTNAME;
      }
      if (process.env.SERVICE_REGISTRY_PORT) {
        this.registryPort = SERVICE_REGISTRY_PORT;
      }
      if (process.env.SERVICE_REGISTRY_HOSTNAME) {
        this.hostname = process.env.SERVICE_REGISTRY_HOSTNAME;
      }
      if (process.env.SERVICE_REGISTRY_PORT) {
        this.port = SERVICE_REGISTRY_PORT;
      }
    } else {
      if (options.hostname) {
        this.hostname = options.hostname;
      }
      if (options.port) {
        this.port = options.port;
      }

      if (options.registryHostname) {
        this.registryHostname = options.registryHostname;
      }
      if (options.registryPort) {
        this.registryPort = options.registryPort;
      }
    }
    if (
      !(
        this.hostname &&
        this.port &&
        this.registryHostname &&
        this.registryPort
      )
    ) {
      console.log(`this: ${JSON.stringify(this, null, 2)}`);
      throw Error(
        "Hostname and port for both service and registry must be supplied either in the options object or as environment variables"
      );
    }
    if (options && options.protocol) {
      this.protocol = options.protocol;
    }
    this.serviceRegistryUrl = new URL(
      `http://${this.registryHostname}:${this.registryPort}`
    );
    this.url = new URL(`${this.protocol}://${this.hostname}:${this.port}`);
  }

  async register(cb) {
    const { service, hostname, port, url } = this;
    try {
      const res = await fetch(this.serviceRegistryUrl, {
        method: "post",
        body: JSON.stringify({
          service,
          hostname,
          port
        })
      });
      if (res.status === 200) {
        cb();
      } else {
        cb(
          Error(
            `Attempt to register ${service} at ${url} failed. Status code ${
              res.status
            } received.`
          )
        );
      }
    } catch (e) {
      cb(
        Error(
          `Attempt to register ${service} at ${url} failed. Unable to contact service registry. Error: ${e}`
        )
      );
    }
  }

  async unregister(cb) {
    const { service, hostname, port, url } = this;
    try {
      const res = await fetch(`${this.serviceRegistryUrl}/delete`, {
        method: "post",
        body: JSON.stringify({
          service,
          hostname,
          port
        })
      });
      if (res.status > 200 && res.status < 300) {
        cb();
      } else {
        cb(
          Error(
            `Attempt to unregister ${service} at ${url} failed. Status code ${
              res.status
            } received.`
          )
        );
      }
    } catch (e) {
      cb(
        Error(
          `Attempt to register ${service} at ${url} failed. Unable to contact service registry. Error: ${e}`
        )
      );
    }
  }

  async discover(cb) {
    const { service, serviceRegistryUrl } = this;
    try {
      const res = await fetch(`${this.serviceRegistryUrl}/discover`, {
        method: "post",
        body: JSON.stringify({
          service
        })
      });
      const j = await res.json();
      if (j.statusCode && j.statusCode === 200) {
        cb(null, body);
      } else {
        cb(
          Error(
            `Attempt to discover ${service} on registry ${serviceRegistryUrl} failed. Status code ${
              j.statusCode
            } received.`
          )
        );
      }
    } catch (e) {
      cb(
        Error(
          `Attempt to discover ${service} on registry ${serviceRegistryUrl} failed. Status code ${
            res.status
          } received.`
        )
      );
    }
  }
};
