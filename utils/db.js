const mongoose = require('mongoose');
const { type } = require('os');
mongoose.connect('mongodb://localhost:27017/dapodik', {
});

// const Siswa1 = new Siswa({
//     nama: 'apay',
//     email: 'apay@gmail.com',
// });
// Siswa1.save().then((Siswa) => console.log(Siswa));
