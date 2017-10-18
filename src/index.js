import sass from 'node-sass';
import path from 'path';

const MARK = 'sass-webpack-plugin';

function toFilename(originFile) {
  return path.basename(originFile).replace(/(scss|sass)$/i, 'css');
}

function toAsset(result) {
  return {
    map: () => result.map,
    source: () => result.css,
    size: () => result.css.byteLength
  };
}

function wrapError(err) {
  let header = MARK;
  if (err.file && err.line) {
    header = `${header} ${err.file}:${err.line}`;
  }
  return new Error(`${header}\n\n${err.message}\n`);
}

class SassPlugin {
  constructor(files, pluginOptions, nodeSassoptions) {
    let sassOptions = {};
    const mode = pluginOptions.env;

    if (mode === 'development' || mode === undefined) {
      sassOptions = {
        indentedSyntax: true,
        indentWidth: 2,
        sourceMap: true,
        sourceMapEmbed: true,
        sourceComments: true,
        sourceMapContents: true
      };
    } else if (mode === 'production') {
      sassOptions = {
        outputStyle: 'compressed'
      };
    }

    if (typeof nodeSassoptions === 'object') {
      sassOptions = Object.assign(sassOptions, nodeSassoptions);
    }

    this.files = files.map((f) => {
      return {
        file: path.resolve(f),
        outFile: pluginOptions.dist + toFilename(f)
      };
    });

    this.sassOptions = sassOptions;
  }

  apply(compiler) {

    compiler.plugin('emit', (compilation, cb) => {

      const analyseFiles = (index) => {

        if (index >= this.files.length) {
          cb();
        } else {

          const opt = Object.assign({}, this.sassOptions, {
            file: this.files[index].file
          });

          sass.render(opt, (err, result) => {
            if (err) {
              compilation.errors.push(wrapError(err));
            } else {
              compilation.assets[this.files[index].outFile] = toAsset(result);
              analyseFiles(index + 1);
            }
          });

        }
      };

      //start
      analyseFiles(0);

    });
  }
}

export default SassPlugin;
