'use strict';

var test = require('tape');
var path = require('path');
var process = require('process');
var exec = require('child_process').exec;
var fs = require('fs');

/* SHUTDOWN tests.

    To test whether or not uncaught exception handler will shutdown
        a process we spawn numerous sub proceses and test that
        they are succesfully crashed like a node process would
        crash.
*/

var shutdownChild = path.join(__dirname, 'shutdown-child.js');
var count = 0;
// child process will only exit 128 + 6 if it dumps core
// to enable core dumps run `ulimit -c unlimited`
var SIGABRT_CODE = 134;
var SHUTDOWN_TIMEOUT = 50;

function spawnChild(opts, callback) {
    /*jshint camelcase: false */
    var isIstanbul = process.env.running_under_istanbul;

    var cmd;
    // istanbul can't actually cover processes that crash.
    // so there is little point as it doesn't add much coverage
    // in the future it will https://github.com/gotwarlost/istanbul/issues/127
    if (isIstanbul) {
        cmd = 'node_modules/.bin/istanbul cover ' + shutdownChild +
            ' --report cobertura' +
            ' --print none' +
            ' --dir coverage/shutdown-child' + count + ' -- \'' +
            JSON.stringify(opts) + '\'';
    } else {
        cmd = 'node ' + shutdownChild + ' \'' + JSON.stringify(opts) + '\'';
    }

    count++;
    exec(cmd, {
        timeout: 5000,
        cwd: path.join(__dirname, '..')
    }, callback);
}

test('a child process is aborted', function t(assert) {
    spawnChild({
        consoleLogger: true,
        message: 'crash cleanly'
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.notEqual(
            stderr.indexOf('Uncaught Exception: '), -1);
        assert.notEqual(
            stderr.indexOf('crash cleanly'), -1);

        assert.end();
    });
});

test('throwing in preAbort', function t(assert) {
    spawnChild({
        consoleLogger: true,
        message: 'really crash',
        throwInAbort: true
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.notEqual(
            stderr.indexOf('Uncaught Exception: '), -1);
        assert.notEqual(
            stderr.indexOf('really crash'), -1);

        assert.end();
    });
});

test('writes to backupFile for failing logger', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        errorLogger: true,
        message: 'crash with file',
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('crash with file'), -1);
        assert.equal(stderr.indexOf('crash with file'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'crash with file');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'crash with file');
            assert.equal(line2._uncaughtType,
                'logger.uncaught.exception');

            assert.equal(line3.message,
                'oops in logger.fatal()');
            assert.equal(line3._uncaughtType, 'logger.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('writes to stdout with backupFile stdout', function t(assert) {
    spawnChild({
        errorLogger: true,
        message: 'crash with file',
        backupFile: 'stdout'
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stderr.indexOf('crash with file'), -1);

        var buf = stdout;

        var lines = String(buf).trim().split('\n');

        assert.equal(lines.length, 3);
        var line1 = JSON.parse(lines[0]);
        var line2 = JSON.parse(lines[1]);
        var line3 = JSON.parse(lines[2]);

        assert.equal(line1.message, 'crash with file');
        assert.equal(line1._uncaughtType,
            'exception.occurred');

        assert.equal(line2.message, 'crash with file');
        assert.equal(line2._uncaughtType,
            'logger.uncaught.exception');

        assert.equal(line3.message,
            'oops in logger.fatal()');
        assert.equal(line3._uncaughtType, 'logger.failure');

        assert.end();
    });
});

test('writes to stderr with backupFile stderr', function t(assert) {
    spawnChild({
        errorLogger: true,
        message: 'crash with file',
        backupFile: 'stderr'
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('crash with file'), -1);

        var buf = stderr;

        var lines = String(buf).trim().split('\n');

        assert.equal(lines.length, 4);
        var line1 = JSON.parse(lines[0]);
        var line2 = JSON.parse(lines[1]);
        var line3 = JSON.parse(lines[2]);

        assert.equal(line1.message, 'crash with file');
        assert.equal(line1._uncaughtType,
            'exception.occurred');

        assert.equal(line2.message, 'crash with file');
        assert.equal(line2._uncaughtType,
            'logger.uncaught.exception');

        assert.equal(line3.message,
            'oops in logger.fatal()');
        assert.equal(line3._uncaughtType, 'logger.failure');

        assert.equal(lines[3], 'Aborted (core dumped)');

        assert.end();
    });
});

