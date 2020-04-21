const { exec } = require("child_process");
const fs = require("fs").promises;
const hostname = require("os").hostname;
const path = require("path");

const namespace = {
	production: "oxyl",
	staging: "oxyl-staging",
	development: "oxyl-development"
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
		await actions.execCommand(`kubectl delete namespaces ${namespace}`);
	},
	async deletePersistentVolume() {
		await actions.execCommand(`kubectl delete pv postgres-pv-${namespace}`);
	}
};

async function init() {
	await actions.deleteNamespace();
	await actions.deletePersistentVolume();
}

init();

process.on("unhandledRejection", err => {
	console.error(err.stack);

	process.exit(1);
});