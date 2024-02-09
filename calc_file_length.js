const fs = require('fs');

// Synchronous version
const stats = fs.statSync('NOR4161.jpg');
const fileSizeInBytes = stats.size;

console.log("file size is: ", fileSizeInBytes);
