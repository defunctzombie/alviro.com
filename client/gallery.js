
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

module.exports = Gallery;

