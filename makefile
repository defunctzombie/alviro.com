dist: js/build.js

js/build.js: js/app.js
	browserify $< > $@
