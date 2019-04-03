const Color = require('color');

const config = { data: {}, layerAllocations: {} };

config.data.baselinegrid = {space: {}};
config.data.baselinegrid.space.extra_small_in_px = '!expression font.size_in_px * 0.75';
config.data.baselinegrid.space.small_in_px = '!expression baselinegrid.space.extra_small_in_px * 2';
config.data.baselinegrid.space.smallish_in_px = '!expression baselinegrid.space.small_in_px * 1.5';
config.data.baselinegrid.space.medium_in_px = '!expression baselinegrid.space.small_in_px * 2';
config.data.baselinegrid.space.large_in_px = '!expression baselinegrid.space.small_in_px * 3';
config.data.baselinegrid.space.extra_large_in_px = '!expression baselinegrid.space.small_in_px * 5';

config.data.breakpoint = {site: {}};
config.data.breakpoint.site.x_small_in_px = 320;
config.data.breakpoint.site.small_in_px = 480;
config.data.breakpoint.site.medium_in_px = 730;
config.data.breakpoint.site.wide_in_px = 900;
config.data.breakpoint.site.x_wide_in_px = 1200;

config.data.grid = { edge_space: {} };
config.data.grid.min_width_in_px = 320;
config.data.grid.max_width_in_px = 1114;
config.data.grid.main_column_count = 12;
config.data.grid.edge_space.medium_in_vw = 7;
config.data.grid.edge_space.large_in_vw = 14;
config.data.grid.column_gap_in_percent = 1.6;
config.data.grid.divider_size_in_px = 1;

config.data.color = { primary: {}, text: {} };
config.data.color.background = Color('#fff');
config.data.color.primary.normal = Color('#0288d1');
config.data.color.primary.light = Color('#b3e5fc');
config.data.color.primary.dark = Color('#0277bd');
config.data.color.text.normal = Color('#212121');
config.data.color.text.reverse = Color('#fff');
config.data.color.text.secondary = Color('#888');
config.data.color.text.secondary__reverse = Color('#9e9e9e');
config.data.color.text.placeholder = Color('#bdbdbd');
config.data.color.text.dividers = Color('#e0e0e0');
config.data.color.text.dividers__reverse = Color('#616161');
config.data.color.text.ui_background = Color('#fff');
config.data.color.text.ui_background_hue = Color('#f5f5f5');
config.data.color.text.ui_code = Color('#f7f7f7');
config.data.color.text.ui_background__reverse = Color('#212121');
config.data.color.text.ui_background_hue__reverse = Color('#333');
config.data.color.information = Color('#0288d1');
config.data.color.success = Color('#629f43');
config.data.color.success_dark = Color('#569037');
config.data.color.attention = Color('#cf0c4e');
config.data.color.warning = Color('#e65100');

config.data.font = { letterspacing: {} };
config.data.font.primary = '"Noto Serif", serif';
config.data.font.secondary = '"Noto Sans", Arial, Helvetica, sans-serif';
config.data.font.monospace = '"Courier 10 Pitch", Courier, monospace';
config.data.font.size_in_px = 16;
config.data.font.letterspacing.label_in_px = 0.5;

// Specify the top level properties to be distributed to layers (sass, js & templates)
config.layerAllocations = {
  sass: ['baselinegrid', 'breakpoint', 'color', 'font', 'grid'],
  js: ['breakpoint'],
  // template: ['breakpoint']
};

module.exports = config;