test('async failing logger', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        asyncErrorLogger: true,
        message: 'async error logger',
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('async error logger'), -1);
        assert.equal(stderr.indexOf('async error logger'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'async error logger');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'async error logger');
            assert.equal(line2._uncaughtType,
                'logger.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.logger.async-error');
            assert.equal(line3._uncaughtType, 'logger.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('writes to backupFile for failing shutdown', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        message: 'crash with bad shutdown',
        backupFile: loc,
        badShutdown: true
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(
            stdout.indexOf('crash with bad shutdown'), -1);
        assert.equal(
            stderr.indexOf('crash with bad shutdown'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message,
                'crash with bad shutdown');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message,
                'crash with bad shutdown');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            assert.equal(line3.message,
                'oops in graceful shutdown');
            assert.equal(line3._uncaughtType,
                'shutdown.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a naughty shutdown', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        message: 'crash with naughty shutdown',
        backupFile: loc,
        naughtyShutdown: true
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(
            stdout.indexOf('crash with naughty shutdown'), -1);
        assert.equal(
            stderr.indexOf('crash with naughty shutdown'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 2);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);

            assert.equal(line1.message,
                'crash with naughty shutdown');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message,
                'crash with naughty shutdown');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            fs.unlink(loc, assert.end);
        });
    });
});

test('async failing shutdown', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        message: 'async failing shutdown',
        backupFile: loc,
        asyncBadShutdown: true
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(
            stdout.indexOf('async failing shutdown'), -1);
        assert.equal(
            stderr.indexOf('async failing shutdown'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message,
                'async failing shutdown');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message,
                'async failing shutdown');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.shutdown.async-error');
            assert.equal(line3._uncaughtType,
                'shutdown.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a timeout logger', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        timeoutLogger: true,
        message: 'timeout logger',
        backupFile: loc,
        loggerTimeout: SHUTDOWN_TIMEOUT
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('timeout logger'), -1);
        assert.equal(stderr.indexOf('timeout logger'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'timeout logger');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'timeout logger');
            assert.equal(line2._uncaughtType,
                'logger.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.logger.timeout');
            assert.equal(line3._uncaughtType, 'logger.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a thrown logger', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        thrownLogger: true,
        message: 'thrown logger',
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('thrown logger'), -1);
        assert.equal(stderr.indexOf('thrown logger'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'thrown logger');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'thrown logger');
            assert.equal(line2._uncaughtType,
                'logger.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.logger.threw');
            assert.equal(line3._uncaughtType, 'logger.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a timeout shutdown', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        timeoutShutdown: true,
        message: 'timeout shutdown',
        backupFile: loc,
        shutdownTimeout: SHUTDOWN_TIMEOUT
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('timeout shutdown'), -1);
        assert.equal(stderr.indexOf('timeout shutdown'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'timeout shutdown');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'timeout shutdown');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.shutdown.timeout');
            assert.equal(line3._uncaughtType,
                'shutdown.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a thrown shutdown', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        thrownShutdown: true,
        message: 'thrown shutdown',
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('thrown shutdown'), -1);
        assert.equal(stderr.indexOf('thrown shutdown'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'thrown shutdown');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'thrown shutdown');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.shutdown.threw');
            assert.equal(line3._uncaughtType,
                'shutdown.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a timeout + late succeed', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        lateTimeoutLogger: true,
        loggerTimeout: SHUTDOWN_TIMEOUT,
        message: 'late timeout logger',
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('late timeout logger'), -1);
        assert.equal(stderr.indexOf('late timeout logger'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'late timeout logger');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'late timeout logger');
            assert.equal(line2._uncaughtType,
                'logger.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.logger.timeout');
            assert.equal(line3._uncaughtType, 'logger.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles a shutdown + late succeed', function t(assert) {
    var loc = path.join(__dirname, 'backupFile.log');

    spawnChild({
        lateTimeoutShutdown: true,
        message: 'late shutdown logger',
        shutdownTimeout: SHUTDOWN_TIMEOUT,
        backupFile: loc
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.equal(stdout.indexOf('late shutdown logger'), -1);
        assert.equal(stderr.indexOf('late shutdown logger'), -1);

        fs.readFile(loc, function onfile(err2, buf) {
            assert.ifError(err2);

            var lines = String(buf).trim().split('\n');

            assert.equal(lines.length, 3);
            var line1 = JSON.parse(lines[0]);
            var line2 = JSON.parse(lines[1]);
            var line3 = JSON.parse(lines[2]);

            assert.equal(line1.message, 'late shutdown logger');
            assert.equal(line1._uncaughtType,
                'exception.occurred');

            assert.equal(line2.message, 'late shutdown logger');
            assert.equal(line2._uncaughtType,
                'shutdown.uncaught.exception');

            assert.equal(line3.type,
                'uncaught-exception.shutdown.timeout');
            assert.equal(line3._uncaughtType,
                'shutdown.failure');

            fs.unlink(loc, assert.end);
        });
    });
});

test('handles writing to bad file', function t(assert) {
    var loc = path.join(__dirname, 'does', 'not', 'exist');

    spawnChild({
        message: 'crash with bad backupFile',
        backupFile: loc,
        consoleLogger: true,
        badShutdown: true
    }, function onerror(err, stdout, stderr) {
        assert.ok(err);
        assert.equal(err.code, SIGABRT_CODE);

        assert.notEqual(
            stderr.indexOf('Uncaught Exception: '), -1);
        assert.notEqual(
            stderr.indexOf('crash with bad backupFile'), -1);

        assert.end();
    });
});
