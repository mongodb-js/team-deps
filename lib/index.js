/**
 *
 * @api public
 */
 var chalk = require('chalk');
 var exec = require('child_process').exec;
 var jsonStream = require('JSONStream');
 var path = require('path');
 var spawn = require('child_process').spawn;
 var stream = require('stream');
 var through = require('through2');

 /**
  Command that executes a command with a spawned child process,
   then runs parse, map, and filter functions of the stdout
   Returns a readable stream through the callback

   options = {
     dir: directory to run the command in
     command: command to execute
     args: additional args to run command with
     parse: function to parse command stdout
     map: function to map over all parsed stdout
     filter: function to filter all mapped stdout
   }
 **/
 var exec_cmd = function(options, callback) {
   //bad args handling
   if (!options.command) {
     return callback('EXEC ERROR: no command specified');
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

  //  res.stdout.on('data', (data) => {
  //    console.log(data.toString());
  //  });
  //  console.log(res);
   //

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

 /**
  Function to parse out the name and repository information from an object chunk
 **/
 var map_module_name = function(chunk, enc, callback) {
   if (!chunk.name || !chunk.repository) {
     return callback('MAP ERROR: No dependencies found, try <module> update or npm install');
   }

   let obj = {
     name: chunk.name,
     repo_type: chunk.repository.type,
     repo_url: chunk.repository.url };
   this.push(obj);
   callback();
 };

 /**
  Function to filter out only chunks with the correct organization affiliation
 **/
 var filter_organization = function(organization) {
   return function(chunk, enc, callback) {
     if (chunk.repo_url.includes('github.com/' + organization)) {
       this.push(chunk);
     }
     callback();
   };
 }

 module.exports = {
   exec_cmd: exec_cmd,
   map_module_name: map_module_name,
   filter_organization: filter_organization,

   list: function(argv) {
     let options = {
       dir: argv.dir,
       command: 'npm',
       args: ['ls', '--production', '--long', '--json'],
       parse: jsonStream.parse('dependencies.*'),
       map: map_module_name
     };

     // add organization filter if applicable
     if (argv.o) {
       options['filter'] = filter_organization(argv.o);
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
       map: map_module_name,
     };

     // add organization filter if applicable
     if (argv.o) {
       options['filter'] = filter_organization(argv.o);
     }

     exec_cmd(options, function(err, res) {
       if (err) {
         console.error(err);
       }

       //get return from npm ls and run git_clone function for relevant repos
       res.on('data', function(data) {
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
         console.log(data.toString());
       });
     });
   },

   pull: function(argv) {
     if (!argv.dir && !argv.d) {
       return console.error('No directory or destination specified');
     }

     var git_pull = function(url, callback) {
       const git_dir = url.split('/').pop().replace('.git', '');

       let options = {
         dir: git_dir,
         command: 'git',
         args: ['pull'] //['origin', 'master']
       }

       //override options.dir if destination specified
       if (argv.d) {
         options['dir'] = argv.d + '/' + git_dir;
       }

       const branch_cmd = 'git branch | grep "^\* master"';
       exec(branch_cmd, {cwd: options.dir}, (error, stdout, stderr) => {
         if (error && error.toString().includes('ENOENT')) {
           return callback(`${options.dir} PULL ERROR: Directory does not exist, check that the specified directory contains the correct git repo`);
         } else if (error && error.toString().includes('Command failed')) {
           return callback(`PULL ERROR: ${options.dir} is not on master branch`) //git diff master...branch
         }

         exec_cmd(options, function(err, res) {
           if (err) {
             return callback(err)
           }

           let res_str = chalk.green(`${options.dir}: `);
           res.on('data', (data) => {
             res_str += data;
           });

           res.on('end', () => {
             callback(null, res_str);
           });
         });
       });
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
       options['filter'] = filter_organization(argv.o);
     }

     exec_cmd(options, function(err, res) {
       if (err) {
         console.error(err);
       }

       //get return from npm ls and run git_pull function for relevant repos
       res.on('data', function(data) {
         git_pull(data.repo_url, function(err, res) {
           if (err) {
             return console.error(err);
           };
           console.log(res);
         });
       });
     });
   }
 }
