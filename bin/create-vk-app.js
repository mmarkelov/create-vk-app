#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

const packageJson = require('../package.json');

const scripts = `"start": "cross-env PORT=10888 react-scripts start",
"build": "react-scripts build"`;

// Polyfill
if (!Object.entries) {
	Object.entries = function( obj ){
	  var ownProps = Object.keys( obj ),
		  i = ownProps.length,
		  resArray = new Array(i); // preallocate the Array
	  while (i--)
		resArray[i] = [ownProps[i], obj[ownProps[i]]];
	  
	  return resArray;
	};
  }

// Parse and prepare string to install dependencies
const getDeps = deps =>
	Object.entries(deps)
		.map(dep => `${dep[0]}@${dep[1]}`)
		.toString()
		.replace(/,/g, ' ')
		.replace(/^/g, '')
		// exclude the plugin only used in this file, nor relevant to the boilerplate
		.replace(/fs-extra[^\s]+/g, '')
		.replace(/gh-pages[^\s]+/g, '');

console.log('🎬  Creating project...');

exec(
	`mkdir ${process.argv[2]} && cd ${process.argv[2]} && npm init -f`,
	(initErr) => {
		if (initErr) {
			console.error(`😳 Initializing error:\n${initErr}`);
			return;
		}
		const packageJSON = `${process.argv[2]}/package.json`;

		fs.readFile(packageJSON, (err, file) => {
			if (err) throw err;
			const data = file
				.toString()
				.replace('"test": "echo \\"Error: no test specified\\" && exit 1"', scripts)
				.replace('"license": "ISC"', '"license": "MIT"');
			fs.writeFile(packageJSON, data, (error) => {
				if (error) throw error;
			});
		});

		const filesToCopy = ['README.md'];

		for (let i = 0; i < filesToCopy.length; i += 1) {
			fs.createReadStream(path.join(__dirname, `../${filesToCopy[i]}`))
			.pipe(fs.createWriteStream(`${process.argv[2]}/${filesToCopy[i]}`));
		}


		let body = `# Logs
logs
*.log
npm-debug.log*
*.lock

# Dependency directories
package-lock.json
/node_modules

# Optional npm cache directory
.npm

# Prod Bundle
/build

.vscode
.idea
`;
		fs.writeFile(`${process.argv[2]}/.gitignore`, body, { encoding: 'utf-8' }, (err) => {
			if (err) throw err;
		});

		// installing dependencies
		console.log('⏱  Installing project dependencies — it might take a few minutes..');
		const devDeps = packageJson.devDependencies ? getDeps(packageJson.devDependencies) : '';
		const deps = packageJson.dependencies ? getDeps(packageJson.dependencies) : '';
		exec(
			`cd ${process.argv[2]}${devDeps ? ` && npm install ${devDeps} --save-dev` : ''}${deps ? ` && npm install ${deps}` : ''}`,
			(npmErr, npmStdout) => {
				if (npmErr) {
					console.error(`😳  npm error:\n${npmErr}`);
					return;
				}
				console.log('✅  Dependencies installed');

				console.log('⏱  Copying VK App source files..');
				fs.copy(path.join(__dirname, '../public'), `${process.argv[2]}/public`)
				.then(() => console.log(`🖼  Assets directory and file copied`))
				.catch(err => console.error(err));

				fs.copy(path.join(__dirname, '../src'), `${process.argv[2]}/src`)
				.then(() => {
					// TODO Config feature will be enabled later
					// if (process.argv[3] !== undefined) {
					// 	const configFile = `${process.argv[2]}/src/config.js`;
					// 	const data = `export default {\n\tappId: ${process.argv[3]},\n};\n`;
					// 	fs.writeFile(configFile, data, (err) => {
					// 		if (err) throw err;
					// 	});
					// }
					console.log(`✌️  VK App Boilerplate is ready to start in ${process.argv[2]} folder. \n🧐  Check README.MD for brief instructrions.\n💻  Happy Coding!`)
				})
				.catch(err => console.error(err));
			}
		);
	}
);
