const config = require(`./config-${process.env.NODE_ENV}`);
const { exec } = require("child_process");

const namespace = config.namespace;

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
		await actions.execCommand(`kubectl delete namespace ${namespace}`);
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
