Libero pattern library  
======================  

## Developing with the pattern library
Developer quick start: running `docker-compose down --volumes && docker-compose up --build` will set up the pattern environment, run gulp and start the pattern library web server. The UI is available at http://localhost:8889/.  

### Configuration
 
#### Uses of configuration  
Configuration is used to be the single source of truth for knowledge that needs to be shared across across front end technology boundaries. For example, media query breakpoint values need to exist in the styling layer, but they are also often needed by JavaScript. Note that for flexibility all configuration could be maintained using this system in order to make it easier to later distribute configuration if it suddenly becomes necessary.  
  
#### Anatomy of configuration  
(All config file code examples are taken from `/libero-config/config--libero-default.js`.)  

##### Simple example
`config.data` is where you define your configuration data.
Here `config.data` defines the the `small` and `medium` site breakpoints:  
  
```  
config.data.breakpoint = {site: {}};  
config.data.breakpoint.site.small = 480;  
config.data.breakpoint.site.medium = 730;  
```  
   
`config.layerAllocations` specifies which technology layers the properties of `config.data` are distributed to. Continuing the above example:  
```  
config.layerAllocations = {  
 sass: ['breakpoint'],
 js: ['breakpoint'],
 template: ['breakpoint'] };
 ```  
specifies that the `breakpoint` config must be distributed to all three available layers: the sass, JavaScript and the templating layer.  

##### Advanced example
Sometimes configuration values depend on other configuration values, for example measures in a grid system. To be able to maintain these relationships even when the underlying predicate value may be modified by a later-loading config file, the calculation of the final value determined by these relationships must be deferred until all specified configurations are loaded and parsed. This is achieved by specifying these simple mathematical expressions in the format:
```
'!expression [some simple mathematical expression]'
```
Using this we can specify the baseline grid as:
```
config.data.baselinegrid = {space: {}};  
config.data.baselinegrid.space.extra_small_in_px = 12;  
config.data.baselinegrid.space.small_in_px = '!expression baselinegrid.space.extra_small_in_px * 2';  
config.data.baselinegrid.space.smallish_in_px = '!expression baselinegrid.space.small_in_px * 1.5';  
config.data.baselinegrid.space.medium_in_px = '!expression baselinegrid.space.small_in_px * 2';
...
```
The result is that `config.data.baselinegrid.space.small_in_px` will have the value twice that of whatever the final value of `config.data.baselinegrid.space.extra_small_in_px`is, *even if `config.data.baselinegrid.space.extra_small_in_px` is modified by a later loading config*. This provides a way of reusing the essentials of the baseline grid system, but basing it on a different key value as required.

#### Distributing configuration  
##### Distributing to SASS  
Each property of `config.data` specified in `config.layerAllocations.sass` is eventually written as a SASS file to  `/source/sass/variables/[propertyname].sass`. Each of these files contains the SASS variables describing the config for that property. Looking at the `breakpoint` example again, this config  
  
```  
// specified in a config file  
config.data.breakpoint = {site: {}};  
config.data.breakpoint.site.small = 480;  
config.data.breakpoint.site.medium = 730;  
  
config.layerAllocations.sass = ['breakpoint'];  
```  
  
generates this file:  
```  
// /source/sass/variables/breakpoint.sass  
$breakpoint-site-small: 480;  
$breakpoint-site-medium: 730;  
```   
##### Distributing to JavaScript  
Each property of `config.data` specified in `config.layerAllocations.jss` is eventually written to `/source/js/derivedConfig.json`.  Looking at the `breakpoint` example again, this config:    
  
```js  
// specified in a config file  
config.data.breakpoint = {site: {}};  
config.data.breakpoint.site.small = 480;
config.data.breakpoint.site.medium = 730;  
config.layerAllocations.js = ['breakpoint'];
```  
  
adds this into `configForJs.json`:  
```  
// /source/js/derivedConfig.json  
...  
{"breakpoint":{"site":{"small":480,"medium":730}}}  
...  
```  
  ##### Distributing to templates
  [Not yet implemented]
  
## Pipeline  
  
The build process uses a Node.js container image to build all assets, and copy them out of the container into `export/`.  
  
`export/` can then be packaged to be released on Github, or reused elsewhere.

