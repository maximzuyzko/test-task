const {src, dest, watch, parallel, series}  = require('gulp');
const scss = require('gulp-sass');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const svgSprite = require('gulp-svg-sprite');
const replace = require('gulp-replace');
const cheerio = require('gulp-cheerio');
const del = require('del');
const browserSync = require('browser-sync').create();

const svgSprites = () => {
    return src(['src/img/**.svg', '!src/img/sprite.svg'])
        .pipe(cheerio({
            run: function ($) {
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt', '>'))
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg'
                }
            },
        }))
        .pipe(dest('src/img'));
}

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'src/'
        },
        notify: false,
    })
}

function styles() {
    return src('src/style.scss')
        .pipe(scss({outputStyle: 'expanded'}))
        .pipe(concat('style.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true
        }))
        .pipe(dest('src'))
        .pipe(browserSync.stream())
}

function scripts() {
    return src([
        'src/index.js'
    ])
        .pipe(browserSync.stream())
}

function images() {
    return src('src/img/*.*')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('dist/img'))
}

function build() {
    return src([
        'src/index.html',
        'src/style.css',
        'src/index.min.js',
        'src/fonts/*.*',
        'src/img/*.*',
    ], {base: 'src'})
        .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}

function watching() {
    watch(['src/*.scss'], styles);
    watch(['src/*.js', '!src/js/index.min.js'], scripts);
    watch(['src/*.html']).on('change', browserSync.reload);
    watch(['src/img/**.svg, !src/img/sprite.svg'], svgSprites);
    watch(['src/*.scss']).on('change', browserSync.reload);
}

exports.svgSprites = svgSprites;
exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.cleanDist = cleanDist;

exports.build = series(cleanDist, images, build);

exports.default = parallel(styles, svgSprites, scripts, browsersync, watching);

