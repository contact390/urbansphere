console.log('Requiring register-user module now');
require('./routes/register-user');
setTimeout(()=>{console.log('Done'); process.exit(0)}, 1000);
