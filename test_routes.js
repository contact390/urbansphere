console.log('Testing route file loads...');

try {
  console.log('Loading admin.js...');
  require('./routes/admin.js');
  console.log('✓ admin.js loaded OK');
} catch(e) {
  console.error('✗ admin.js error:', e.message);
  console.error(e.stack);
}

try {
  console.log('Loading testimonials_plug_play_office.js...');
  require('./routes/testimonials_plug_play_office.js');
  console.log('✓ testimonials_plug_play_office.js loaded OK');
} catch(e) {
  console.error('✗ testimonials_plug_play_office.js error:', e.message);
  console.error(e.stack);
}

try {
  console.log('Loading add_location_plug_play_office.js...');
  require('./routes/add_location_plug_play_office.js');
  console.log('✓ add_location_plug_play_office.js loaded OK');
} catch(e) {
  console.error('✗ add_location_plug_play_office.js error:', e.message);
  console.error(e.stack);
}

console.log('\nAll routes tested.');
process.exit(0);
