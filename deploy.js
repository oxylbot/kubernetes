const fs = require("fs").promises;
const { exec } = require("child_process");
const path = require("path");

async function init() {
	await fs.mkdir(path.resolve(__dirname, "configured"));

	await applyDirectory(path.resolve(__dirname, "deployments"));
	await applyDirectory(path.resolve(__dirname, "services"));

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
			await new Promise((resolve, reject) => {
				exec(`kubectl apply -f ${configuredFile}`, (err, stdout, stderr) => {
					if(err) reject(err);
					else if(stderr) reject(stderr);
					else if(stdout) resolve(stdout);
				});
			});
		}
	}
}

async function configureFile(filePath) {
	const file = await fs.readFile(filePath, "utf8");

	const configured = file.replace(/\{\{namespace\}\}/g, {
		production: "oxyl",
		staging: "oxyl-staging",
		development: "oxyl-development"
	}[process.env.NODE_ENV]);

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
