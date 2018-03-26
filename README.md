xd-to-style
---

Utility for matching Adobe XD layer objects to a Mapbox GL style template.
See video demoing it in action: [https://vimeo.com/261860280](https://vimeo.com/261860280).

### Installation

**Prerequisite**: Node 6 (or higher)

### Setup & Usage

There's some initial setup for this to work:

- **A map template** complete with the layers required to style the map. It 
doesn't need to be styled but it does need to have layers pointing to the 
sources required.

- **An XD file** The file can have any number of arbitrary objects. The only 
layers the converter cares about are layers with names matching layer names
in the style, followed by double underscore, followed by either `all` to
represent all layers or a number to represent what zoom stop the style should
be applied on. Here's a couple examples:

    - background__all
    - water__2
    - water__12

The command to convert looks like this:

    ./index.js input.xd style.json 

If it returns nicely, a file named `xd_style.json` will have been created in 
directory the command ran from.
