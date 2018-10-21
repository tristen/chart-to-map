chart-to-map
---

Utility for matching SVG layers to Mapbox GL style templates.

### Installation

**Prerequisite**: Node 6 (or higher)

```sh
git clone git@github.com:mapbox/chart-to-map
cd chart-to-map
npm link
```

### Usage

```sh
Usage
    $ chart2map --from <input> --to <input>

  Options
    --from, -f  Provide a from input. This is where changes will be read from. Must be a SVG file or Mapbox style template.
    --to, -t  Provide a to input. This is where changes will updated on. Must be a SVG file or Mapbox style template.

  Examples
    $ chart2map --from foo.svg --to style.json
    $ chart2map --from style.json --to foo.svg
```

### Setup

There's some initial setup for this to work:

- **A map template** complete with the layers required to style the map. It 
doesn't need to be styled but it does need to have layers pointing to the 
sources required.

- **An SVG file** The file can have any number of arbitrary objects. The only 
layers the converter cares about are layers with names matching layer names
in the style, followed by double underscore, followed by either `all` to
represent all layers or a number to represent what zoom stop the style should
be applied on. Here's a couple examples:

    - background__all
    - water__2
    - water__12
