$(function () {
	
	var $mission = $(".lead");
	
	var $output = $("output");
	
	var $form = $("#form");
	
	var $input = $("input").keyup(function (e) {
		e.preventDefault();
		
		if ($input.val().length < 3) {
			return false;
		}
		
		//$.post("http://data.linkedmdb.org/sparql?query=SELECT" + encodeURI($input.val()) + "");
		$output.html("<pre>" + encodeURI('SELECT ?title ?year ?director WHERE { ?film <http://www.w3.org/2000/01/rdf-schema#label> ?title ; <http://purl.org/dc/elements/1.1/date> ?year ; <http://data.linkedmdb.org/resource/movie/director> ?director . FILTER(REGEX(?title, "", "i")) }') + "</pre>").slideDown("slow");
		
		return false;
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
