(function (w) {

  var fileSystem = (function () {

    var m = {} // public methods
      , tree // directory tree
      , ad // active tree node directory
      , pwd // present working directory
      , af // active file
      , info // info pane
      , editor; // text editor


    m.init = function (fs) {

      var nFile, nFolder;

      nFile = document.getElementById("new-file");
      nFolder = document.getElementById("new-folder");
      tree = document.getElementById("dir-tree");
      info = document.getElementById("info-pane");

      tree.addEventListener("click", m.dirAction, false);

      document
        .getElementById("save")
        .addEventListener("click", m.save, false);

      nFile.addEventListener("click", m.newFile, false);
      nFolder.addEventListener("click", m.newFolder, false);

      pwd = fs.root;
      ad = tree;

      m.list(pwd);

      editor = CKEDITOR.replace("editor", {"toolbar": "Basic", "height": 400});

    };


    m.newFile = function (ev) {

      ev.preventDefault();
      m.newEntry("file");

    };


    m.newFolder = function (ev) {

      ev.preventDefault();
      m.newEntry("folder");

    };


    m.entry = function (entry, listing) {

      var node = document.createElement("li")
        , appendTo = ad || tree
        , name;

      if (entry.isDirectory) {
        node.className = "dir";
      }

      else {

        node.className = "file";
        af = entry;

      }

      node.innerHTML = (
        "<a " + (!listing ? "class=\"new\"" : "" ) + "href=\"" +
        entry.fullPath + "\" data-fp=\"" + entry.fullPath + "\">" +
        entry.name + "</a>" + "<a href=\"#\" class=\"remove\">x</a>"
      );

      appendTo.appendChild(node);

      if (!listing) {

        name = document.createElement("input");
        name.type = "text";
        name.className = "nf";
        name.value = entry.name;
        name.addEventListener("keyup", m.rename, false);
        name.addEventListener("blur", m.rename, false);

        node.appendChild(name);
        name.focus();

      }

    };


    m.rename = function (ev) {

      var node, name;

      if (ev.type === "blur" || ev.keyCode === 13) {

        name = this.value;
        node = ev.target.previousSibling;
        node.innerHTML = name;
        af.moveTo(pwd, name);

        node.className = "";
        node.parentNode.removeChild(this);

      }

    };


    m.newEntry = function (type) {

      var reader = pwd.createReader()
        , isFile = type === "file";

      reader.readEntries(function (entries) {

        var i = 0
          , newName = isFile ? "new-file.txt" : "new-folder"
          , names = []
          , cur
          , patt;

        for (; i < entries.length; ++i) {

          cur = entries.item(i);

          if (isFile && cur.isFile) {
            names.push(cur.name);
          }

          else if (!isFile && cur.isDirectory) {
            names.push(cur.name);
          }

        }

        patt = new RegExp(newName + "(?:\|\$\||$)");
        names = names.join("|$|");
        i = 0;

        while (names.search(patt) !== -1) {

          i += 1;
          newName = isFile ? "new-file-" + i + ".txt" : "new-folder-" + i;
          patt.compile(newName + "(?:\|\$\||$)");

        }

        if (isFile) {
          pwd.getFile(newName, {create: true}, m.entry, m.err);
        }

        else {
          pwd.getDirectory(newName, {create: true}, m.entry, m.err);
        }

      });

    };


    m.dirAction = function (ev) {

      ev.preventDefault();

      var node = ev.target;

      if (node.className.indexOf("remove") !== -1) {

        m.remove(node.previousSibling);
        return;

      }

      m.open(node);

    };


    m.remove = function (node) {

      var fp = node.dataset.fp;

      pwd.getFile(fp, {}, function (fe) {

        fe.remove(function () {
          node.parentNode.parentNode.removeChild(node.parentNode);
        });

      });

    };


    m.open = function (node) {

      var fp;

      fp = node.dataset.fp;
      node = node.parentNode;

      if (node.className.indexOf("dir") !== -1) {

        pwd.getDirectory(fp, {}, function (de) {

          var subtree = document.createElement("ul");
          node.appendChild(subtree);
          ad = subtree;

          pwd = de;
          m.list(de);

        }, m.err);

      }

      else {

        pwd.getFile(fp, {}, function (fe) {

          af = fe;

          fe.file(function (f) {

            var fr = new w.FileReader;

            fr.onloadend = function () {
              m.setEditor(this.result);
            };

            fr.readAsText(f);

          });

        }, m.err);

      }

    };


    m.list = function (dir) {

      var reader = dir.createReader();

      reader.readEntries(function (result) {

        var i = 0;

        for (; i < result.length; ++i) {
          m.entry(result.item(i), true);
        }

      });

    };


    m.save = function (ev) {

      var fw;

      ev.preventDefault();

      if (af) {

        fw = af.createWriter(function (writer) {

          var bb = new w.WebKitBlobBuilder;

          writer.onwriteend = function () {
            console.log("written"); // TODO feedback save result to usr
          }

          writer.onerror = m.err;

          bb.append(editor.getData());
          writer.write(bb.getBlob("text/plain"));

        });

      }

    };


    m.setEditor = function (content) {

      editor.setData(content || "");
      info.querySelector("span").innerHTML = "Editing: " + af.fullPath;
      editor.focus();

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
