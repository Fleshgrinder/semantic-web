$(function () {

  function marmotta(cmd, query, callback) {
    $.getJSON("http://localhost:8080/marmotta" + cmd, { output: "json", query: query }, callback).fail(function (jqxhr, textStatus, error) {
      console && console.log(jqxhr) && console.log(textStatus) && console.log(error);
    });
  }

  function linkedmdb(query, callback) {
    $.getJSON("http://localhost:666/curl.php", { query: query }, callback).fail(function (jqxhr, textStatus, error) {
      console && console.log(jqxhr) && console.log(textStatus) && console.log(error);
    });
  }

  function imdbPoster(imdbUrl, callback) {
    $.get("http://localhost:666/curl.php", { imdb: imdbUrl }, callback).fail(function (jqxhr, textStatus, error) {
      console && console.log(jqxhr) && console.log(textStatus) && console.log(error);
    });
  }

	var $mission = $(".lead");

	var $output = $("output");

	var $form = $("#form");

  var $navContent = $("#navcontent .list-group");

  var movieTemplate = $("#movie-entry").text();

  // Fetch our movies from Marmotta
  marmotta(
    "/sparql/select",
    "SELECT ?uri ?poster ?title ?year WHERE { ?uri <http://www.w3.org/2000/01/rdf-schema#label> 'movie' ; <http://purl.org/dc/terms/title> ?title ; <http://purl.org/dc/terms/date> ?year ; <http://movlib.org/poster> ?poster } ORDER BY ?name",
    function (data) {
      data.results.bindings.forEach(function (movie) {
        $navContent.append("<a href='" + movie.uri.value + "' class='list-group-item' data-poster='" + movie.poster.value + "'><span class='title'>" + movie.title.value + "</span> (<span class='year'>" + movie.year.value + "</span>)</a>");
      });

      $("#preload").fadeOut(function () {
        $(this).remove();
      });

      $("a", $navContent).click(function (e) {
        var $this = $(this);
        e.preventDefault();
        // block UI
        linkedmdb(
          "SELECT ?imdb ?runtime ?director ?actor WHERE { <http://data.linkedmdb.org/resource/film/2014> <http://xmlns.com/foaf/0.1/page> ?imdb ; <http://data.linkedmdb.org/resource/movie/runtime> ?runtime ; <http://data.linkedmdb.org/resource/movie/director> ?director ; <http://data.linkedmdb.org/resource/movie/actor> ?actor . FILTER(REGEX(STR(?imdb), 'www.imdb.com')) }",
          function (data) {
            movieTemplate
              .replace("%TITLE%", $(".title", $this).text())
              .replace("%YEAR%", $(".year", $this).text())
              .replace("%IMGSRC%", $this.data("poster"))
            ;
            console.log(data);
          }
        );
        return false;
      });
    }
  );

	var $input = $("input").keyup(function () {
		if ($input.val().length > 2) {
      $(".alert").remove();
      linkedmdb(
        "SELECT ?title ?date ?id ?imdb WHERE { ?film <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.linkedmdb.org/resource/movie/film> ; <http://www.w3.org/2000/01/rdf-schema#label> ?title ; <http://purl.org/dc/terms/date> ?date ; <http://data.linkedmdb.org/resource/movie/filmid> ?id ; <http://xmlns.com/foaf/0.1/page> ?imdb . FILTER(REGEX(?title, '" + $input.val() + "', 'i') && REGEX(STR(?imdb), 'www.imdb.com')) }",
        function (data) {
          if (!data || !data.results || !data.results.bindings) {
            $output.html("<div class='alert alert-danger'>No Results!</div>");
            return;
          }
          var $listGroup = $("<div>", { "class": "list-group" });
          $output.html($listGroup).show();
          data.results.bindings.forEach(function (movie) {
            $listGroup.append($("<a>", {
              "class": "list-group-item",
              href: "#" + movie.id.value,
              html: movie.title.value + " (" + movie.date.value.substring(0, 4) + ")"
            }).data({ id: movie.id.value, title: movie.title.value, year: movie.date.value.substring(0, 4), imdb: movie.imdb.value }));
          });
          $listGroup.on("click", "a", function (event) {
            var $this = $(this);
            event.preventDefault();
            imdbPoster($this.data("imdb"), function (src) {

              marmotta(
                "/sparql/update",
                "INSERT DATA { <http://movlib.org/movie/" + $this.data("id") + "> " +
                  "<http://purl.org/dc/elements/1.1/title> '" + $this.data("title") + "' ;" +
                  "<http://purl.org/dc/elements/1.1/date> '" + $this.data("year") + "' ;" +
                  "<http://movlib.org/poster> '" + src + "'" +
                "}",
                function (data) {
                  console.log(data);
                }
              );
            });
            return false;
          });
        }
      );
		}
	});

	$("nav button").click(function (e) {
		e.preventDefault();

		$output.add($mission).slideUp("slow", function () {
			$form.slideDown("slow", function () {
				$input.focus();
			});
		});

		return false;
	});

});