## Grid system
### Concept
The grid comprises a full-viewport-width grid within which is a central section of 12<sup>*</sup> equal-sized columns. The central 12 columns are collectively known as the `main` part of the grid, which holds the content of the page. The full width of the grid from viewport edge to viewport edge is known as the `full` width grid. The `full` width grid exists in order to allow items of content to give the impression of breaking out of the (`main` part of the) grid. It should also make it easier to implement [subgrids](https://www.w3.org/TR/css-grid-2/#subgrids) when they get browser support.

<sup>*</sup>12 is the default number of columns, but this can be configured. See "Configuring the grid" below. 

### Implementation
The grid is implemented using CSS grid. Non-supporting browsers will display a single centred column, constrained to the specified max width, with a minimum inline start / end page gutter set the same as the grid column gap. 

Page templates implementing this grid system should use the `03-templates/page-grid/page-grid.twig` grid template directly. `page-grid.twig` sets up the rows of the top level explicit grid, and handles loading of the lower order grids that directly control content layout with respect to the grid columns (e.g. `03-templates/content-grid/content-grid.twig`).  

In order to preserve the capabilities of seeming to break out of the grid, and of attempting to be future-friendly to sub grids, every lower order grid (i.e. below the level of `page-grid`) must span the `full` width of the grid, and, in addition to anything else the template does, supply css classes to allow its items to span the `full` or `main` width of the grid. For example the `content-grid` provides the css classes `content-grid__item--full` and `content-grid__item--main` respectively.

All nested levels of grid must conform to this `main` / `full` model in order to retain the benefits of this approach.

#### Grid templates

##### `page-grid`
The top level page grid. It sets up the rows of the top level explicit grid as named areas `start`, `main` and `end`. Typically `start` and `end` would be used to hold the site header and site footer respectively, with everything else located in the `main` row. This is the template to include directly in implementations. Lower level grids, into which the page content actually loads, should be included by `page-grid`.

###### grid areas recommended usage
- `start`: put the site header here
- `main`: put everything between the site header and footer here       
- `end`: put the site footer here

##### `content-grid`
The grid for all content pages (i.e. not listing pages). In addition to the capability to specify if content spans the entirety of the `main` or `full` sections, this grid defines areas called `primary`, `secondary`, and `menu`. These names are used for both the CSS grid area names and the twig template section names. This grid lays out content with a very similar layout to that of an eLife article.

###### grid areas recommended usage
- `primary`: the content that makes this page what it is
- `secondary`: supplementary info, typically used for asides       
- `menu`: a menu / navigation appropriate to the content level
   

#### Configuring the grid
The grid may be configured using the following Sass variables:

- `$grid-max_width` the max width of the `main` grid section in pixels (default: `1114px`)
- `$grid-main_column_count` the number of columns in the `main` area of the grid (default: `12`).
- `$grid-column_gap` the width between grid columns, also the minimum inline start / end page gutter when CSS grid is not supported by the browser; may be expressed in any css length unit (default: `1.6%`)  
- `$grid-edge_space-medium`: a medium sized inline start / end page gutter (default: `7vw`), usage controlled by a breakpoint
- `$grid-edge_space-large`: a large inline start / end page gutter (default: `14vw`), usage controlled by a breakpoint

     

## Styling

### CSS Custom Properties
These guidelines govern the use of custom properties in this codebase:

1. constant values should be defined in SCSS; there is no need to express these as custom properties
1. use a custom property when a css property changes e.g. in response to DOM conditions (e.g. `:focus`), media queries or via JavaScript
1. global values (i.e. those set on `:root`) should be named in uppercase to indicate they're global. (Aside: as we're not doing any theming, there shouldn't be many of these.)
1. when using a css custom property for a changeable value, change its value, don't assign a different custom property on the change. For example:
    ```
    // Fallbacks omitted for clarity
    
    .component {
    
      --font-size: $font-size-small;
          
      @media ([condition]) {
        
        --font-size: $font-size-large;      
      
      }

      font-size: var(--font-size);
           
    }
    ``` 
1. for a property that changes, separate the logic of controlling the change from the implementation of the value (see previous example). This means every time you see `var(--something)`, you know that will be subject to a changing value
1. beware of being too clever: keep the code easily readable
1. to deal with non-supporting browsers, fallback using double declaration:
    ```
    .component {
    
      font-size: $font-size-small;
      --font-size: $font-size-small;
          
      @media ([condition]) {
    
        font-size: $font-size-large;        
        --font-size: $font-size-large;      
      
      }

      font-size: var(--font-size);
           
    }
    ``` 
 
### Margins

This codebase follows [single-direction margin declarations](https://csswizardry.com/2012/06/single-direction-margin-declarations/), that is margins should only be specified on `block-end` and `inline-end`. There may be exceptions, though.

### Padding

Margins are generally preferred to padding for whitespace (due to [margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing)), but the latter can be used when relevant.

Getting help
------------

- Report a bug or request a feature on [GitHub](https://github.com/libero/libero/issues/new/choose).
- Ask a question on the [Libero Community Slack](https://libero-community.slack.com/).
- Read the [code of conduct](https://libero.pub/code-of-conduct).
