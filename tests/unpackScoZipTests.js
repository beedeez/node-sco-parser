"use strict";
var fs = require('fs');
var test = require('tap').test;
var unpackScoZip = require('../unpackScoZip.js');
var testFolder = 'testFiles/unpackScoZipTests';
var pathToExtractZip = 'testFiles/unpackScoZipTests/extractFolder';
var rmrf = require('rimraf');

test('Unpacking the SCO zip file will fail when initialized without params', function(t) {
	unpackScoZip(null, function (err, result) {
		t.ok(err, 'Should error');
		t.equal(err, 'Requires a path to the SCO\'s zip file', 'Should give needs a SCO path message');
		t.end();
	});
});

test('Unpacking the SCO zip file will fail when initialized without a path to the SCO\'s zip file', function(t) {
	var params = {pathToExtractZip: pathToExtractZip};
	unpackScoZip(params, function (err, result) {
		t.ok(err, 'Should error');
		t.equal(err, 'Requires a path to the SCO\'s zip file', 'Should give needs a SCO path message');
		t.end();
	});
});

test('Unpacking the SCO zip file will fail when initialized without a path in which to extract the zip', function(t) {
	var params = {pathToScoZip: testFolder + '/articulate_sco_with_quiz.zip'};
	unpackScoZip(params, function (err, result) {
		t.ok(err, 'Should error');
		t.equal(err, 'Requires a path in which to extract the SCO zip file', 'Should give needs a path in which to unzip message');
		t.end();
	});
});

test('Unpacking the SCO zip file will fail when path to SCO zip does not exist', function(t) {
	var params = {
		pathToScoZip: '/path/to/fakepath.zip',
		pathToExtractZip: pathToExtractZip
	};
	unpackScoZip(params, function (err, result) {
		t.ok(err, 'Should error');
		t.equal(err, 'Invalid filename', 'Should error due to path in which to extract that zip\'s non-existence');
		t.end();
	});
});

test('Unpacking the SCO zip file will fail when the file is not a zip file', function(t) {
	var params = {
		pathToScoZip: testFolder + '/TheDude.jpg',
		pathToExtractZip: pathToExtractZip
	};
	unpackScoZip(params, function (err, result) {
		t.ok(err, 'Should error');
		t.equal(err, 'Invalid or unsupported zip format. No END header found', 'Should error due to file being a JPG.');
		t.end();
	});
});

test('Unpacking the SCO zip file will succeed when the file exists and is a zip file', function(t) {
	t.test('Should extract the zip', function (t) {
		var params = {
			pathToScoZip: testFolder + '/articulate_sco_with_quiz.zip',
			pathToExtractZip: pathToExtractZip
		};
		unpackScoZip(params, function (err, result) {
			t.notOk(err, 'Should not error');
			t.ok(fs.existsSync(pathToExtractZip), 'Should have created path in which to extract zip');
			t.end();
		});
	});

	t.test('Deletes folder in which to unzip the files', function (t) {
		rmrf(pathToExtractZip, function(err, result) {
			t.notOk(err, "failed to remove directory where files were unzipped to");
			t.end();
		});
	});
});