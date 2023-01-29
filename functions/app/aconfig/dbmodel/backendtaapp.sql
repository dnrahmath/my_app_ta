/*—---------------------------------------------------------------------*/
/*-----------------------------------------------------------------------*/


DROP DATABASE IF EXISTS backendtaapp;
CREATE DATABASE backendtaapp;

USE backendtaapp;


/*3 new colum*/
DROP TABLE IF EXISTS backendtaapp.tbl_user;
CREATE TABLE backendtaapp.tbl_user (
  `id_user` INT(255) COLLATE utf8mb4_unicode_ci NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `loginvia` JSON DEFAULT NULL,
  `document` JSON DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numb_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `socialmedia` JSON DEFAULT NULL,
  `last_login` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*-----------------------------------------------------------------------*/
/*-----------------------------------------------------------------------*/


DROP TABLE IF EXISTS backendtaapp.tbl_toko;
CREATE TABLE backendtaapp.tbl_toko (
  `id_toko` INT(255) COLLATE utf8mb4_unicode_ci NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_kepalatoko` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telepon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diperbarui` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



/* JSON daftarpembelian */
/* JSON_ARRAY(
              JSON_ARRAY("namaMenu","hargaAwal","XjmlhBeli","hargaAkhir"),
              JSON_ARRAY("Martabak Keju","20000","15","300000")
   ) 
*/
DROP TABLE IF EXISTS backendtaapp.tbl_riwayattransaksi;
CREATE TABLE backendtaapp.tbl_riwayattransaksi (
  `id_nomortransaksi` INT(255) COLLATE utf8mb4_unicode_ci NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_toko` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `daftarpembelian_arr2d` JSON DEFAULT NULL,  /*[["namaMenu","hargaAwal","XjmlhBeli","hargaAkhir"],["Martabak Keju","20000","15","300000"]]*/
  `totalpembayaran` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL, 
  `tanggal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS backendtaapp.tbl_kotaksaran;
CREATE TABLE backendtaapp.tbl_kotaksaran (
  `id_kotaksaran` INT(255) COLLATE utf8mb4_unicode_ci NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_nomortransaksi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_toko` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saran` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



/* didalam aplikasi :*/
/* katalog */