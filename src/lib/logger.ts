import chalk from 'chalk';

export const logger = {
	info: (message: string, ...args: any[]) => {
		console.log(chalk.blue('INFO: ') + message, ...args);
	},
	warn: (message: string, ...args: any[]) => {
		console.log(chalk.yellow('WARN: ') + message, ...args);
	},
	error: (message: string, error?: any) => {
		console.error(chalk.red('ERROR: ') + message);
		if (error) {
			console.error(chalk.gray(error.stack || error));
		}
	},
	success: (message: string, ...args: any[]) => {
		console.log(chalk.green('SUCCESS: ') + message, ...args);
	},
	debug: (message: string, ...args: any[]) => {
		if (process.env.NODE_ENV !== 'production') {
			console.log(chalk.gray('DEBUG: ') + message, ...args);
		}
	}
};
