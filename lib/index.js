var chalk = require('chalk');
var spawn = require('child_process').spawn;
var stream = require('stream');
var jsonStream = require('JSONStream');
var path = require('path');
var through = require('through2');
/***
  Command to abstract out the edge cases of dealing with streams

  options = {
    dir
    command
    args
    parse
    map
    filter
  }
***/
exec_cmd = function(options, callback) {
  //bad args handling
  if (!options.command) {
    return callback('ERR: no command specified');
  }

  let read_str = stream.Readable({ objectMode: true });
  /*
  _read function must be defined for any Readable stream
  since in this case, stdout_stream ondata functions are flowing + pushing information forwards,
  _read function does not have to do anything explicitly
  implementation can (and maybe should change) to handle streams that can be paused
  */
  read_str._read = function() {
    return;
  };

  //spawn child process with command and args if applicable
  const resolved_dir = options.dir ? path.resolve(options.dir) : null

  let res = resolved_dir ?
              options.args ? spawn(options.command, options.args, {cwd: resolved_dir}) : spawn(options.command, {cwd: resolved_dir}) :
              options.args ? spawn(options.command, options.args) : spawn(options.command);

  res.stderr.on('data', (error) => {
    //npm outputs erroneous errors that might not be applicable, print for now
    console.error(error.toString());
    // return callback(`ERR: ${error}`);
  });

  //apply parse to stdout stream if applicable
  let stdout_parse = options.parse ? res.stdout.pipe(options.parse) : res.stdout;

  //apply map to stdout stream if applicable
  let stdout_map = options.map ? stdout_parse.pipe(through.obj(options.map)) : stdout_parse;

  // apply filter to stdout stream if applicable
  let stdout_filter = options.filter ? stdout_map.pipe(through.obj(options.filter)) : stdout_map;

  callback(null, stdout_filter);
}

module.exports = {

  list: function(argv) {
    var map_module_name = function(chunk, enc, callback) {
      let obj = {
        name: chunk.name,
        repo_type: chunk.repository.type,
        repo_url: chunk.repository.url };
      this.push(obj);
      callback();
    };

    var filter_organization = function(chunk, enc, callback) {
      if (chunk.repo_url.includes(argv.o)) {
        this.push(chunk);
      }
      callback();
    };

    let options = {
      dir: argv.dir,
      command: 'npm',
      args: ['ls', '--long', '--json'],
      parse: jsonStream.parse('dependencies.*'),
      map: map_module_name,
    };

    // add organization filter if applicable
    if (argv.o) {
      options['filter'] = filter_organization;
    }

    exec_cmd(options, function(err, res) {
      if (err) {
        console.error(err);
      }

      res.on('data', function(data) {
        console.log(chalk.green(data.name) + ' | ' + data.repo_type + ' | ' + data.repo_url);
      });
    });
  },

  clone: function(argv) {
    if (!argv.dir && !argv.d) {
      return console.error('No directory or destination specified');
    }

    var map_repo_url = function(chunk, enc, callback) {
      let obj = {
        repo_url: chunk.repository.url };
      this.push(obj);
      callback();
    };

    var filter_organization = function(chunk, enc, callback) {
      if (chunk.repo_url.includes(argv.o)) {
        this.push(chunk);
      }
      callback();
    };

    var git_clone = function(url, callback) {
      let options = {
        command: 'git',
        args: ['clone', url.replace('git+https', 'git')]
      }

      if (argv.d) {
        options['dir'] = argv.d;
      }

      exec_cmd(options, function(err, res) {
        if (err) {
          return callback(err)
        }

        let res_str = ''
        res.on('data', (data) => {
          res_str += data;
        });

        res.on('end', () => {
          callback(null, res_str);
        });
      });
    };

    let options = {
      dir: argv.dir,
      command: 'npm',
      args: ['ls', '--long', '--json'],
      parse: jsonStream.parse('dependencies.*'),
      map: map_repo_url,
    };

    // add organization filter if applicable
    if (argv.o) {
      options['filter'] = filter_organization;
    }

    exec_cmd(options, function(err, res) {
      if (err) {
        console.error(err);
      }

      res.on('data', function(data) {
        // console.log(data.repo_url);
        git_clone(data.repo_url, function(err, res) {
          if (err) {
            console.error(err);
          };
          console.log(res);
        });
      });
    });
  },

  check: function(argv) {
    var map_outdated_module = function(chunk, enc, callback) {
      let obj = {
        name: chunk.key,
        current: chunk.value.current,
        wanted: chunk.value.wanted,
        latest: chunk.value.latest,
        location: chunk.value.location };
      this.push(obj);
      callback();
    };

    let options = {
      dir: argv.dir,
      command: 'npm',
      args: ['outdated', '--json'],
      parse: jsonStream.parse('$*'),
      map: map_outdated_module,
    };

    exec_cmd(options, function(err, res) {
      if (err) {
        console.error(err);
      }

      console.log(chalk.underline('Package') + ' \t ' + chalk.underline('Current') + ' \t ' + chalk.underline('Wanted') + ' \t ' + chalk.underline('Latest') + ' \t ' + chalk.underline('Location'));

      res.on('data', function(data) {
        console.log(chalk.yellow(data.name) + ' \t ' + data.current + ' \t ' + chalk.green(data.wanted) + ' \t ' + chalk.magenta(data.latest) + ' \t ' + chalk.gray(data.location));
      });
    });
  },

  update: function(argv) {
    let options = {
      dir: argv.dir,
      command: 'npm',
      args: ['install'],
    };

    exec_cmd(options, function(err, res) {
      if (err) {
        console.error(err);
      }

      res.on('data', function(data) {
        console.log(data);
      });
    });
  },

  pull: function(argv) {
    let options = {
      dir: argv.dir,
      command: ''

    }



  }
}
