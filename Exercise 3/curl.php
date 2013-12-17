<?php

ini_set("display_errors", 1);
error_reporting(-1);
ini_set("default_socket_timeout", 2);

if (isset($_GET["query"])) {
  header("content-type: application/json; charset=utf-8");
  $query = rawurlencode(filter_input(INPUT_GET, "query"));
  exit(file_get_contents("http://data.linkedmdb.org/sparql?query={$query}&output=json"));
}

if (isset($_GET["imdb"])) {
  header("content-type: text/plain; charset=utf-8");
  require "vendor/electrolinux/phpquery/phpQuery/phpQuery.php";
  exit(phpQuery::newDocumentHTML(file_get_contents($v["imdb"]["value"]))["#img_primary img"]->attr("src"));
}
