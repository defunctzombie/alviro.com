var page = require('page');
var Gallery = require('./gallery');
var Filmstrip = require('./filmstrip');
var aws = require('./list');

// in place shuffle with fisher-yates
function shuffle(arr) {
  var i = arr.length;
  if (i === 0)
      return arr;

  while (--i) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = arr[i];
     var tempj = arr[j];
     arr[i] = tempj;
     arr[j] = tempi;
   }

   return arr;
}

$('#homebanner').fadeIn();

var gallery = new Gallery(document.getElementById('gallery'));
var filmstrip = new Filmstrip(document.getElementById('filmstrip'));

page('/', function(ctx, next) {
    // if the home banner was elsewhere, bring that shit back
    $('#homebanner').animate({
        top: '20%'
    }, 'easein');

    filmstrip.enable();

    // get all keys
    aws.all(function(err, res) {
        filmstrip.load(shuffle(res));
    });
});

page('/gallery/*', function(ctx, next) {
    filmstrip.disable();

    $('#homebanner').animate({
        top: 0
    }, 'easein', next);

    $('.homenav').fadeOut();
    $('#filmstrip').fadeOut();

    $('#sidenav').fadeIn();

    // clear gallery from previous
    gallery.clear();
});

page('/gallery', function() {
    page('/gallery/10x10');
});

var sizes = [
    '10x10', '10x20', '10x30', '10x40+', '20x20', '20x30',
    '20x40+', '30x30', '30x40+', '40x40+', '50x50+'
];

page('/gallery/:size', function(ctx, next) {
    var size = ctx.params.size;

    // invalid size
    if (sizes.indexOf(size) < 0) {
        return next();
    }

    $('ul > li').removeClass('selected');
    $('#' + size).addClass('selected');

    aws.loadsize(size, function(err, res) {
        gallery.load(shuffle(res));
    });
});

var $sidenav = $('#sidenav');
for (var i=0 ; i<sizes.length ; ++i) {
    var size = sizes[i];

    $('<a>')
        .attr('href', '/gallery/' + size)
        .html(size.replace('x', '&times;'))
        .appendTo($('<li>').attr('id', size).appendTo($sidenav));
}

page();

