;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"./filmstrip":2,"./gallery":3,"./list":4,"page":5}],2:[function(require,module,exports){

var Filmstrip = function(element) {
    var self = this;
    self.element = element;
    self.images = [];

    $(element).scroll(function() {
        /*
        var clip = $(window).scrollTop() + $(window).height();
        var bottom = element.offsetTop + element.offsetHeight;
        if (bottom > clip + 300) {
            return;
        }
        */

        self.next();
    });

    self.enable();
};

Filmstrip.prototype.clear = function() {
    var self = this;
    $(self.element).empty();
};

Filmstrip.prototype.load = function(images) {
    var self = this;
    self.images = images;
    self.next();
};

Filmstrip.prototype.next = function() {
    var self = this;
    var element = self.element;

    var clip = element.clientHeight;
    var bottom = element.scrollHeight - element.scrollTop;
    if (bottom > clip) {
        return;
    }

    var file = self.images.shift();
    if (!file) {
        return;
    }

    // create new image to insert
    var img = document.createElement('img');
    img.src = file;

    img.onload = function() {
        $(img).fadeIn(1000);
        self.next();
    };

    element.appendChild(img);
};

Filmstrip.prototype.enable = function() {
    var self = this;

    // clear any previous interval
    self.disable();

    self.scroll_interval = setInterval(function() {
        self.element.scrollTop += 1;
    }, 20);
};

Filmstrip.prototype.disable = function() {
    var self = this;
    clearInterval(self.scroll_interval);
};

module.exports = Filmstrip;


},{}],3:[function(require,module,exports){

var Gallery = function(element) {
    var self = this;
    self.element = element;
    self.images = [];

    $(window).scroll(function() {
        var clip = $(window).scrollTop() + $(window).height();
        var bottom = element.offsetTop + element.offsetHeight;
        if (bottom > clip + 300) {
            return;
        }

        self.next();
    });
};

Gallery.prototype.clear = function() {
    var self = this;
    $(self.element).empty();
};

Gallery.prototype.load = function(images) {
    var self = this;
    self.images = images;
    self.next();
};

Gallery.prototype.next = function() {
    var self = this;
    var element = self.element;

    var clip = $(window).scrollTop() + $(window).height();
    var bottom = element.offsetTop + element.offsetHeight;
    if (bottom > clip + 200) {
        return;
    }

    var file = self.images.shift();
    if (!file) {
        return;
    }

    // create new image to insert
    var img = document.createElement('img');
    img.src = file;

    img.onload = function() {
        $(img).fadeIn(1000);
        self.next();
    };

    element.appendChild(img);
};

module.exports = Gallery;


},{}],4:[function(require,module,exports){

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
      var url = 'sizes/' + size + '/';
      if (file.Key === url) {
        return false;
      }
      return file.Key.indexOf(url) === 0;
    }).map(function(file) {
      return 'http://alviro.com.s3.amazonaws.com/' + file.Key.replace('+', '%2B');
    });

    return cb(null, files);
  });
};

},{}],5:[function(require,module,exports){

;(function(){

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' == typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' == typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
    // show <path> with [state]
    } else if ('string' == typeof path) {
      page.show(path, fn);
    // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path){
    if (0 == arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options){
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (!dispatch) return;
    page.replace(location.pathname + location.search, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function(){
    running = false;
    removeEventListener('click', onclick, false);
    removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch){
    var ctx = new Context(path, state);
    if (false !== dispatch) page.dispatch(ctx);
    if (!ctx.unhandled) ctx.pushState();
    return ctx;
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function(path, state, init, dispatch){
    var ctx = new Context(path, state);
    ctx.init = init;
    if (null == dispatch) dispatch = true;
    if (dispatch) page.dispatch(ctx);
    ctx.save();
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx){
    var i = 0;

    function next() {
      var fn = page.callbacks[i++];
      if (!fn) return unhandled(ctx);
      fn(ctx, next);
    }

    next();
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (window.location.pathname + window.location.search == ctx.canonicalPath) return;
    page.stop();
    ctx.unhandled = true;
    window.location = ctx.canonicalPath;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;
    var i = path.indexOf('?');
    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? path.slice(i + 1) : '';
    this.pathname = ~i ? path.slice(0, i) : path;
    this.params = [];
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function(){
    history.pushState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function(){
    history.replaceState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(path
      , this.keys = []
      , options.sensitive
      , options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn){
    var self = this;
    return function(ctx, next){
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    }
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params){
    var keys = this.keys
      , qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
      , m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val;
      } else {
        params.push(val);
      }
    }

    return true;
  };

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Boolean} sensitive
   * @param  {Boolean} strict
   * @return {RegExp}
   * @api private
   */

  function pathtoRegexp(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  };

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {
    if (1 != which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' != el.nodeName) el = el.parentNode;
    if (!el || 'A' != el.nodeName) return;

    // ensure non-hash
    var href = el.href;
    var path = el.pathname + el.search;
    if (el.hash || '#' == el.getAttribute('href')) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(href)) return;

    // same page
    var orig = path;
    path = path.replace(base, '');
    if (base && orig == path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null == e.which
      ? e.button
      : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  }

  /**
   * Expose `page`.
   */

  if ('undefined' == typeof module) {
    window.page = page;
  } else {
    module.exports = page;
  }

})();

},{}]},{},[1])
;