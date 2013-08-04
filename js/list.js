
// prefix - option to REST query to only select a given prefix (folder)

function query_bucket(url, cb) {
  $.get(url)
  .done(function(data) {
    var xml = $(data);
    var files = $.map(xml.find('Contents'), function(item) {
      item = $(item);
      return {
        Key: item.find('Key').text(),
        LastModified: item.find('LastModified').text(),
        Size: item.find('Size').text(),
      }
    });

    cb(null, files);
  })
  .fail(function(error) {
    cb(error);
  });
};

module.exports.all = function(cb) {
  query_bucket('http://alviro.com.s3.amazonaws.com/', function(err, files) {
    if (err) {
      return cb(err);
    }

    files = files.filter(function(file) {
      return /^homepage\/.+/.test(file.Key);
    }).map(function(file) {
      return 'http://alviro.com.s3.amazonaws.com/' + file.Key;
    });

    return cb(null, files);
  });
};

module.exports.loadsize = function(size, cb) {
  query_bucket('http://alviro.com.s3.amazonaws.com/', function(err, files) {
    if (err) {
      return cb(err);
    }

    files = files.filter(function(file) {
      return RegExp('^sizes\/' + size + '\/.+').test(file.Key);
    }).map(function(file) {
      return 'http://alviro.com.s3.amazonaws.com/' + file.Key;
    });

    return cb(null, files);
  });
};
