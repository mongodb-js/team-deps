var yargs = require('yargs');
var npm_functions = require('./lib/index.js')

var options = yargs
  .usage('Usage: $0 <command> [options]')
  .command('list [dir] [options]', 'List all npm module dependencies of a node project',
    function (yargs) {
      return yargs.option('organization', {
        alias: 'o',
        describe: 'apply a filter to list only npm dependencies from a specified Github organization',
        default: null
      })
    },
    function (argv) {
      npm_functions.list({
        dir: argv.dir,
        o: argv.o
      })
    }
  )
  .command('clone [dir] [options]', 'Clone all npm module dependencies of a node project',
    function (yargs) {
      return yargs.options({
        'destination' : {
          alias: 'd',
          describe: 'a destination directory to clone all git repositories to',
          default: null
        },
        'organization' : {
          alias: 'o',
          describe: 'apply a filter to clone only npm dependencies from a specified Github organization',
          default: null
        }
      })
    },
    function (argv) {
      npm_functions.clone({
        dir: argv.dir,
        d: argv.d,
        o: argv.o
      })
    }
  )
  .command('check [dir] [options]', 'Check that all npm module dependencies are up to date',
    function (yargs) {
      return; //no options supported yet
    },
    function (argv) {
      npm_functions.check({
        dir: argv.dir,
      })
    }
  )
  .command('update [dir] [options]', 'Update all npm module dependencies against a package.json',
    function (yargs) {
      return; //no options supported yet
    },
    function (argv) {
      npm_functions.update({
        dir: argv.dir,
      })
    }
  )
  .command('pull [dir] [options]', 'Run git pull for all dependencies of a node project',
    function (yargs) {
      return yargs.options({
        'destination' : {
          alias: 'd',
          describe: 'a destination directory to find all related git repositories ',
          default: null
        },
        'organization' : {
          alias: 'o',
          describe: 'apply a filter to pull only npm dependencies from a specified Github organization',
          default: null
        }
      })
    },
    function (argv) {
      npm_functions.pull({
        dir: argv.dir,
        d: argv.d,
        o: argv.o
      })
    }
  )
  .demand(1, "One command required")
  .help('h')
  .alias('h', 'help')
  .argv
