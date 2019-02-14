const { exec } = require("child_process");
const fs = require("fs").promises;
const hostname = require("os").hostname;
const path = require("path");

const config = require("./config");
const secret = require("./secret");

config.environment.node = process.env.NODE_ENV;

const namespace = {
	production: "oxyl",
	staging: "oxyl-staging",
	development: "oxyl-development"
}[process.env.NODE_ENV];

const imageTag = {
	production: "production",
	staging: "staging",
	development: "latest"
}[process.env.NODE_ENV];

const actions = {
	async execCommand(command) {
		console.log(`$ ${command}`);
		const out = await await new Promise((resolve, reject) => {
			exec(command, (err, stdout, stderr) => {
				if(err) reject(err);
				else if(stderr) reject(stderr);
				else if(stdout) resolve(stdout);
			});
		});

		console.log(`${out}\n`);
		return out;
	},
	async deleteNamespace() {
		try {
			await actions.execCommand(`kubectl delete namespaces ${namespace}`);
		} catch(err) { } // eslint-disable-line no-empty
	},
	async createNamespace() {
		await actions.execCommand(`kubectl create namespace ${namespace}`);
	},
	async applyConfig() {
		for(const [name, values] of Object.entries(config)) {
			await actions.execCommand(`kubectl create configmap ${name} ${
				Object.entries(values).map(([key, value]) => `--from-literal=${key}=${value}`).join(" ")
			} --namespace=${namespace}`);
		}
	},
	async applySecrets() {
		for(const [name, values] of Object.entries(secret)) {
			await actions.execCommand(`kubectl create secret generic ${name} ${
				Object.entries(values).map(([key, value]) => `--from-literal=${key}=${value}`).join(" ")
			} --namespace=${namespace}`);
		}
	},
	async applyDirectory(directory) {
		const items = await fs.readdir(directory);

		for(const item of items) {
			const resolvedPath = path.resolve(directory, item);

			const stat = await fs.stat(resolvedPath);
			if(stat.isDirectory()) await actions.applyDirectory(resolvedPath);
			else if(stat.isFile()) await actions.applyFile(resolvedPath);
		}
	},
	async applyFile(filePath) {
		const file = await fs.readFile(filePath, "utf8");

		const configured = file.replace(/\{\{namespace\}\}/g, namespace)
			.replace(/\{\{tag\}\}/g, imageTag)
			.replace(/\{\{hostname\}\}/g, hostname);

		const name = `${(Date.now() + process.hrtime().reduce((a, b) => a + b)).toString(36)}.yml`;
		const location = path.resolve(__dirname, name);

		await fs.writeFile(location, configured);
		await actions.execCommand(`kubectl apply -f ${location}`);
		await fs.unlink(location);

		return location;
	}
};

async function init() {
	await actions.deleteNamespace();
	await actions.createNamespace();
	await actions.applyConfig();
	await actions.applySecrets();

	await actions.applyDirectory(path.resolve(__dirname, "services"));
	await actions.applyDirectory(path.resolve(__dirname, "other"));
	await actions.applyDirectory(path.resolve(__dirname, "deployments"));
}

init();

process.on("unhandledRejection", err => {
	console.error(err.stack);

	process.exit(1);
});
