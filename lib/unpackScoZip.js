const unzip = require('./utils/unzip');
// const fs = require('fs');

module.exports = (params, cb) => {
	const p = params || {};
	if (!p.pathToScoZip) { // This is not a path but a buffer
		return cb("Requires a path to the SCO's zip file");
	}
	if (!p.pathToExtractZip) {
		return cb('Requires a path in which to extract the SCO zip file');
	}

	unzip(p.pathToScoZip, p.pathToExtractZip, (unzipError) => {
		cb(unzipError);
	});

};
