var yauzl = require("yauzl");
var path = require("path");
var fs = require("fs");
var util = require("util");
var Transform = require("stream").Transform;

function prependExtractPath(extractPath, path) {

	return `./${extractPath}/${path}`;

}

function ensureExtractDirectoryExists(extractPath, callback) {
	
  fs.stat(extractPath, function(fileStatError) {

    if (fileStatError == null) { // File already exists
			return callback();
		}

		// Extract directory does not exist
    fs.mkdir(extractPath, callback);

  });
}

module.exports = (zipFileBuffer, extractPath, cb) => {
	return ensureExtractDirectoryExists(`./${extractPath}`, function(createDirectoryError) {
		if(createDirectoryError) {
			return cb(createDirectoryError);
		}

		// Lazy load zip file buffer
		return yauzl.fromBuffer(zipFileBuffer, { lazyEntries: true }, (bufferError, zipFile) => {
			
			return handleZipFile(bufferError, zipFile, extractPath, cb);
			
		});

	});

};

function mkdirp(directory, extractPath, createDirectoryCallback) {
  
	if (directory === '.') { // Root of the zip file
		return createDirectoryCallback();
	}
	
  fs.stat(prependExtractPath(extractPath, directory), function(fileStatError) {

    if (fileStatError == null) { // File already exists
			return createDirectoryCallback();
		}
		// Directory does not exist, call this for current directory parent
    var parent = path.dirname(directory);

    mkdirp(parent, extractPath, function() {
      // process.stdout.write(directory.replace(/\/$/, "") + "/\n");

			// Then create directory
      fs.mkdir(prependExtractPath(extractPath, directory), createDirectoryCallback);
    });

  });
}

function handleZipFile(openError, zipFile, extractPath, cb) {

  if (openError) {
		return cb(openError)
	}

  // track when we've closed all our file handles
  var handleCount = 0;
  function incrementHandleCount() {
    handleCount++;
  }
  function decrementHandleCount() {
    handleCount--;
    if (handleCount === 0) {
      console.log("all input and output handles closed");
    }
  }

  incrementHandleCount();

  zipFile.on("close", function() {
    console.log("closed input file");
    decrementHandleCount();
  });

	zipFile.once("end", function() {

		// When every entries has been processed
		cb();

  });

  zipFile.on("entry", function(entry) {

    if (/\/$/.test(entry.fileName)) {

      // directory file names end with '/'
      mkdirp(entry.fileName, extractPath, function(createDirectoryError) {

        if (createDirectoryError) {
					return cb(createDirectoryError);
				}

        zipFile.readEntry();
      });

    } else {

      // ensure parent directory exists
      mkdirp(path.dirname(entry.fileName), extractPath, function() {
				
        zipFile.openReadStream(entry, function(readStreamError, readStream) {

          if (readStreamError) {
						return cb(readStreamError);
					}

          // report progress through large files
          var byteCount = 0;
          var totalBytes = entry.uncompressedSize;
          var lastReportedString = byteCount + "/" + totalBytes + "  0%";

          process.stdout.write(entry.fileName + "..." + lastReportedString);

          function reportString(msg) {

            var clearString = "";

            for (var i = 0; i < lastReportedString.length; i++) {

              clearString += "\b";

              if (i >= msg.length) {
                clearString += " \b";
              }

            }

            process.stdout.write(clearString + msg);

            lastReportedString = msg;

          }
          // report progress at 60Hz
          var progressInterval = setInterval(function() {

            reportString(byteCount + "/" + totalBytes + "  " + ((byteCount / totalBytes * 100) | 0) + "%");

          }, 1000 / 60);

          var filter = new Transform();
          filter._transform = function(chunk, encoding, transformCallback) {
            byteCount += chunk.length;
            transformCallback(null, chunk);
          };
          filter._flush = function(flushCallback) {
            clearInterval(progressInterval);
            reportString("");
            // delete the "..."
            process.stdout.write("\b \b\b \b\b \b\n");
            flushCallback();
            zipFile.readEntry();
          };

          // pump file contents
          var writeStream = fs.createWriteStream(prependExtractPath(extractPath, entry.fileName));
          incrementHandleCount();
          writeStream.on("close", decrementHandleCount);
          readStream.pipe(filter).pipe(writeStream);
        });
      });
    }
  });
  zipFile.readEntry();
}