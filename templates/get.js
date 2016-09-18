var fs = require("fs");

var templates = [
    "tsconfig.json",
    "webpack.config.js",
    "index.tsx",
    "index.html"
];

templates.forEach(function(name) {
    fs.createReadStream(__dirname + "/template-" + name)
        .pipe(fs.createWriteStream(name));
});
