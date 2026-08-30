const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/icon.png');

try {
  const buffer = fs.readFileSync(filePath);
  console.log('File size:', buffer.length);
  console.log('First 8 bytes:', buffer.slice(0, 8).toString('hex'));
  
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    console.log('✅ Valid PNG header found.');
  } else {
    console.log('❌ NOT a valid PNG header.');
  }
} catch (err) {
  console.error(err);
}
