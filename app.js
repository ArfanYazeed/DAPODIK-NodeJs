const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult } = require('express-validator');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

require('./utils/db');
const Siswa = require('./model/siswa');

const app = express();
const port = 2000;

// Middleware methodOverride
app.use(methodOverride('_method'));

// Setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Konfigurasi flash dan session
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 1800000 },
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Middleware untuk autentikasi
function isAuthenticated(req, res, next) {
  if (req.session.isLoggedIn) {
    return next();
  }
  res.redirect('/');
}

// Halaman Login
app.get('/', (req, res) => {
  const error = req.flash('error'); 
  res.render('login', { 
    error,
    layout: 'login',
    title: 'login',
   }); 
});


// Proses Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    req.session.isLoggedIn = true;
    req.session.username = username;
    res.redirect('/home');
  } else {
    req.flash('error', 'Username atau password salah!');
    res.redirect('/'); 
  }
});

// Halaman Home (dilindungi autentikasi)
app.get('/home', isAuthenticated, async (req, res) => {
  const siswas = await Siswa.find();
  res.render('index', {
    title: 'Home',
    layout: 'layouts/main-layouts',
    siswa: siswas,
    username: req.session.username,
  });
});

// Halaman About
app.get('/about', (req, res) => {
  res.render('about', {
    layout: 'layouts/main-layouts',
    title: 'About me',
  });
});

// Halaman Data Siswa
app.get('/dataSiswa', async (req, res) => {
  const siswas = await Siswa.find();
  res.render('siswa', {
    layout: 'layouts/main-layouts',
    title: 'Daftar Siswa',
    siswas,
    msg: req.flash('msg'),
  });
});

// Halaman Form Tambah Siswa
app.get('/dataSiswa/add', (req, res) => {
  res.render('add-siswa', {
    title: 'Form Mendaftarkan Siswa',
    layout: 'layouts/main-layouts',
  });
});

// Proses Tambah Siswa
app.post(
  '/dataSiswa',
  [
    body('nama').custom(async (value) => {
      const duplikat = await Siswa.findOne({ nama: value });
      if (duplikat) {
        throw new Error('Namamu Sudah Terdaftar!');
      }
      return true;
    }),
    body('nisn').custom(async (value) => {
      const duplikatNisn = await Siswa.findOne({ nisn: value });
      if (duplikatNisn) {
        throw new Error('NISN Sudah Terdaftar!');
      }
      return true;
    }),
    body('nik').custom(async (value) => {
      const duplikatNik = await Siswa.findOne({ nik: value });
      if (duplikatNik) {
        throw new Error('NIK Sudah Terdaftar!');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('add-siswa', {
        title: 'Form Tambah Data Contact',
        layout: 'layouts/main-layouts',
        errors: errors.array(),
      });
    } else {
      try {
        const siswaData = req.body;
        await Siswa.insertMany([siswaData]);
        req.flash('msg', 'Data Contact Berhasil Ditambahkan!');
        res.redirect('/dataSiswa');
      } catch (error) {
        console.error('Error inserting siswa:', error);
        res.status(500).send('Terjadi kesalahan saat menyimpan data.');
      }
    }
  }
);

// Proses Delete Siswa
app.delete('/dataSiswa', (req, res) => {
  Siswa.deleteOne({ nisn: req.body.nisn }).then(() => {
    req.flash('msg', 'Data Siswa Berhasil Dihapus!');
    res.redirect('/dataSiswa');
  });
});

// Halaman Edit Siswa
app.get('/dataSiswa/edit/:nisn', async (req, res) => {
  try {
    const siswa = await Siswa.findOne({ nisn: req.params.nisn });

    if (!siswa) {
      return res.status(404).send('Siswa tidak ditemukan');
    }
    // Mengonversi tgl_masuk ke format YYYY-MM-DD
    const formattedTglMasuk = siswa.tgl_masuk ? siswa.tgl_masuk.toISOString().split('T')[0] : '';
    // Mengirim data siswa dengan tgl_masuk yang sudah diformat
    res.render('edit-siswa', {
      title: 'Edit Data',
      layout: 'layouts/main-layouts',
      siswa: { ...siswa.toObject(), tgl_masuk: formattedTglMasuk }  // pastikan siswa dikirim dalam format objek biasa
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan pada server');
  }
});


// Proses Ubah Data
app.put(
  '/dataSiswa',
  [
    body('nisn').custom(async (value, { req }) => {
      const duplikat = await Siswa.findOne({ nisn: value });
      if (value !== req.body.oldNisn && duplikat) {
        throw new Error('Nama Sudah Terdaftar!');
      }
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('edit-siswa', {
        title: 'Mengubah Data Contact',
        layout: 'layouts/main-layouts',
        errors: errors.array(),
        siswa: req.body,
      });
    } else {
      Siswa.updateOne(
        { nisn: req.body.nisn },
        {
          $set: {
            tingkat: req.body.tingkat,
            rombel: req.body.rombel,
            tgl_masuk: req.body.tgl_masuk,
            terdaftar: req.body.terdaftar,
          },
        }
      ).then(() => {
        req.flash('msg', 'Selamat! Data Siswa Berhasil Diubah!');
        res.redirect('/dataSiswa');
      });
    }
  }
);


app.listen(port, () => {
  console.log(`Mongo contact app | listening at http://localhost:${port}`);
});
