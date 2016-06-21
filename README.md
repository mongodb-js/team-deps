# team-deps [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Module that gives extended commands to work with npm dependencies in a nodde project

When working on a large node project, it may rely on many node modules, some of which may actually be modules from your organization but separated into modules for maintainability and testability. It may be necessary to edit/work with these modules but current tools for working with team dependencies may be difficult to maintain. This tool uses existing npm and git commands but chains and automates them for ease of use.

## Commands

```javascript
team-deps -h
```

```
Usage: index.js <command> [options]

Commands:
  list [dir] [options]     List all npm module dependencies of a node project
  clone [dir] [options]    Clone all npm module dependencies of a node project
  check [dir] [options]    Check that all npm module dependencies are up to date
  update [dir] [options]   Update all npm module dependencies against a
                           package.json
  pull [source] [options]  Run git pull for all dependencies of a node project

Options:
  -h, --help  Show help                                                [boolean]

One command required
```

## Example

```javascript
team-deps list
```
will list all the npm production dependencies of the project in the current directory

```javascript
team-deps list <dir>
```
will list all the npm production dependencies of a project in the directory that you specify

```javascript
team-deps list -o <organization>
```
will list all the npm production dependencies of the project in the current directory but filters for only the dependencies from the specified organization

```javascript
team-deps clone -d <destination>
```
will clone the git repos of the current project's npm dependencies to the specified destination directory

```javascript
team-deps pull -s <destination>
```
will git pull all the repos (only if they are on master branch) of the current project's npm dependencies at the specified source directory

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/team-deps.svg
[travis_url]: https://travis-ci.org/mongodb-js/team-deps
[npm_img]: https://img.shields.io/npm/v/team-deps.svg
[npm_url]: https://npmjs.org/package/team-deps
