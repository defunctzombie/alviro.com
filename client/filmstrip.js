
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
    // none left to load
    if (!file) {
        return;
    }

    // create new image to insert
    var img = document.createElement('img');
    img.src = '/img/thumb/' + file;

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

