(function (w) {

  var fileSystem = (function () {

    var m = {} // public methods
      , tree // directory tree
      , pwd // present working directory
      , af // active file
      , info // info pane
      , editor; // text editor


    m.init = function (fs) {

      var nFile, nFolder;

      nFile = document.getElementById("new-file");
      nFolder = document.getElementById("new-file");
      tree = document.getElementById("dir-tree");
      info = document.getElementById("info-pane");
      editor = document.getElementById("editor");

      tree.addEventListener("click", m.open, false);

      document
        .getElementById("save")
        .addEventListener("click", m.save, false);

      nFile.addEventListener("click", m.newFile, false);

      pwd = fs.root;

    };


    m.newFile = function (ev) {

      ev.preventDefault();
      pwd.getFile("new-file.txt", {create: true}, m.entry, m.err);

    };


    m.entry = function (fe) {

      var node = document.createElement("li");

      af = fe;

      if (fe.isDirectory) {
        node.className = "dir";
      }

      else {
        node.className = "file";
      }

      node.innerHTML = (
        "<a href=\"" + af.fullPath + "\" data-fp=\"" + af.fullPath + "\">" +
        af.name + "</a>"
      );
      info.querySelector("span").innerHTML = "Editing: " + af.fullPath;
      editor.focus();

      tree.appendChild(node);

    };


    m.open = function (ev) {

      var node = ev.target
        , fp;

      ev.preventDefault();

      if (node) {

        // TODO folders

        fp = node.dataset.fp;
        console.log(fp);

        if (af /*&& fp !== af.fullPath*/) {

          pwd.getFile(fp, {}, function (fe) {

            fe.file(function (f) {

              var fr = new w.FileReader;

              fr.onloadend = function () {
                console.log(this.result);
              };

              fr.readAsText(f);

            });

          }, m.err);

        }

      }

    }


    m.save = function (ev) {

      var fw;

      ev.preventDefault();

      if (af) {

        fw = af.createWriter(function (writer) {

          var bb = new w.WebKitBlobBuilder
            , content = editor.innerHTML;

          writer.onwriteend = function () {
            console.log("written");
          }

          writer.onerror = m.err;

          bb.append(content.replace(/<\/[^>]+>/g, ""));
          writer.write(bb.getBlob("text/plain"));

        });

      }

    };


    m.err = function (err) {

      console.log(err);

    };

    return m;

  })();

  w.requestFileSystem || (w.requestFileSystem = w.webkitRequestFileSystem);
  w.requestFileSystem(
      w.TEMPORARY
    , 5*1024*1024
    , fileSystem.init
    , fileSystem.err
  );

})(window);
