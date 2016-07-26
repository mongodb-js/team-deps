/* eslint camelcase:0 */
/* eslint no-unused-expressions:0 */

// var teamDeps = require('../');
// var assert = require('assert');

var chai = require('chai');
var expect = chai.expect;
var proxyquire = require('proxyquire');
var stream = require('stream');
var spawn_stub = {};

var npm_proxy = proxyquire('../lib/index.js', { 'spawn': spawn_stub });
// var npm_json = require('./npm_ls_minified.json');

describe('team-deps', function() {
  it('exec_cmd with no options should return an error', function(done) {
    npm_proxy.exec_cmd({}, function(err) {
      expect(err).to.equal('EXEC ERROR: no command specified');
      done();
    });
  });

  it('exec_cmd should return a steam', function(done) {
    npm_proxy.exec_cmd({command: 'ls'}, function(err, res) {
      expect(err).to.be.null;
      expect(res).to.be.an.instanceof(stream.Readable);
      done();
    });
  });

  // it('exec_cmd should return a mapped stream', function(done) {
  //   // sinon
  //   //   .stub(process, 'spawn')
  //   //   .returns(npm_json);
  //
  //   // console.log(typeof npm_json, npm_json);
  //   npm_proxy.exec_cmd({command: 'npm', args: ['ls']}, function(err, res) {
  //     // console.log(res);
  //     done();
  //   });
  // });

  it('filter_organization should return a function', function(done) {
    expect(npm_proxy.filter_organization('chai')).to.be.an.instanceof(Function);
    done();
  });

  // it('map', function(done) {
  //   npm_proxy.map_module_name({}, enc, function(err, res) {
  //     console.log(err);
  //     console.log(res);
  //     done();
  //   });
  // });
});
