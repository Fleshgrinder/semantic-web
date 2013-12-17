$(function () {
	var $output       = $("output");
	var $form         = $("form");
  var $input        = $("input", $form);
  var $navContent   = $("#navcontent");
  var movieTemplate = $("#movie-entry").text();
  var collection    = {};

  function search(event) {
    var searchTerm = $input.val();
    event.preventDefault();

		if (searchTerm.length > 2) {
      linkedmdb(
        "SELECT ?title ?date ?id ?imdb " +
        "WHERE { " +
          "?film <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.linkedmdb.org/resource/movie/film> ; " +
            "<http://www.w3.org/2000/01/rdf-schema#label> ?title ; " +
            "<http://purl.org/dc/terms/date> ?date ; " +
            "<http://data.linkedmdb.org/resource/movie/filmid> ?id ; " +
            "<http://xmlns.com/foaf/0.1/page> ?imdb . " +
          "FILTER(REGEX(?title, '" + searchTerm + "', 'i') && REGEX(STR(?imdb), 'www.imdb.com')) " +
        "}",
        function (data) {
          if (!data || !data.results || !data.results.bindings) {
            alert("no results");
            return;
          }

          var $listGroup = $("<div>", { "class": "list-group" });
          $output.hide().html($listGroup);

          data.results.bindings.forEach(function (movie) {
            var m = {
              id    : movie.id.value,
              title : movie.title.value,
              year  : movie.date.value.substring(0, 4),
              imdb  : movie.imdb.value
            };

            if (collection[m.id]) {
              return;
            }

            $listGroup.append(
              "<a class='list-group-item' href='" + m.id + "' data-title='" + m.title + "' data-year='" + m.year + "' data-imdb='" + m.imdb + "'>" +
                m.title + " (" + m.year + ")" +
              "</a>"
            );
          });

          $output.show();

          $listGroup.on("click", "a", function (event) {
            var $this = $(this);
            var id    = $this.attr("href");
            var title = $this.data("title");
            var year  = $this.data("year");
            var imdb  = $this.data("imdb");
            $("body").addClass("loading");
            event.preventDefault();

            $listGroup.remove();
            $input.val("").focus();

            imdbPoster(imdb, function (poster) {
              marmottaInsert(id, title, year, poster, imdb, function () {
                collection[id] = { title: title, year: year, poster: poster, imdb: imdb };
                $navContent.append("<a class='list-group-item' href='" + id + "'>" + title + " (" + year + ")</a>");
                $("body").removeClass("loading");
              });
            });

            return false;
          });

        }
      );
		}

    return false;
	}

  function marmottaSelect(callback) {
    $.getJSON("http://localhost:8080/marmotta/sparql/select", {
      output: "json",
      query:
        "SELECT ?id ?title ?year ?poster ?imdb " +
        "WHERE { " +
          "?x <http://data.linkedmdb.org/resource/movie/filmid> ?id ; " +
          "<http://purl.org/dc/elements/1.1/title> ?title ; " +
          "<http://purl.org/dc/elements/1.1/date> ?year ; " +
          "<http://movlib.org/poster> ?poster ; " +
          "<http://xmlns.com/foaf/0.1/page> ?imdb . " +
        "} ORDER BY ?title"
    }, callback)
  }

  function marmottaInsert(id, title, year, poster, imdb, callback) {
    $.get("http://localhost:8080/marmotta/sparql/update", {
      query:
        "INSERT DATA { " +
          "<http://movlib.org/movie/" + id + "> " +
          "<http://data.linkedmdb.org/resource/movie/filmid> '" + id + "' ; " +
          "<http://purl.org/dc/elements/1.1/title> '" + title + "' ; " +
          "<http://purl.org/dc/elements/1.1/date> '" + year + "' ; " +
          "<http://movlib.org/poster> '" + poster + "' ; " +
          "<http://xmlns.com/foaf/0.1/page> '" + imdb + "' . " +
        "}"
    }, callback);
  }

  function marmottaDelete(id, callback) {
    $.get("http://localhost:8080/marmotta/sparql/update", {
      query: "DELETE { ?s ?p ?o } WHERE { ?s ?p ?o ; <http://data.linkedmdb.org/resource/movie/filmid> '" + id + "' }"
    }, callback);
  }

  function linkedmdb(query, callback) {
    $.getJSON("http://localhost:666/curl.php", { query: query }, callback)
  }

  function imdbPoster(imdbUrl, callback) {
    $.get("http://localhost:666/curl.php", { imdb: imdbUrl }, callback)
  }

  function showMovie(data, id) {
    var directors = "";
    for (var director in data.director) {
      directors += "<li><a href='" + data.director[director] + "'>" + director + "</a></li>";
    }

    var actors = "";
    for (var actor in data.actor) {
      actors += "<li><a href='" + data.actor[actor] + "'>" + actor + "</a></li>";
    }

    var movie = movieTemplate;
    $output.hide().html(movie.replace("%TITLE%", data.title).replace("%YEAR%", data.year).replace("%IMGSRC%", data.poster).replace("%RUNTIME%", data.runtime).replace("%IMDBLINK%", data.imdb).replace("%ACTORS%", actors).replace("%DIRECTORS%", directors).replace("%RESID%", id)).show();
  };

  $form.submit(search);
  $input.keyup(search);

  marmottaSelect(function (data) {
    data.results.bindings.forEach(function (movie) {
      collection[movie.id.value] = {
        title  : movie.title.value,
        year   : movie.year.value,
        poster : movie.poster.value,
        imdb   : movie.imdb.value
      };
      $navContent.append("<a href='" + movie.id.value + "' class='list-group-item'>" + movie.title.value + " (" + movie.year.value + ")</a>");
    });

    $navContent.removeClass("loading");
  });

  $navContent.on("click", "a", function (e) {
    var $this       = $(this);
    var res         = $this.attr("href");
    collection[res] = collection[res] || {};
    e.preventDefault();

    if (!collection[res].runtime) {
      linkedmdb(
        "SELECT ?id ?runtime ?director ?actor " +
        "WHERE { " +
          "<http://data.linkedmdb.org/resource/film/" + res + "> <http://data.linkedmdb.org/resource/movie/filmid> ?id . " +
          "OPTIONAL { <http://data.linkedmdb.org/resource/film/" + res + "> <http://data.linkedmdb.org/resource/movie/runtime> ?runtime } ." +
          "OPTIONAL { <http://data.linkedmdb.org/resource/film/" + res + "> <http://data.linkedmdb.org/resource/movie/director> ?director } ." +
          "OPTIONAL { <http://data.linkedmdb.org/resource/film/" + res + "> <http://data.linkedmdb.org/resource/movie/actor> ?actor } ." +
        "}",
        function (data) {
          if (!data || !data.results || !data.results.bindings) {
            alert("no result");
          }
          else {
            data.results.bindings.forEach(function (data) {
              if (data.runtime == null) {
                collection[res].runtime = 0;
              }
              else {
                collection[res].runtime = collection[res].runtime || data.runtime.value;
              }
              collection[res].director = collection[res].director || {};
              collection[res].actor    = collection[res].actor || {};

              if (data.director.value) {
                var directorId = data.director.value.split("/").pop();
                if (!collection[res].director[directorId]) {
                  collection[res].director[directorId] = data.director.value;
                }
              }

              if (data.actor.value) {
                var actorId = data.actor.value.split("/").pop();
                if (!collection[res].actor[actorId]) {
                  collection[res].actor[actorId] = data.actor.value;
                }
              }
            });

            showMovie(collection[res], res);
          }
        }
      );
    }
    else {
      showMovie(collection[res], res);
    }

    return false;
  });

  $(document).on("click", ".btn-danger", function () {
    var resId = $(this).val();
    $("body").addClass("loading");
    marmottaDelete(resId, function () {
      $output.html("");
      $("a[href='" + resId + "']", $navContent).remove();
      $("body").removeClass("loading");
    });
  });

});
