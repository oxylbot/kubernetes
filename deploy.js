const fs = require("fs").promises;
const { exec } = require("child_process");
const path = require("path");

const config = require("./config");
const secret = require("./secret");

config.environment.node = process.env.NODE_ENV;

const namespace = {
	production: "oxyl",
	staging: "oxyl-staging",
	development: "oxyl-development"
}[process.env.NODE_ENV];

const tag = {
	production: "production",
	staging: "staging",
	development: "latest"
}[process.env.NODE_ENV];

async function execCommand(command) {
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
}

async function init() {
	try {
		await execCommand(`kubectl delete namespaces ${namespace}`);
	} catch(err) {} // eslint-disable-line no-empty

	await execCommand(`kubectl create namespace ${namespace}`);

	for(const [name, values] of Object.entries(config)) {
		await execCommand(`kubectl create configmap ${name} ${
			Object.entries(values).map(([key, value]) => `--from-literal=${key}=${value}`).join(" ")
		} --namespace=${namespace}`);
	}

	for(const [name, values] of Object.entries(secret)) {
		await execCommand(`kubectl create secret generic ${name} ${
			Object.entries(values).map(([key, value]) => `--from-literal=${key}=${value}`).join(" ")
		} --namespace=${namespace}`);
	}

	await fs.mkdir(path.resolve(__dirname, "configured"));
	await applyDirectory(path.resolve(__dirname, "services"));
	await applyDirectory(path.resolve(__dirname, "other"));
	await applyDirectory(path.resolve(__dirname, "deployments"));

	const configuredFiles = await fs.readdir(path.resolve(__dirname, "configured"));
	for(const file of configuredFiles) await fs.unlink(path.resolve(__dirname, "configured", file));
	await fs.rmdir(path.resolve(__dirname, "configured"));
}

async function applyDirectory(directory) {
	const items = await fs.readdir(directory);

	for(const item of items) {
		const resolvedPath = path.resolve(directory, item);

		const stat = await fs.stat(resolvedPath);
		if(stat.isDirectory()) {
			await applyDirectory(resolvedPath);
		} else if(stat.isFile()) {
			const configuredFile = await configureFile(resolvedPath);
			await execCommand(`kubectl apply -f ${configuredFile}`);
		}
	}
}

async function configureFile(filePath) {
	const file = await fs.readFile(filePath, "utf8");

	const configured = file.replace(/\{\{namespace\}\}/g, namespace)
		.replace(/\{\{tag\}\}/g, tag);

	const name = `${(Date.now() + process.hrtime().reduce((a, b) => a + b)).toString(36)}.yml`;
	const location = path.resolve(__dirname, "configured", name);
	await fs.writeFile(location, configured);

	return location;
}

init();

process.on("unhandledRejection", err => {
	console.error(err.stack);

	process.exit(1);
});
