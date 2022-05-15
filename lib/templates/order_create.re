open Tyxml;

let createElement = (~title, ~children=[], ()) => {
  <html>
    <head>
      <title> {Html.txt(title)} </title>
      <link rel="stylesheet" href="home.css" />
    </head>
    <body> ...children </body>
  </html>;
};
