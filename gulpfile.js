/**
 * FH-Charset Chrome Extension Builder By Gulp
 * @author zhaoxianlie
 */

let gulp = require('gulp');

let clean = require('gulp-clean');
let copy = require('gulp-copy');
let zip = require('gulp-zip');
let uglifyjs = require('gulp-uglify-es').default;
let uglifycss = require('gulp-uglifycss');
let htmlmin = require('gulp-htmlmin');
let jsonmin = require('gulp-jsonminify');
let fs = require('fs');
let through = require('through2');
let path = require('path');
let pretty = require('pretty-bytes');
let shell = require('shelljs');
let runSequence = require('run-sequence');
let watchPath = require('gulp-watch-path');
let gcallback = require('gulp-callback');

gulp.task('clean', () => {
    return gulp.src('output', {read: false}).pipe(clean({force: true}));
});

gulp.task('copy', () => {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur}', '!apps/static/screenshot/**/*']).pipe(copy('output'));
});

gulp.task('json', () => {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output/apps'));
});

gulp.task('html', () => {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('output/apps'));
});

// 合并 & 压缩 js
gulp.task('js', () => {
    let jsMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let merge = (fp, fc) => {
                // 合并 __importScript
                return fc.replace(/__importScript\(\s*(['"])([^'"]*)\1\s*\)/gm, function (frag, $1, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.js$/.test(mod) ? '' : '.js'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return mc + ' ; ';
                });
            };

            contents = merge(file.path, contents);
            file.contents = new Buffer(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.js').pipe(jsMerge()).pipe(uglifyjs()).pipe(gulp.dest('output/apps'));
});

// 合并 & 压缩 css
gulp.task('css', () => {

    let cssMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let merge = (fp, fc) => {
                return fc.replace(/\@import\s+(url\()?\s*(['"])([^'"]*)\2\s*(\))?\s*;?/gm, function (frag, $1, $2, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.css$/.test(mod) ? '' : '.css'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return merge(mp, mc);
                });
            };

            contents = merge(file.path, contents);
            file.contents = new Buffer(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.css').pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest('output/apps'));
});

// 清理冗余文件，并且打包成zip，发布到chrome webstore
gulp.task('zip', () => {

    // 读取manifest文件
    let pathOfMF = './output/apps/manifest.json';
    let manifest = require(pathOfMF);

    // web_accessible_resources 中也不需要加载这些冗余的文件了
    manifest.web_accessible_resources = manifest.web_accessible_resources.filter(f => fileList.indexOf(f) === -1);
    manifest.name = manifest.name.replace('-Dev', '');
    manifest.homepage_url = 'https://www.baidufe.com/fehelper';
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));

    // ============压缩打包 chrome插件================================================
    shell.exec('cd output/ && rm -rf FHCharset-Chrome.zip && zip -r FHCharset-Chrome.zip apps/ > /dev/null');


    // ============压缩打包 Edge插件================================================
    shell.exec('cd output/ && rm -rf apps-Edge && cp -r apps/ apps-Edge');
    pathOfMF = './output/apps-Edge/manifest.json';
    manifest = require(pathOfMF);
    delete manifest.update_url;
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));
    shell.exec('cd output/ && rm -rf FHCharset-Edge.zip && zip -r FHCharset-Edge.zip apps-Edge/ > /dev/null');


    // ============压缩打包 Firefox插件================================================
    shell.exec('cd output/ && rm -rf apps-Firefox && cp -r apps/ apps-Firefox');
    pathOfMF = './output/apps-Firefox/manifest.json';
    manifest = require(pathOfMF);
    delete manifest.update_url;
    manifest.applications = {
        "gecko": {
            "id": "fh-charset@baidufe.com",
            "strict_min_version": "57.0"
        }
    };
    manifest.browser_specific_settings = {
        "gecko": {
            "update_url": "https://www.baidufe.com/fe/web-files/firefox.updates.json"
        }
    };
    manifest.version = manifest.version.replace(/\./, '') + 'stable';
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));
    shell.exec('cd output/apps-Firefox && rm -rf ../FHCharset-Firefox.xpi && zip -r ../FHCharset-Firefox.xpi ./ > /dev/null');

    // 插件大小
    let size = fs.statSync('output/FHCharset-Chrome.zip').size;
    size = pretty(size);

    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    console.log('    去Google Chrome商店发布：');
    console.log('           https://chrome.google.com/u/1/webstore/devconsole/g07645228094812692048 \n');
    console.log('    去Microsoft Edge商店发布：');
    console.log('           https://partner.microsoft.com/zh-CN/dashboard/microsoftedge/fd1a58dd-c709-4811-9013-e089199d7299/packages\n');
    console.log('    去Firefox Addons商店发布：');
    console.log('           https://addons.mozilla.org/zh-CN/developers/addon/web前端助手-FHCharset/versions');
    console.log('================================================================================\n\n');

});

// builder
gulp.task('default', ['clean'], () => {
    runSequence(['copy', 'css', 'js', 'html', 'json'], 'zip');
});
