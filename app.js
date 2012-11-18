// builtin
var fs = require('fs');

// vendor
var express = require('express');
var im = require('imagemagick');

var app = express();

app.use(express.static(__dirname + '/public'));

// all image files
app.get('/img', function(req, res, next) {
    fs.readdir(__dirname + '/public/img/full', function(err, sizes) {
        if (err) {
            return next(err);
        }

        var images = [];

        (function next_dir() {
            var size = sizes.shift();
            if (!size) {
                return res.json(images);
            }

            fs.readdir(__dirname + '/public/img/full/' + size, function(err, files) {
                if (err) {
                    return next(err);
                }

                images = images.concat(files.map(function(file) {
                    return size + '/' + file;
                }));

                next_dir();
            });
        })();
    });
});

// images for a certain size
app.get('/img/:size', function(req, res, next) {
    var size = req.param('size');

    fs.readdir(__dirname + '/public/img/full/' + size, function(err, images) {
        if (err) {
            return next(err);
        }

        images = images.map(function(img) {
            return '/' + size + '/' + img;
        });

        res.json(images);
    });
});

// thumbnail generator
app.get('/img/:thumb/:size/:file', function(req, res, next) {
    var full_filename = __dirname + '/public/img/full/' + req.param('size') + '/' + req.param('file');

    var thumb_filename = __dirname + '/public/img/thumb/' + req.param('size') + '/' + req.param('file');

    res.contentType('image/jpg');

    //var write = fs.createWriteStream(thumb_filename);
    im.resize({
        srcPath: full_filename,
        dstPath: thumb_filename,
        width:   300
    }, function(err, stdout, stderr){
        if (err) {
            return next(err);
        }

        fs.createReadStream(thumb_filename).pipe(res);
    });
});

app.get('*', function(req, res, next) {
    fs.createReadStream(__dirname + '/views/index.html').pipe(res);
});

var port = process.argv[2] || 8000;

var server = app.listen(port, function() {
    console.log('listening on port: ' + port);
});
